import { router, useLocalSearchParams } from 'expo-router';
import { Text } from 'react-native';
import { ExplanationPanel, QuestionSources } from '@/components/study/practice';
import { Card, PrimaryButton, Screen, SectionHeader, studyStyles } from '@/components/study/primitives';
import { getNote } from '@/data/notes';
import { getTopic } from '@/data/roadmap';
import { makeSession } from '@/domain/session-engine';
import { useTheme } from '@/hooks/use-theme';
import { latestMistakes, useStudyStore } from '@/state/study-store';
import type { Question } from '@/types/study';

export default function ReviewScreen() {
  const { sessionId } = useLocalSearchParams<{ sessionId?: string }>(); const theme = useTheme();
  const { state, updateSession, toggleQuestion } = useStudyStore();
  const session = state.sessions.find((item) => item.id === sessionId);
  const mistakes = latestMistakes(state.attempts);
  function retry(question: Question) { const next = makeSession('retry', [question.topicId], 1, question.difficulty, 0, undefined, question); updateSession(next.id, () => next); router.push({ pathname: '/session/[id]', params: { id: next.id } }); }
  return <Screen><Text style={[studyStyles.pageTitle, { color: theme.text }]}>{session ? 'Exam answer review' : 'Review shelf'}</Text>
    {session ? <>{session.questions.map((question, index) => <Card key={question.id}><Text style={[studyStyles.eyebrow, { color: theme.primary }]}>{index + 1} / {session.questions.length} · {getTopic(question.topicId)?.name}</Text>
      <Text style={[studyStyles.cardTitle, { color: theme.text }]}>{question.text}</Text><ExplanationPanel question={question} selectedOptionIds={session.answers[question.id] ?? []} />
      <PrimaryButton title="Retry question" onPress={() => retry(question)} secondary /><PrimaryButton title={state.bookmarkedQuestions.some((item) => item.id === question.id) ? 'Remove important bookmark' : 'Save important question'} onPress={() => toggleQuestion(question)} secondary /></Card>)}</> : <>
      <SectionHeader title="Saved revision notes" />
      {state.bookmarkedNoteIds.length === 0 && <Text style={[studyStyles.small, { color: theme.textSecondary }]}>Bookmark a note in Learn to find it here.</Text>}
      {state.bookmarkedNoteIds.map((id) => { const note = getNote(id); return note && <Card key={id}><Text style={[studyStyles.cardTitle, { color: theme.text }]}>{note.title}</Text><Text style={[studyStyles.small, { color: theme.textSecondary }]}>{note.tip}</Text><PrimaryButton title="Read note" onPress={() => router.push({ pathname: '/note/[id]', params: { id } })} secondary /></Card>; })}
      <SectionHeader title="Important questions" />
      {state.bookmarkedQuestions.length === 0 && <Text style={[studyStyles.small, { color: theme.textSecondary }]}>Save a question while practicing or taking an exam.</Text>}
      {state.bookmarkedQuestions.map((question) => <Card key={question.id}><Text style={[studyStyles.cardTitle, { color: theme.text }]}>{question.text}</Text><Text style={[studyStyles.small, { color: theme.textSecondary }]}>{question.conceptSummary}</Text><QuestionSources question={question} /><PrimaryButton title="Retry question" onPress={() => retry(question)} secondary /><PrimaryButton title="Remove bookmark" onPress={() => toggleQuestion(question)} secondary /></Card>)}
      <SectionHeader title="Mistakes to revisit" />
      {mistakes.length === 0 && <Text style={[studyStyles.small, { color: theme.textSecondary }]}>Questions you miss will appear here.</Text>}
      {mistakes.map((attempt) => <Card key={attempt.question.id}><Text style={[studyStyles.eyebrow, { color: theme.primary }]}>{getTopic(attempt.question.topicId)?.name}</Text><Text style={[studyStyles.cardTitle, { color: theme.text }]}>{attempt.question.text}</Text>
        <ExplanationPanel question={attempt.question} selectedOptionIds={attempt.selectedOptionIds} /><PrimaryButton title="Retry question" onPress={() => retry(attempt.question)} secondary /></Card>)}
    </>}
  </Screen>;
}
