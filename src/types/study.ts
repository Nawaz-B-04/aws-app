export type TopicId = string;
export type Difficulty = 'basic' | 'exam' | 'tricky';
export type SessionDifficulty = Difficulty | 'mixed';

export type Subtopic = {
  id: string;
  title: string;
  taskId: string;
};

export type Topic = {
  id: TopicId;
  name: string;
  description: string;
  accent: string;
  subtopics: Subtopic[];
};

export type QuestionOption = {
  id: string;
  text: string;
  explanation: string;
};

export type SourceReference = { title: string; url: string; section: string };
export type QuestionGrounding = {
  status: 'aws_docs' | 'no_sources' | 'sample';
  sources: SourceReference[];
  corpusVersion?: string;
};

export type Question = {
  id: string;
  topicId: TopicId;
  subtopic: string;
  conceptId: string;
  difficulty: Difficulty;
  text: string;
  options: QuestionOption[];
  kind: 'single' | 'multiple';
  correctOptionIds: string[];
  explanation: string;
  memoryTip: string;
  conceptSummary: string;
  grounding?: QuestionGrounding;
};

export type QuestionRequest = {
  topicId: TopicId;
  subtopic?: string;
  taskId: string;
  kind: 'single' | 'multiple';
  difficulty: Difficulty;
  recentQuestionIds: string[];
  recentConceptIds: string[];
  recentTexts: string[];
  exam?: boolean;
};

export type QuestionSourceResult = {
  question: Question;
  source: 'generated' | 'mock' | 'review';
  usedFallback: boolean;
};

export type Attempt = {
  question: Question;
  selectedOptionIds: string[];
  correct: boolean;
  answeredAt: string;
  sessionId: string;
};

export type SessionMode = 'quick' | 'topic' | 'mixed' | 'custom' | 'full' | 'revision' | 'retry';
export type StudySession = {
  id: string; mode: SessionMode; title: string; target: number; difficulty: SessionDifficulty; topicIds: string[];
  questionPlan: { topicId: string; subtopic: string; taskId: string; kind: 'single' | 'multiple' }[];
  questions: Question[]; answers: Record<string, string[]>; checkedQuestionIds: string[]; flags: string[]; index: number;
  status: 'preparing' | 'active' | 'complete'; startedAt?: string; deadlineAt?: string; completedAt?: string;
  revisionStep?: number;
  error?: string;
};
export type Note = {
  id: string; topicId: string; subtopic: string; title: string; how: string; when: string;
  compare: string; trap: string; example: string; tip: string; selfCheck: string; source: string;
};
