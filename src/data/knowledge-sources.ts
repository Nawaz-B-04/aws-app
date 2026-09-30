import { notes } from '@/data/notes';
import { topics } from '@/data/roadmap';

export const groundedTopicIds = topics.slice(0, 6).map((topic) => topic.id);

const additionalSources: Record<string, string[]> = {
  'ec2-1': ['https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/ec2-launch-templates.html'],
  'ec2-6': ['https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/user-data.html'],
  'ebs-3': ['https://docs.aws.amazon.com/ebs/latest/userguide/ebs-restoring-volume.html'],
  'elb-asg-1': ['https://docs.aws.amazon.com/elasticloadbalancing/latest/network/introduction.html'],
  'elb-asg-2': ['https://docs.aws.amazon.com/elasticloadbalancing/latest/application/target-group-health-checks.html'],
  'rds-aurora-cache-2': ['https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/USER_ReadRepl.html'],
  'rds-aurora-cache-5': ['https://docs.aws.amazon.com/AmazonElastiCache/latest/dg/Strategies.html'],
};

// The reviewed note links are the curated AWS documentation allowlist. Do not crawl links from these pages.
export const knowledgeSources = groundedTopicIds.flatMap((topicId) => {
  const topic = topics.find((item) => item.id === topicId)!;
  return topic.subtopics.flatMap((subtopic) => {
    const note = notes.find((item) => item.topicId === topicId && item.subtopic === subtopic.title);
    if (!note?.source.startsWith('https://docs.aws.amazon.com/')) throw new Error(`Missing AWS source: ${subtopic.id}`);
    return [note.source, ...(additionalSources[subtopic.id] ?? [])].map((url) => ({ topicId, subtopicId: subtopic.id, subtopic: subtopic.title, taskId: subtopic.taskId, url }));
  });
});
