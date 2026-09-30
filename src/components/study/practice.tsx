import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { Card, ProgressBar, studyStyles } from '@/components/study/primitives';
import { getTopic } from '@/data/roadmap';
import { isCorrect } from '@/domain/question-validation';
import { useTheme } from '@/hooks/use-theme';
import type { Question, QuestionOption } from '@/types/study';

export function QuestionCard({ question, number, total }: { question: Question; number: number; total: number }) {
  const theme = useTheme();
  return <Card><Text style={[studyStyles.eyebrow, { color: theme.primary }]}>{getTopic(question.topicId)?.name} / {question.subtopic} · {number} of {total}</Text>
    <ProgressBar value={number / total * 100} /><Text style={[styles.question, { color: theme.text }]}>{question.text}</Text>
    <Text style={[studyStyles.small, { color: theme.textSecondary }]}>{question.kind === 'multiple' ? 'Select all required answers.' : 'Select one answer.'}</Text></Card>;
}
export function AnswerOption({ option, selected, checked, correct, multiple, onPress }: { option: QuestionOption; selected: boolean; checked: boolean; correct: boolean; multiple: boolean; onPress: () => void }) {
  const theme = useTheme();
  const color = checked && correct ? theme.success : checked && selected ? theme.danger : selected ? theme.primary : theme.border;
  const backgroundColor = checked && correct ? theme.successSoft : checked && selected ? theme.dangerSoft : selected ? theme.primarySoft : theme.backgroundElement;
  return <Pressable accessibilityRole={multiple ? 'checkbox' : 'radio'} accessibilityState={{ checked: selected, disabled: checked }} disabled={checked} onPress={onPress}
    style={[styles.option, { borderColor: color, backgroundColor }]}><Text style={[styles.letter, { color }]}>{option.id.toUpperCase()}</Text><Text style={[studyStyles.body, { color: theme.text, flex: 1 }]}>{option.text}</Text></Pressable>;
}
export function ExplanationPanel({ question, selectedOptionIds }: { question: Question; selectedOptionIds: string[] }) {
  const theme = useTheme();
  const correct = isCorrect(question, selectedOptionIds);
  const selected = question.options.filter((item) => selectedOptionIds.includes(item.id)).map((item) => item.text).join('; ');
  const answer = question.options.filter((item) => question.correctOptionIds.includes(item.id)).map((item) => item.text).join('; ');
  return <Card style={{ borderColor: correct ? theme.success : theme.danger }}>
    <Text style={[studyStyles.cardTitle, { color: correct ? theme.success : theme.danger }]}>{correct ? 'Correct' : 'Incorrect'}</Text>
    {!correct && <Text style={[studyStyles.body, { color: theme.text }]}>You selected: {selected || 'No answer'}. Correct: {answer}.</Text>}
    <Text style={[studyStyles.body, { color: theme.text }]}>{question.explanation}</Text>
    {question.options.map((option) => <View key={option.id} style={styles.reason}><Text style={[studyStyles.small, { color: question.correctOptionIds.includes(option.id) ? theme.success : theme.text, fontWeight: '700' }]}>{option.id.toUpperCase()}. {option.text}</Text><Text style={[studyStyles.small, { color: theme.textSecondary }]}>{option.explanation}</Text></View>)}
    <Text style={[studyStyles.small, { color: theme.text }]}>{question.conceptSummary}</Text><Text style={[studyStyles.small, { color: theme.primary, fontWeight: '700' }]}>Remember: {question.memoryTip}</Text>
    <QuestionSources question={question} />
  </Card>;
}

export function QuestionSources({ question }: { question: Question }) {
  const theme = useTheme();
  return <View style={styles.sources}>
    <Text style={[studyStyles.small, { color: theme.textSecondary, fontWeight: '700' }]}>{question.grounding?.status === 'aws_docs' ? 'AWS documentation used' : question.grounding?.status === 'sample' || question.id.startsWith('sample-') ? 'Local sample · no AWS sources' : 'Without AWS sources'}</Text>
    {question.grounding?.sources.map((source) => <Pressable key={`${source.url}-${source.section}`} accessibilityRole="link" onPress={() => void Linking.openURL(source.url).catch(() => undefined)}><Text style={[studyStyles.small, { color: theme.primary, textDecorationLine: 'underline' }]}>{source.title} · {source.section}</Text></Pressable>)}
    {question.grounding?.status === 'aws_docs' && <Pressable accessibilityRole="link" onPress={() => void Linking.openURL('https://creativecommons.org/licenses/by-sa/4.0/').catch(() => undefined)}><Text style={[studyStyles.small, { color: theme.textSecondary }]}>AWS documentation · CC BY-SA 4.0</Text></Pressable>}
  </View>;
}
const styles = StyleSheet.create({ question: { fontSize: 22, lineHeight: 31, fontWeight: '700' }, option: { minHeight: 64, borderWidth: 1.5, borderRadius: 16, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 13 }, letter: { fontSize: 16, fontWeight: '800', width: 24 }, reason: { gap: 2 }, sources: { gap: 7, marginTop: 6 } });
