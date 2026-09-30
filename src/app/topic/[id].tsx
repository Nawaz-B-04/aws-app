import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, Text } from 'react-native';
import { Card, PrimaryButton, Screen, studyStyles } from '@/components/study/primitives';
import { notes } from '@/data/notes';
import { getTopic } from '@/data/roadmap';
import { useTheme } from '@/hooks/use-theme';
import { useStudyStore } from '@/state/study-store';

export default function TopicScreen() {
  const { id } = useLocalSearchParams<{ id: string }>(); const topic = getTopic(id); const theme = useTheme();
  const { state, setReady, toggleSubtopic } = useStudyStore();
  if (!topic) return <Screen><Text style={[studyStyles.pageTitle, { color: theme.text }]}>Topic unavailable</Text></Screen>;
  const ready = state.readyTopicIds.includes(topic.id);
  return <Screen><Text style={[studyStyles.pageTitle, { color: theme.text }]}>{topic.name}</Text><Text style={[studyStyles.subtitle, { color: theme.textSecondary }]}>{topic.description}</Text>
    <Card><Text style={[studyStyles.cardTitle, { color: theme.text }]}>{ready ? 'Ready for practice' : 'Not studied yet'}</Text><Text style={[studyStyles.small, { color: theme.textSecondary }]}>You can practice this topic directly. Marking it Ready also adds it to Quick and Mixed Practice.</Text><PrimaryButton title={ready ? 'Mark Not studied' : 'Mark Ready'} onPress={() => setReady(topic.id, !ready)} secondary /></Card>
    {topic.subtopics.map((subtopic) => { const note = notes.find((item) => item.topicId === topic.id && item.subtopic === subtopic.title); return <Card key={subtopic.id}>
      <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: state.checkedSubtopicIds.includes(subtopic.id) }} onPress={() => toggleSubtopic(subtopic.id)} style={{ flexDirection: 'row', gap: 10, minHeight: 42, alignItems: 'center' }}><Text style={[studyStyles.body, { color: theme.primary }]}>{state.checkedSubtopicIds.includes(subtopic.id) ? '☑' : '☐'}</Text><Text style={[studyStyles.cardTitle, { color: theme.text, flex: 1 }]}>{subtopic.title}</Text></Pressable>
      <Text style={[studyStyles.small, { color: theme.textSecondary }]}>{note ? 'Detailed revision note available' : 'Roadmap outline · detailed notes are coming as you study'}</Text>
      {note && <PrimaryButton title="Read note" onPress={() => router.push({ pathname: '/note/[id]', params: { id: note.id } })} secondary />}
      <PrimaryButton title="Practice this concept" onPress={() => router.push({ pathname: '/practice', params: { topic: topic.id, subtopic: subtopic.title } })} secondary />
    </Card>; })}
    <PrimaryButton title={`Practice ${topic.name}`} onPress={() => router.push({ pathname: '/practice', params: { topic: topic.id } })} />
  </Screen>;
}
