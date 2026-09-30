import { router, useLocalSearchParams } from 'expo-router';
import { Linking, Text } from 'react-native';
import { Card, PrimaryButton, Screen, studyStyles } from '@/components/study/primitives';
import { getNote } from '@/data/notes';
import { getTopic } from '@/data/roadmap';
import { useTheme } from '@/hooks/use-theme';
import { useStudyStore } from '@/state/study-store';

export default function NoteScreen() {
  const { id } = useLocalSearchParams<{ id: string }>(); const note = getNote(id); const theme = useTheme();
  const { state, toggleNote } = useStudyStore();
  if (!note) return <Screen><Text style={[studyStyles.pageTitle, { color: theme.text }]}>Note unavailable</Text></Screen>;
  const sections = [['How it works', note.how], ['When to use it', note.when], ['Compare', note.compare], ['Exam trap', note.trap], ['Example', note.example], ['Memory tip', note.tip], ['Self-check', note.selfCheck]];
  return <Screen><Text style={[studyStyles.eyebrow, { color: theme.primary }]}>{getTopic(note.topicId)?.name} REVISION NOTE</Text><Text style={[studyStyles.pageTitle, { color: theme.text }]}>{note.title}</Text>
    <PrimaryButton title={state.bookmarkedNoteIds.includes(note.id) ? 'Remove bookmark' : 'Bookmark note'} onPress={() => toggleNote(note.id)} secondary />
    {sections.map(([heading, body]) => <Card key={heading}><Text style={[studyStyles.cardTitle, { color: theme.text }]}>{heading}</Text><Text style={[studyStyles.body, { color: theme.textSecondary }]}>{body}</Text></Card>)}
    <PrimaryButton title="Official AWS documentation ↗" onPress={() => void Linking.openURL(note.source)} secondary />
    <PrimaryButton title="Practice this concept" onPress={() => router.push({ pathname: '/practice', params: { topic: note.topicId, subtopic: note.subtopic } })} />
  </Screen>;
}
