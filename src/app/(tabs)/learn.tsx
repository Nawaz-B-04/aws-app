import { router } from 'expo-router';
import { Linking, Pressable, Text, View } from 'react-native';
import { Card, PrimaryButton, Screen, SectionHeader, studyStyles } from '@/components/study/primitives';
import { notes } from '@/data/notes';
import { domains, getTopic, guideUrl, topics } from '@/data/roadmap';
import { useTheme } from '@/hooks/use-theme';
import { useStudyStore } from '@/state/study-store';

export default function LearnScreen() {
  const theme = useTheme(); const { state, hydrated, setReady, toggleSubtopic } = useStudyStore();
  return <Screen><Text style={[studyStyles.pageTitle, { color: theme.text }]}>Learn and roadmap</Text>
    <Text style={[studyStyles.subtitle, { color: theme.textSecondary }]}>DVA-C02 guide checklist and study notes. Follow your course order, then mark each topic Ready for practice.</Text>
    <Card><Text style={[studyStyles.cardTitle, { color: theme.text }]}>Next in your course</Text>
      <Text style={[studyStyles.small, { color: theme.textSecondary }]}>Read these after IAM, EC2, and EBS. Each has detailed notes and practice questions.</Text>
      {['elb-asg', 'rds-aurora-cache', 'route53'].map((id) => <PrimaryButton key={id} title={`Open ${getTopic(id)?.name}`} onPress={() => router.push({ pathname: '/topic/[id]', params: { id } })} secondary />)}
    </Card>
    <Card><Text style={[studyStyles.cardTitle, { color: theme.text }]}>Your revision shelf</Text>
      <Text style={[studyStyles.small, { color: theme.textSecondary }]}>{state.bookmarkedNoteIds.length} saved notes · {state.checkedSubtopicIds.length} checklist items completed</Text>
      <PrimaryButton title="Open saved notes and questions" onPress={() => router.push('/review')} secondary /></Card>
    {domains.map((domain) => <View key={domain.id} style={{ gap: 12 }}><SectionHeader title={`${domain.name} · ${domain.weight}%`} />
      {domain.tasks.map((task) => {
        const entries = topics.flatMap((topic) => topic.subtopics.filter((subtopic) => subtopic.taskId === task.id).map((subtopic) => ({ topic, subtopic })));
        return <Card key={task.id}><Text style={[studyStyles.cardTitle, { color: theme.text }]}>{task.id} {task.name}</Text>
          {entries.map(({ topic, subtopic }) => <View key={subtopic.id} style={{ gap: 6, paddingVertical: 7, borderTopWidth: 1, borderTopColor: theme.border }}>
            <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: state.checkedSubtopicIds.includes(subtopic.id) }} onPress={() => toggleSubtopic(subtopic.id)} style={{ flexDirection: 'row', gap: 10, alignItems: 'center', minHeight: 42 }}>
              <Text style={[studyStyles.body, { color: theme.primary }]}>{state.checkedSubtopicIds.includes(subtopic.id) ? '☑' : '☐'}</Text>
              <Text style={[studyStyles.small, { color: theme.text, flex: 1 }]}>{getTopic(topic.id)?.name}: {subtopic.title}</Text></Pressable>
            <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
              <Pressable accessibilityRole="button" onPress={() => router.push({ pathname: '/topic/[id]', params: { id: topic.id } })}><Text style={[studyStyles.small, { color: theme.primary, fontWeight: '700' }]}>Open topic →</Text></Pressable>
              {notes.some((note) => note.topicId === topic.id && note.subtopic === subtopic.title) && <Pressable accessibilityRole="button" onPress={() => router.push({ pathname: '/note/[id]', params: { id: notes.find((note) => note.topicId === topic.id && note.subtopic === subtopic.title)!.id } })}><Text style={[studyStyles.small, { color: theme.primary, fontWeight: '700' }]}>Read note →</Text></Pressable>}
              <Pressable accessibilityRole="button" onPress={() => setReady(topic.id, !state.readyTopicIds.includes(topic.id))}><Text style={[studyStyles.small, { color: theme.textSecondary }]}>{state.readyTopicIds.includes(topic.id) ? 'Ready ✓ · change' : 'Not studied · mark Ready'}</Text></Pressable>
            </View>
          </View>)}
        </Card>;
      })}</View>)}
    <Text style={[studyStyles.small, { color: theme.textSecondary }]}>{hydrated ? 'Checklist and readiness are saved on this device.' : 'Loading saved roadmap...'}</Text>
    <Text style={[studyStyles.small, { color: theme.textSecondary }]}>DVA-C02 is the current roadmap here. The announced DVA-C03 update is separate and not mixed into these tasks.</Text>
    <PrimaryButton title="Open official DVA-C02 guide" onPress={() => void Linking.openURL(guideUrl)} secondary />
    <PrimaryButton title="Read DVA-C03 announcement" onPress={() => void Linking.openURL('https://aws.amazon.com/blogs/training-and-certification/september-2026-new-offerings/')} secondary />
  </Screen>;
}
