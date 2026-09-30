import { router } from 'expo-router';
import { Text, View } from 'react-native';
import { Card, PrimaryButton, ProgressBar, Screen, SectionHeader, StatCard, studyStyles } from '@/components/study/primitives';
import { calculateProgress } from '@/domain/progress';
import { sessionPercent } from '@/domain/session-engine';
import { useTheme } from '@/hooks/use-theme';
import { useStudyStore } from '@/state/study-store';

export default function ProgressScreen() {
  const theme = useTheme(); const { state } = useStudyStore(); const progress = calculateProgress(state.attempts);
  const completed = state.sessions.filter((item) => item.status === 'complete').reverse();
  return <Screen><Text style={[studyStyles.pageTitle, { color: theme.text }]}>Your progress</Text><Text style={[studyStyles.subtitle, { color: theme.textSecondary }]}>Calculated from answers saved on this device.</Text>
    <View style={{ flexDirection: 'row', gap: 8 }}><StatCard value={`${progress.overallAccuracy}%`} label="Accuracy" /><StatCard value={`${progress.totalAnswered}`} label="Answered" /><StatCard value={`${progress.streakDays}d`} label="Streak" /></View>
    <Card><Text style={[studyStyles.cardTitle, { color: theme.text }]}>Daily goal</Text><Text style={[studyStyles.body, { color: theme.textSecondary }]}>{progress.completedToday}/{progress.dailyGoal} questions today</Text><ProgressBar value={progress.completedToday / progress.dailyGoal * 100} /></Card>
    <SectionHeader title="Topic performance" />
    {progress.topicPerformance.length ? progress.topicPerformance.map((item) => <Card key={item.topicId}><Text style={[studyStyles.cardTitle, { color: theme.text }]}>{item.name}</Text><Text style={[studyStyles.small, { color: theme.textSecondary }]}>{item.answered} answered · {item.accuracy}% correct</Text><ProgressBar value={item.accuracy} /></Card>) : <Card><Text style={[studyStyles.body, { color: theme.textSecondary }]}>No answers yet. Your results will appear after practice or an exam.</Text></Card>}
    <SectionHeader title="Needs attention" />
    {progress.weakAreas.map((item) => <Text key={item.topicId} style={[studyStyles.body, { color: theme.text }]}>{item.name}: {item.accuracy}%</Text>)}
    <SectionHeader title="Completed sessions" />
    {completed.slice(0, 10).map((item) => <Card key={item.id}><Text style={[studyStyles.cardTitle, { color: theme.text }]}>{item.title}</Text><Text style={[studyStyles.small, { color: theme.textSecondary }]}>{item.questions.length} questions · {sessionPercent(item)}% correct</Text><PrimaryButton title="Review answers" onPress={() => router.push({ pathname: '/review', params: { sessionId: item.id } })} secondary /></Card>)}
    <PrimaryButton title="Review important and missed questions" onPress={() => router.push('/review')} secondary />
  </Screen>;
}
