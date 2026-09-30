import { router } from 'expo-router';
import { Text } from 'react-native';
import { Card, PrimaryButton, ProgressBar, Screen, SectionHeader, studyStyles } from '@/components/study/primitives';
import { getTopic } from '@/data/roadmap';
import { calculateProgress } from '@/domain/progress';
import { makeSession } from '@/domain/session-engine';
import { useTheme } from '@/hooks/use-theme';
import { useStudyStore } from '@/state/study-store';

export default function HomeScreen() {
  const theme = useTheme(); const { state, hydrated, updateSession } = useStudyStore();
  const progress = calculateProgress(state.attempts);
  const unfinished = state.sessions.filter((item) => item.status !== 'complete').at(-1);
  function quick() { const ids = state.readyTopicIds.filter((id) => getTopic(id)); if (!ids.length) return; const session = makeSession('quick', ids, 5, 'exam', state.attempts.length); updateSession(session.id, () => session); router.push({ pathname: '/session/[id]', params: { id: session.id } }); }
  return <Screen><Text style={[studyStyles.eyebrow, { color: theme.primary }]}>YOUR STUDY SPACE</Text><Text style={[studyStyles.pageTitle, { color: theme.text }]}>Ready for a quick win?</Text>
    <Card style={{ backgroundColor: theme.primary, borderColor: theme.primary }}><Text style={[studyStyles.cardTitle, { color: theme.backgroundElement }]}>Build confidence, one question at a time.</Text><Text style={[studyStyles.body, { color: theme.backgroundElement }]}>5 balanced questions from your Ready topics, with explanations after each answer.</Text><PrimaryButton title="Start Quick Practice" disabled={!hydrated || !state.readyTopicIds.length} onPress={quick} secondary /></Card>
    {unfinished && <PrimaryButton title={`Resume ${unfinished.title}`} onPress={() => router.push({ pathname: '/session/[id]', params: { id: unfinished.id } })} secondary />}
    <Card><Text style={[studyStyles.cardTitle, { color: theme.text }]}>Today</Text><Text style={[studyStyles.body, { color: theme.textSecondary }]}>{progress.completedToday}/{progress.dailyGoal} daily questions · {progress.streakDays} day streak</Text><ProgressBar value={progress.completedToday / progress.dailyGoal * 100} /><Text style={[studyStyles.small, { color: theme.textSecondary }]}>{progress.totalAnswered} total answers · {progress.overallAccuracy}% accuracy</Text></Card>
    <SectionHeader title="Study path" action="Open roadmap" onAction={() => router.push('/learn')} />
    <Card><Text style={[studyStyles.body, { color: theme.text }]}>Ready now: {state.readyTopicIds.map((id) => getTopic(id)?.name).filter(Boolean).join(', ') || 'No topics marked Ready'}</Text><Text style={[studyStyles.small, { color: theme.textSecondary }]}>Follow the DVA-C02 roadmap and mark new topics Ready when you have studied them.</Text></Card>
    <SectionHeader title="Review" /><PrimaryButton title="Important questions, notes and mistakes" onPress={() => router.push('/review')} secondary />
    <PrimaryButton title="15-minute Revision Session" onPress={() => router.push('/practice')} secondary />
  </Screen>;
}
