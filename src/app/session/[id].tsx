import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { AnswerOption, ExplanationPanel, QuestionCard } from '@/components/study/practice';
import { Card, PrimaryButton, ProgressBar, Screen, studyStyles } from '@/components/study/primitives';
import { notes } from '@/data/notes';
import { isCorrect, normalizedQuestionText } from '@/domain/question-validation';
import { domainBreakdown, isExam, prepareExam, sessionPercent, sessionScore } from '@/domain/session-engine';
import { useTheme } from '@/hooks/use-theme';
import { loadQuestion } from '@/services/question-source';
import { latestMistakes, useStudyStore } from '@/state/study-store';
import type { Question, QuestionRequest, StudySession } from '@/types/study';

export default function SessionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>(); const theme = useTheme();
  const { state, hydrated, updateSession, recordAttempt, toggleQuestion } = useStudyStore();
  const session = state.sessions.find((item) => item.id === id);
  const [loading, setLoading] = useState(false); const [now, setNow] = useState(Date.now());
  const busy = useRef(false); const currentRef = useRef(session); currentRef.current = session;
  const exam = session ? isExam(session.mode) : false;

  useEffect(() => {
    if (!session || session.status !== 'preparing' || session.error || busy.current) return;
    busy.current = true; const controller = new AbortController();
    const loader = async (request: QuestionRequest, signal?: AbortSignal) => (await loadQuestion({ ...request, exam: true }, false, signal, false)).question;
    void prepareExam(session, loader, (questions) => updateSession(id, (old) => old && ({ ...old, questions })), controller.signal)
      .then((questions) => { if (controller.signal.aborted) return; const startedAt = new Date().toISOString(); updateSession(id, (old) => old && ({ ...old, questions, status: 'active', startedAt,
        ...(old.mode === 'full' ? { deadlineAt: new Date(Date.now() + 130 * 60_000).toISOString() } : {}) })); })
      .catch((error: unknown) => { if (!controller.signal.aborted) updateSession(id, (old) => old && ({ ...old, error: error instanceof Error ? error.message : 'Preparation failed.' })); })
      .finally(() => { busy.current = false; });
    return () => controller.abort();
    // Session contents change as batches save. Only status/error should restart preparation.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, session?.status, session?.error]);

  useEffect(() => {
    if (!session || session.status !== 'active' || exam || session.error || session.questions.length > session.index || busy.current || (session.mode === 'revision' && (session.revisionStep ?? 0) < 3)) return;
    busy.current = true; const controller = new AbortController(); const slot = session.questionPlan[session.index];
    if (!slot) { busy.current = false; return; }
    const recent = session.questions.slice(-12);
    const request: QuestionRequest = { ...slot, difficulty: session.difficulty === 'mixed' ? (['basic', 'exam', 'tricky'] as const)[session.index % 3] : session.difficulty,
      recentQuestionIds: recent.map((item) => item.id), recentConceptIds: recent.map((item) => item.conceptId), recentTexts: recent.slice(-8).map((item) => item.text) };
    const loadingTimer = setTimeout(() => setLoading(true), 0);
    const uniqueQuestion = async () => {
      const excluded = [...recent];
      for (let attempt = 0; attempt < 3; attempt += 1) {
        const result = await loadQuestion({ ...request, recentQuestionIds: excluded.slice(-12).map((item) => item.id), recentConceptIds: excluded.slice(-12).map((item) => item.conceptId), recentTexts: excluded.slice(-8).map((item) => item.text) }, session.mode === 'quick', controller.signal);
        if (!session.questions.some((item) => item.conceptId === result.question.conceptId || normalizedQuestionText(item.text) === normalizedQuestionText(result.question.text))) return result;
        excluded.push(result.question);
      }
      return null;
    };
    void uniqueQuestion().then((result) => {
      if (controller.signal.aborted) return;
      if (result) updateSession(id, (old) => old && ({ ...old, questions: [...old.questions, result.question], error: undefined }));
      else updateSession(id, (old) => old && ({ ...old, error: 'A fresh or compatible sample question is unavailable. Retry when the connection is ready.' }));
    }).catch((error: unknown) => { if (!controller.signal.aborted) updateSession(id, (old) => old && ({ ...old, error: error instanceof Error ? error.message : 'Question loading failed. Try again.' })); })
      .finally(() => { clearTimeout(loadingTimer); busy.current = false; setLoading(false); });
    return () => { clearTimeout(loadingTimer); controller.abort(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, session?.status, session?.index, session?.questions.length, session?.error, session?.revisionStep]);

  useEffect(() => {
    if (!session || session.status !== 'active' || !session.deadlineAt) return;
    const timer = setInterval(() => {
      setNow(Date.now()); const latest = currentRef.current;
      if (latest?.deadlineAt && Date.now() >= Date.parse(latest.deadlineAt)) {
        if (latest.mode === 'full' && latest.questions.length === latest.target) submitExam(latest);
        else if (latest.mode === 'revision') finishPractice(latest);
      }
    }, 1000);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, session?.status, session?.deadlineAt]);

  function finishPractice(current: StudySession) { updateSession(id, (old) => old && ({ ...old, status: 'complete', completedAt: new Date().toISOString() })); }
  function submitExam(current: StudySession) {
    if (current.status !== 'active' || current.questions.length !== current.target) return;
    const completedAt = new Date().toISOString();
    current.questions.forEach((question) => { const selectedOptionIds = current.answers[question.id] ?? []; recordAttempt({ question, selectedOptionIds, correct: isCorrect(question, selectedOptionIds), answeredAt: completedAt, sessionId: id }); });
    updateSession(id, (old) => old && ({ ...old, status: 'complete', completedAt }));
  }
  function select(question: Question, optionId: string) {
    if (session?.checkedQuestionIds.includes(question.id)) return;
    updateSession(id, (old) => { if (!old) return old; const selected = old.answers[question.id] ?? [];
      const next = question.kind === 'single' ? [optionId] : selected.includes(optionId) ? selected.filter((item) => item !== optionId) : [...selected, optionId];
      return { ...old, answers: { ...old.answers, [question.id]: next } }; });
  }
  function check(question: Question) {
    if (!session || session.checkedQuestionIds.includes(question.id)) return;
    const selectedOptionIds = session.answers[question.id] ?? [];
    if (!selectedOptionIds.length) return;
    recordAttempt({ question, selectedOptionIds, correct: isCorrect(question, selectedOptionIds), answeredAt: new Date().toISOString(), sessionId: id });
    updateSession(id, (old) => old && ({ ...old, checkedQuestionIds: [...old.checkedQuestionIds, question.id] }));
  }
  if (!hydrated || !session) return <Screen><ActivityIndicator color={theme.primary} /><Text style={[studyStyles.subtitle, { color: theme.textSecondary }]}>{hydrated ? 'Session not found.' : 'Loading saved session...'}</Text></Screen>;
  if (session.status === 'preparing') return <Screen><Text style={[studyStyles.pageTitle, { color: theme.text }]}>Preparing {session.title}</Text>
    <Text style={[studyStyles.subtitle, { color: theme.textSecondary }]}>{session.questions.length} of {session.target} questions ready. Your test and timer start only when all questions are prepared.</Text><ProgressBar value={session.questions.length / session.target * 100} />
    <Card><Text style={[studyStyles.small, { color: theme.textSecondary }]}>Questions are generated in small batches. Large exams can take several minutes and use OpenRouter credits. Completed batches are saved on this device.</Text></Card>
    {session.error ? <><Text style={[studyStyles.body, { color: theme.danger }]}>{session.error}</Text><PrimaryButton title="Retry remaining questions" onPress={() => updateSession(id, (old) => old && ({ ...old, error: undefined }))} /><PrimaryButton title="Leave and resume later" onPress={() => router.replace('/exam')} secondary /></> : <ActivityIndicator color={theme.primary} />}
    <PrimaryButton title="Cancel preparation" onPress={() => { updateSession(id, () => undefined); router.replace('/exam'); }} secondary />
  </Screen>;
  if (session.status === 'complete') return <Screen><Text style={[studyStyles.pageTitle, { color: theme.text }]}>{session.title} complete</Text>
    <Card><Text style={[studyStyles.pageTitle, { color: theme.primary }]}>{sessionPercent(session)}%</Text><Text style={[studyStyles.body, { color: theme.textSecondary }]}>{sessionScore(session)} of {session.questions.length} correct · practice percentage</Text></Card>
    {exam && domainBreakdown(session).filter((item) => item.count).map(({ domain, correct, count }) => <Card key={domain.id}><Text style={[studyStyles.cardTitle, { color: theme.text }]}>{domain.name}</Text><Text style={[studyStyles.body, { color: theme.textSecondary }]}>{correct}/{count} correct</Text></Card>)}
    <PrimaryButton title="Review all answers" onPress={() => router.push({ pathname: '/review', params: { sessionId: session.id } })} /><PrimaryButton title="See progress" onPress={() => router.replace('/progress')} secondary />
  </Screen>;
  if (exam && session.questions.length !== session.target) return <Screen><Text style={[studyStyles.pageTitle, { color: theme.text }]}>Exam needs repair</Text><Text style={[studyStyles.body, { color: theme.textSecondary }]}>The saved exam has {session.questions.length} of {session.target} questions. Complete preparation before starting or resuming the test.</Text><PrimaryButton title="Prepare missing questions" onPress={() => updateSession(id, (old) => old && ({ ...old, status: 'preparing', deadlineAt: undefined, error: undefined }))} /></Screen>;
  const question = session.questions[session.index];
  const remaining = session.deadlineAt ? Math.max(0, Date.parse(session.deadlineAt) - now) : null;
  const timeLabel = remaining === null ? null : `${Math.floor(remaining / 60_000)}:${String(Math.floor(remaining / 1000) % 60).padStart(2, '0')} remaining`;
  if (session.mode === 'revision' && (session.revisionStep ?? 0) < 3) {
    const step = session.revisionStep ?? 0; const readyNotes = notes.filter((item) => session.topicIds.includes(item.topicId));
    const note = readyNotes[state.attempts.length % readyNotes.length];
    const oldQuestion = latestMistakes(state.attempts)[0]?.question ?? state.bookmarkedQuestions[0];
    return <Screen><Text style={[studyStyles.pageTitle, { color: theme.text }]}>15-minute Revision</Text><Text style={[studyStyles.subtitle, { color: theme.textSecondary }]}>{timeLabel}</Text>
      <Card><Text style={[studyStyles.cardTitle, { color: theme.text }]}>{['Read a note', 'Memory tip', 'Review a previous question'][step]}</Text>
        <Text style={[studyStyles.body, { color: theme.textSecondary }]}>{step === 0 ? note?.how ?? 'Review a Ready topic.' : step === 1 ? note?.tip ?? 'Recall the key rule before practice.' : oldQuestion ? `${oldQuestion.text}\n\n${oldQuestion.explanation}` : 'No saved or missed question yet. Your next fresh question will begin the review list.'}</Text></Card>
      <PrimaryButton title={step === 2 ? 'Answer a fresh question' : 'Next step'} onPress={() => updateSession(id, (old) => old && ({ ...old, revisionStep: step + 1 }))} />
    </Screen>;
  }
  if (session.error) return <Screen><Text style={[studyStyles.pageTitle, { color: theme.text }]}>Question unavailable</Text><Text style={[studyStyles.body, { color: theme.danger }]}>{session.error}</Text><Text style={[studyStyles.small, { color: theme.textSecondary }]}>Your answered questions and place in this session are saved on this phone.</Text><PrimaryButton title="Retry question" onPress={() => updateSession(id, (old) => old && ({ ...old, error: undefined }))} /><PrimaryButton title="Leave and resume later" onPress={() => router.replace('/practice')} secondary /></Screen>;
  if (!question || loading) return <Screen><ActivityIndicator color={theme.primary} /><Text style={[studyStyles.subtitle, { color: theme.textSecondary }]}>Preparing next question...</Text></Screen>;
  const selected = session.answers[question.id] ?? []; const checked = session.checkedQuestionIds.includes(question.id);
  const bookmark = state.bookmarkedQuestions.some((item) => item.id === question.id);
  return <Screen><Text style={[studyStyles.eyebrow, { color: theme.primary }]}>{session.title.toUpperCase()}</Text>
    {timeLabel && <Text style={[studyStyles.cardTitle, { color: remaining !== null && remaining < 5 * 60_000 ? theme.danger : theme.text }]}>{timeLabel}</Text>}
    {(question.grounding?.status === 'sample' || question.id.startsWith('sample-')) && <Text style={[studyStyles.small, { color: theme.textSecondary }]}>Local sample · question generation was unavailable</Text>}
    {exam && question.grounding?.status !== 'aws_docs' && <Text style={[studyStyles.small, { color: theme.textSecondary }]}>Without AWS sources · answer review will show details</Text>}
    <QuestionCard question={question} number={session.index + 1} total={session.target} />
    <View style={{ gap: 10 }}>{question.options.map((option) => <AnswerOption key={option.id} option={option} multiple={question.kind === 'multiple'} selected={selected.includes(option.id)} checked={!exam && checked} correct={question.correctOptionIds.includes(option.id)} onPress={() => select(question, option.id)} />)}</View>
    <PrimaryButton title={bookmark ? 'Remove important bookmark' : 'Save important question'} onPress={() => toggleQuestion(question)} secondary />
    {exam ? <><PrimaryButton title={session.flags.includes(question.id) ? 'Remove review flag' : 'Flag for review'} onPress={() => updateSession(id, (old) => old && ({ ...old, flags: old.flags.includes(question.id) ? old.flags.filter((item) => item !== question.id) : [...old.flags, question.id] }))} secondary />
      <View style={{ flexDirection: 'row', gap: 10 }}><View style={{ flex: 1 }}><PrimaryButton title="Previous" disabled={session.index === 0} onPress={() => updateSession(id, (old) => old && ({ ...old, index: old.index - 1 }))} secondary /></View><View style={{ flex: 1 }}><PrimaryButton title="Next" disabled={session.index === session.target - 1} onPress={() => updateSession(id, (old) => old && ({ ...old, index: old.index + 1 }))} secondary /></View></View>
      <Text style={[studyStyles.small, { color: theme.textSecondary }]}>{Object.values(session.answers).filter((items) => items.length).length}/{session.target} answered · {session.flags.length} flagged</Text>
      <PrimaryButton title="Submit exam and reveal answers" onPress={() => submitExam(session)} /></> : <>
        {!checked ? <PrimaryButton title="Check answer" disabled={!selected.length} onPress={() => check(question)} /> : <><ExplanationPanel question={question} selectedOptionIds={selected} />
          <PrimaryButton title={session.index + 1 >= session.target ? 'Finish session' : 'Next question'} onPress={() => session.index + 1 >= session.target ? finishPractice(session) : updateSession(id, (old) => old && ({ ...old, index: old.index + 1 }))} /></>}
      </>}
  </Screen>;
}
