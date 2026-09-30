import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Card, PrimaryButton, Screen, studyStyles } from '@/components/study/primitives';
import { Choices } from '@/components/study/setup';
import { groundedTopicIds } from '@/data/knowledge-sources';
import { domains, getDomainForTask, topics } from '@/data/roadmap';
import { makeSession } from '@/domain/session-engine';
import { useTheme } from '@/hooks/use-theme';
import { useStudyStore } from '@/state/study-store';

export default function ExamScreen() {
  const theme = useTheme(); const { state, hydrated, updateSession } = useStudyStore();
  const [length, setLength] = useState<10 | 20 | 40 | 65>(10);
  const [selected, setSelected] = useState<string[]>(['iam', 'ec2', 'ebs']);
  const unfinished = state.sessions.filter((item) => ['preparing', 'active'].includes(item.status) && ['custom', 'full'].includes(item.mode)).reverse();
  function start(full: boolean) {
    if (!full && !selected.length) return;
    const session = makeSession(full ? 'full' : 'custom', full ? topics.map((item) => item.id) : selected, full ? 65 : length, 'exam', state.sessions.length);
    updateSession(session.id, () => session);
    router.push({ pathname: '/session/[id]', params: { id: session.id } });
  }
  return <Screen><Text style={[studyStyles.pageTitle, { color: theme.text }]}>Exam</Text><Text style={[studyStyles.subtitle, { color: theme.textSecondary }]}>Original exam-style practice questions. Answers appear only after you submit.</Text>
    {unfinished.map((item) => <PrimaryButton key={item.id} title={`Resume ${item.title} · ${item.questions.length}/${item.target} prepared`} onPress={() => router.push({ pathname: '/session/[id]', params: { id: item.id } })} secondary />)}
    <Card><Text style={[studyStyles.cardTitle, { color: theme.text }]}>Custom Exam</Text><Text style={[studyStyles.small, { color: theme.textSecondary }]}>Any roadmap topics, including Not studied. No timer by default. {selected.some((id) => !groundedTopicIds.includes(id)) ? 'Topics outside the first six will have questions without AWS sources.' : 'Selected topics use AWS source search.'}</Text>
      <Choices label="Questions" values={[10, 20, 40, 65].map((value) => ({ value: value as 10 | 20 | 40 | 65, title: `${value}` }))} selected={length} onChange={setLength} />
      {domains.map((domain) => <View key={domain.id} style={{ gap: 4 }}><Text style={[studyStyles.small, { color: theme.primary, fontWeight: '700' }]}>{domain.name}</Text>
        {topics.filter((topic) => topic.subtopics.some((item) => getDomainForTask(item.taskId)?.id === domain.id)).map((topic) => <Pressable key={topic.id} accessibilityRole="checkbox" accessibilityState={{ checked: selected.includes(topic.id) }} onPress={() => setSelected((old) => old.includes(topic.id) ? old.filter((id) => id !== topic.id) : [...old, topic.id])} style={{ minHeight: 38, flexDirection: 'row', alignItems: 'center', gap: 8 }}><Text style={[studyStyles.body, { color: theme.primary }]}>{selected.includes(topic.id) ? '☑' : '☐'}</Text><Text style={[studyStyles.small, { color: theme.text }]}>{topic.name}</Text></Pressable>)}
      </View>)}
      <PrimaryButton title={`Prepare ${length}-question exam`} disabled={!hydrated || !selected.length} onPress={() => start(false)} /></Card>
    <Card><Text style={[studyStyles.cardTitle, { color: theme.text }]}>Full DVA-C02 Mock</Text><Text style={[studyStyles.small, { color: theme.textSecondary }]}>65 questions across all four domains. The 130-minute timer starts only after every question is ready. You can flag, go back, and change answers. Questions outside the first six topic groups are marked Without AWS sources.</Text>
      <Text style={[studyStyles.small, { color: theme.textSecondary }]}>Preparing 65 AI questions can take several minutes and use OpenRouter credits. Progress is saved; failed batches can be retried.</Text>
      <PrimaryButton title="Prepare full mock" disabled={!hydrated} onPress={() => start(true)} /></Card>
    <Text style={[studyStyles.small, { color: theme.textSecondary }]}>These AI-written questions are original practice material, not official AWS exam items. Verify uncertain answers in AWS documentation. Full Mock reports a practice percentage and domain breakdown, not an AWS scaled score.</Text>
  </Screen>;
}
