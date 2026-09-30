import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Card, PrimaryButton, Screen, studyStyles } from '@/components/study/primitives';
import { Choices } from '@/components/study/setup';
import { getTopic, topics } from '@/data/roadmap';
import { makeSession } from '@/domain/session-engine';
import { useTheme } from '@/hooks/use-theme';
import { useStudyStore } from '@/state/study-store';
import type { SessionDifficulty } from '@/types/study';

export default function PracticeScreen() {
  const { topic, subtopic } = useLocalSearchParams<{ topic?: string; subtopic?: string }>();
  return <PracticeContent key={`${topic ?? ''}:${subtopic ?? ''}`} topic={topic} subtopic={subtopic} />;
}

function PracticeContent({ topic, subtopic }: { topic?: string; subtopic?: string }) {
  const theme = useTheme(); const { state, hydrated, setReady, updateSession } = useStudyStore();
  const ready = topics.filter((item) => state.readyTopicIds.includes(item.id));
  const [topicId, setTopicId] = useState(getTopic(topic ?? '')?.id ?? ready[0]?.id ?? topics[0].id);
  const effectiveTopicId = getTopic(topicId)?.id ?? topics[0].id;
  const [length, setLength] = useState<10 | 20 | 40>(10);
  const [difficulty, setDifficulty] = useState<SessionDifficulty>('exam');
  const [selected, setSelected] = useState<string[]>(ready.map((item) => item.id));
  const unfinished = state.sessions.filter((item) => item.status === 'active' && !['custom', 'full'].includes(item.mode)).reverse();
  function start(mode: 'quick' | 'topic' | 'mixed' | 'revision') {
    const ids = mode === 'topic' ? [effectiveTopicId] : mode === 'mixed' ? selected.filter((item) => state.readyTopicIds.includes(item)) : ready.map((item) => item.id);
    if (!ids.length) return;
    const currentSubtopic = mode === 'topic' && effectiveTopicId === topic && getTopic(effectiveTopicId)?.subtopics.some((item) => item.title === subtopic) ? subtopic : undefined;
    const session = makeSession(mode, ids, mode === 'quick' ? 5 : mode === 'topic' ? length : mode === 'revision' ? 1 : 40, mode === 'quick' || mode === 'mixed' || mode === 'revision' ? 'exam' : difficulty, state.attempts.length, currentSubtopic);
    if (mode === 'revision') session.deadlineAt = new Date(Date.now() + 15 * 60_000).toISOString();
    updateSession(session.id, () => session);
    router.push({ pathname: '/session/[id]', params: { id: session.id } });
  }
  return <Screen><Text style={[studyStyles.pageTitle, { color: theme.text }]}>Practice</Text>
    <Text style={[studyStyles.subtitle, { color: theme.textSecondary }]}>Choose any topic for Topic Practice. Quick and Mixed use only your Ready topics.</Text>
    {!hydrated && <Text style={[studyStyles.small, { color: theme.textSecondary }]}>Loading your saved study data...</Text>}
    {unfinished.map((item) => <PrimaryButton key={item.id} title={`Resume ${item.title} · ${item.index + 1}/${item.target}`} onPress={() => router.push({ pathname: '/session/[id]', params: { id: item.id } })} secondary />)}
    <Card><Text style={[studyStyles.cardTitle, { color: theme.text }]}>Quick Practice</Text><Text style={[studyStyles.small, { color: theme.textSecondary }]}>5 questions balanced across Ready topics and subtopics.</Text><PrimaryButton title="Start 5 questions" disabled={!hydrated || !ready.length} onPress={() => start('quick')} /></Card>
    <Card><Text style={[studyStyles.cardTitle, { color: theme.text }]}>Topic Practice</Text>
      <Choices label="Topic" values={topics.map((item) => ({ value: item.id, title: item.name }))} selected={effectiveTopicId} onChange={setTopicId} />
      {!state.readyTopicIds.includes(effectiveTopicId) && <><Text style={[studyStyles.small, { color: theme.textSecondary }]}>This topic is not marked Ready yet. You can still practice it here.</Text><PrimaryButton title="Add to Quick and Mixed" disabled={!hydrated} onPress={() => { setReady(effectiveTopicId, true); setSelected((old) => [...new Set([...old, effectiveTopicId])]); }} secondary /></>}
      <Choices label="Questions" values={[10, 20, 40].map((value) => ({ value: value as 10 | 20 | 40, title: `${value}` }))} selected={length} onChange={setLength} />
      <Choices label="Difficulty" values={(['basic', 'exam', 'tricky', 'mixed'] as const).map((value) => ({ value, title: value[0].toUpperCase() + value.slice(1) }))} selected={difficulty} onChange={setDifficulty} />
      <PrimaryButton title="Start Topic Practice" disabled={!hydrated} onPress={() => start('topic')} /></Card>
    <Card><Text style={[studyStyles.cardTitle, { color: theme.text }]}>Mixed Practice</Text><Text style={[studyStyles.small, { color: theme.textSecondary }]}>40 exam-style questions from selected Ready topics.</Text>
      <View style={{ gap: 4 }}>{ready.map((item) => <Pressable key={item.id} accessibilityRole="checkbox" accessibilityState={{ checked: selected.includes(item.id) }} onPress={() => setSelected((old) => old.includes(item.id) ? old.filter((id) => id !== item.id) : [...old, item.id])} style={{ minHeight: 42, flexDirection: 'row', alignItems: 'center', gap: 10 }}><Text style={[studyStyles.body, { color: theme.primary }]}>{selected.includes(item.id) ? '☑' : '☐'}</Text><Text style={[studyStyles.body, { color: theme.text }]}>{item.name}</Text></Pressable>)}</View>
      <PrimaryButton title="Start 40 mixed questions" disabled={!hydrated || !selected.length} onPress={() => start('mixed')} /></Card>
    <Card><Text style={[studyStyles.cardTitle, { color: theme.text }]}>15-minute Revision Session</Text><Text style={[studyStyles.small, { color: theme.textSecondary }]}>Read a note and tip, revisit a saved or missed question, then answer a fresh one.</Text><PrimaryButton title="Start revision" disabled={!hydrated || !ready.length} onPress={() => start('revision')} /></Card>
  </Screen>;
}
