import type { Concept, Question, Topic, UserProgress, WrongAnswer } from '@/types/study';

export const topics: Topic[] = [
  {
    id: 'iam', name: 'IAM', description: 'Control who can access AWS resources and what they can do.',
    progress: 72, accent: '#5672C9',
    subtopics: [
      { id: 'iam-roles', title: 'Roles & temporary credentials' },
      { id: 'iam-policies', title: 'Policies & least privilege' },
      { id: 'iam-mfa', title: 'MFA & account security' },
      { id: 'iam-users', title: 'Users & groups' },
    ],
  },
  {
    id: 'ec2', name: 'EC2', description: 'Choose, launch, and secure compute instances.',
    progress: 58, accent: '#B7744B',
    subtopics: [
      { id: 'ec2-purchase', title: 'Purchasing options' },
      { id: 'ec2-security', title: 'Security groups' },
      { id: 'ec2-types', title: 'Instance types' },
      { id: 'ec2-lifecycle', title: 'Instance lifecycle' },
    ],
  },
  {
    id: 'ebs', name: 'EBS', description: 'Understand persistent block storage for EC2.',
    progress: 43, accent: '#438B83',
    subtopics: [
      { id: 'ebs-types', title: 'Volume types' },
      { id: 'ebs-snapshots', title: 'Snapshots' },
      { id: 'ebs-encryption', title: 'Encryption' },
      { id: 'ebs-performance', title: 'IOPS & throughput' },
    ],
  },
];

export const questions: Question[] = [
  {
    id: 'q-ec2-host', topicId: 'ec2', subtopic: 'Purchasing options', difficulty: 'exam',
    text: 'A company has software licenses billed by physical CPU sockets and cores. Which EC2 option gives visibility into the underlying physical server?',
    options: [
      { id: 'a', text: 'Reserved Instance', explanation: 'A Reserved Instance is a billing discount; it does not expose a physical host.' },
      { id: 'b', text: 'Dedicated Instance', explanation: 'It runs on dedicated hardware, but does not provide the same host-level visibility.' },
      { id: 'c', text: 'Dedicated Host', explanation: 'A Dedicated Host exposes the physical host, including sockets and cores for licensing.' },
      { id: 'd', text: 'Spot Instance', explanation: 'Spot uses spare capacity at a discount and can be interrupted.' },
    ],
    correctOptionId: 'c',
    explanation: 'Dedicated Hosts provide an entire physical server for your account and visibility into its hardware. This helps with licenses tied to sockets or cores.',
    memoryTip: 'Sockets + cores + host licensing → Dedicated Host.',
  },
  {
    id: 'q-iam-role', topicId: 'iam', subtopic: 'Roles & temporary credentials', difficulty: 'basic',
    text: 'An application on EC2 needs to read from an S3 bucket. What is the recommended way to give it AWS permissions?',
    options: [
      { id: 'a', text: 'Store root user access keys on the instance', explanation: 'Root user credentials should never be used by an application.' },
      { id: 'b', text: 'Attach an IAM role to the instance', explanation: 'An instance role supplies temporary credentials without storing long-lived keys.' },
      { id: 'c', text: 'Put an IAM user password in user data', explanation: 'A password does not provide programmatic AWS access and should not be stored in user data.' },
      { id: 'd', text: 'Make the bucket public', explanation: 'Public access would expose the bucket and is unrelated to granting the application permission.' },
    ],
    correctOptionId: 'b',
    explanation: 'An EC2 instance role lets the application receive temporary credentials automatically. Grant the role only the S3 permissions it needs.',
    memoryTip: 'AWS workload on EC2 → instance role, not stored keys.',
  },
  {
    id: 'q-ebs-snapshot', topicId: 'ebs', subtopic: 'Snapshots', difficulty: 'exam',
    text: 'You need a backup of an EBS volume that you can use later to create a new volume. Which feature should you use?',
    options: [
      { id: 'a', text: 'An EBS snapshot', explanation: 'A snapshot is a point-in-time backup used to create new EBS volumes.' },
      { id: 'b', text: 'An EC2 security group', explanation: 'A security group controls network traffic, not storage backups.' },
      { id: 'c', text: 'An Elastic IP address', explanation: 'An Elastic IP is a static public IPv4 address, not a backup.' },
      { id: 'd', text: 'EC2 user data', explanation: 'User data runs startup commands; it does not preserve volume contents.' },
    ],
    correctOptionId: 'a',
    explanation: 'EBS snapshots preserve volume data at a point in time. You can create another EBS volume from a snapshot when needed.',
    memoryTip: 'EBS backup → snapshot → new volume.',
  },
  {
    id: 'q-ec2-sg', topicId: 'ec2', subtopic: 'Security groups', difficulty: 'tricky',
    text: 'An EC2 instance must accept HTTPS traffic from the internet. What should its security group allow?',
    options: [
      { id: 'a', text: 'Inbound TCP port 443 from the required source', explanation: 'HTTPS uses TCP port 443; an inbound rule allows clients to connect.' },
      { id: 'b', text: 'Outbound TCP port 443 only', explanation: 'An outbound rule alone does not permit new inbound client connections.' },
      { id: 'c', text: 'Inbound TCP port 22 from everyone', explanation: 'Port 22 is normally SSH, not HTTPS.' },
      { id: 'd', text: 'No rules because security groups allow all inbound traffic', explanation: 'Security groups deny inbound traffic unless a rule allows it.' },
    ],
    correctOptionId: 'a',
    explanation: 'Add an inbound rule for TCP 443 from the clients that should reach the instance. Security groups are stateful, so response traffic is automatically allowed.',
    memoryTip: 'Incoming HTTPS → inbound TCP 443.',
  },
];

export const concepts: Concept[] = [
  {
    id: 'iam-roles', topicId: 'iam', title: 'IAM roles',
    whatItIs: 'A role is a set of permissions that a trusted person or service can assume temporarily.',
    example: 'An EC2 instance assumes a role to read objects from one S3 bucket.',
    examPoint: 'Use roles and temporary credentials for workloads instead of embedding access keys.',
    confusion: 'An IAM user has long-term credentials; a role is assumed to get temporary credentials.',
    remember: 'Workload needs AWS access → role.',
  },
  {
    id: 'ec2-hosts', topicId: 'ec2', title: 'Dedicated Hosts',
    whatItIs: 'A physical EC2 server dedicated to one AWS account, with host-level visibility.',
    example: 'Bring a license that counts physical CPU sockets or cores.',
    examPoint: 'Choose a Dedicated Host when licensing needs host-level information or placement control.',
    confusion: 'Dedicated Instances use dedicated hardware but do not offer the same host visibility.',
    remember: 'Physical host details → Dedicated Host.',
  },
  {
    id: 'ebs-snapshots', topicId: 'ebs', title: 'EBS snapshots',
    whatItIs: 'A point-in-time backup of an EBS volume.',
    example: 'Snapshot a production volume before changing its data, then restore to a new volume if needed.',
    examPoint: 'Snapshots can be used to create new volumes and are incremental after the first snapshot.',
    confusion: 'A snapshot is a backup; a live EBS volume is block storage attached to an instance.',
    remember: 'Backup a volume → snapshot.',
  },
];

export const userProgress: UserProgress = {
  streakDays: 6, dailyGoal: 10, completedToday: 4, overallAccuracy: 68, totalAnswered: 124,
  topicPerformance: [
    { topicId: 'iam', accuracy: 76, answered: 42 },
    { topicId: 'ec2', accuracy: 64, answered: 51 },
    { topicId: 'ebs', accuracy: 61, answered: 31 },
  ],
  weakAreas: [
    { topicId: 'ebs', name: 'EBS volume types', accuracy: 48 },
    { topicId: 'ec2', name: 'EC2 purchasing', accuracy: 53 },
    { topicId: 'iam', name: 'IAM policies', accuracy: 64 },
  ],
};

export const wrongAnswers: WrongAnswer[] = [
  { id: 'wrong-1', questionId: 'q-ec2-host', topicId: 'ec2', concept: 'Dedicated Hosts vs Dedicated Instances', explanation: 'Host-level visibility is the clue for Dedicated Hosts.' },
  { id: 'wrong-2', questionId: 'q-ebs-snapshot', topicId: 'ebs', concept: 'EBS snapshots', explanation: 'Snapshots are point-in-time backups that can create new volumes.' },
  { id: 'wrong-3', questionId: 'q-iam-role', topicId: 'iam', concept: 'IAM roles for EC2', explanation: 'An instance role provides temporary credentials without stored keys.' },
];

export function getTopic(id: string) {
  return topics.find((topic) => topic.id === id);
}
