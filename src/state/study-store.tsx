import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { ActivityIndicator } from 'react-native';

import { initialReadyTopicIds } from '@/data/roadmap';
import type { Attempt, Question, StudySession } from '@/types/study';

const key = 'aws-practice-study-v1';
type State = {
  version: 1; readyTopicIds: string[]; checkedSubtopicIds: string[]; bookmarkedNoteIds: string[];
  bookmarkedQuestions: Question[]; attempts: Attempt[]; sessions: StudySession[];
};
const initial: State = { version: 1, readyTopicIds: initialReadyTopicIds, checkedSubtopicIds: [], bookmarkedNoteIds: [], bookmarkedQuestions: [], attempts: [], sessions: [] };
type Store = {
  state: State; hydrated: boolean;
  setReady: (id: string, ready: boolean) => void; toggleSubtopic: (id: string) => void;
  toggleNote: (id: string) => void; toggleQuestion: (question: Question) => void;
  recordAttempt: (attempt: Attempt) => void;
  updateSession: (id: string, update: (previous: StudySession | undefined) => StudySession | undefined) => void;
};
const Context = createContext<Store | null>(null);
const toggle = (items: string[], id: string) => items.includes(id) ? items.filter((item) => item !== id) : [...items, id];

export function StudyProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State>(initial);
  const [hydrated, setHydrated] = useState(false);
  const writes = useRef<Promise<unknown>>(Promise.resolve());
  useEffect(() => { let mounted = true; void AsyncStorage.getItem(key).then((raw) => {
    if (!mounted || !raw) return;
    try {
      const value = JSON.parse(raw) as State;
      if (value.version === 1 && Array.isArray(value.sessions) && Array.isArray(value.attempts) && Array.isArray(value.readyTopicIds)) setState(value);
    } catch { /* Keep a clean local state if storage is corrupt. */ }
  }).catch(() => undefined).finally(() => { if (mounted) setHydrated(true); }); return () => { mounted = false; }; }, []);
  useEffect(() => { if (hydrated) {
    const serialized = JSON.stringify(state);
    writes.current = writes.current.then(() => AsyncStorage.setItem(key, serialized)).catch(() => undefined);
  } }, [state, hydrated]);
  const store = useMemo<Store>(() => ({ state, hydrated,
    setReady: (id, ready) => setState((old) => ({ ...old, readyTopicIds: ready ? Array.from(new Set([...old.readyTopicIds, id])) : old.readyTopicIds.filter((item) => item !== id) })),
    toggleSubtopic: (id) => setState((old) => ({ ...old, checkedSubtopicIds: toggle(old.checkedSubtopicIds, id) })),
    toggleNote: (id) => setState((old) => ({ ...old, bookmarkedNoteIds: toggle(old.bookmarkedNoteIds, id) })),
    toggleQuestion: (question) => setState((old) => ({ ...old, bookmarkedQuestions: old.bookmarkedQuestions.some((item) => item.id === question.id) ? old.bookmarkedQuestions.filter((item) => item.id !== question.id) : [...old.bookmarkedQuestions, question] })),
    recordAttempt: (attempt) => setState((old) => ({ ...old, attempts: old.attempts.some((item) => item.sessionId === attempt.sessionId && item.question.id === attempt.question.id) ? old.attempts : [...old.attempts, attempt] })),
    updateSession: (id, update) => setState((old) => { const next = update(old.sessions.find((item) => item.id === id)); return { ...old, sessions: next ? [...old.sessions.filter((item) => item.id !== id), next] : old.sessions.filter((item) => item.id !== id) }; }),
  }), [state, hydrated]);
  return <Context.Provider value={store}>{hydrated ? children : <ActivityIndicator style={{ flex: 1 }} />}</Context.Provider>;
}
export function useStudyStore() { const value = useContext(Context); if (!value) throw new Error('StudyProvider missing'); return value; }

export function latestMistakes(attempts: Attempt[]): Attempt[] {
  const latest = new Map<string, Attempt>();
  for (const attempt of attempts) latest.set(attempt.question.id, attempt);
  return [...latest.values()].filter((item) => !item.correct).reverse();
}
