export type TopicId = 'iam' | 'ec2' | 'ebs';

export type Subtopic = {
  id: string;
  title: string;
};

export type Topic = {
  id: TopicId;
  name: string;
  description: string;
  progress: number;
  accent: string;
  subtopics: Subtopic[];
};

export type QuestionOption = {
  id: string;
  text: string;
  explanation: string;
};

export type Question = {
  id: string;
  topicId: TopicId;
  subtopic: string;
  difficulty: 'basic' | 'exam' | 'tricky';
  text: string;
  options: QuestionOption[];
  correctOptionId: string;
  explanation: string;
  memoryTip: string;
};

export type Concept = {
  id: string;
  topicId: TopicId;
  title: string;
  whatItIs: string;
  example: string;
  examPoint: string;
  confusion: string;
  remember: string;
};

export type TopicPerformance = {
  topicId: TopicId;
  accuracy: number;
  answered: number;
};

export type UserProgress = {
  streakDays: number;
  dailyGoal: number;
  completedToday: number;
  overallAccuracy: number;
  totalAnswered: number;
  topicPerformance: TopicPerformance[];
  weakAreas: { topicId: TopicId; name: string; accuracy: number }[];
};

export type WrongAnswer = {
  id: string;
  questionId: string;
  topicId: TopicId;
  concept: string;
  explanation: string;
};
