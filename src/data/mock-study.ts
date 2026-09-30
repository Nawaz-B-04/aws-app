import { getTopic, topics } from '@/data/roadmap';
import type { Question } from '@/types/study';

export { getTopic, topics };
const option = (id: string, text: string, explanation: string) => ({ id, text, explanation });
export const questions: Question[] = [
  { id: 'sample-iam-role', topicId: 'iam', subtopic: 'Roles and temporary credentials', conceptId: 'iam-role', difficulty: 'basic', kind: 'single',
    text: 'An EC2 application needs to read one S3 bucket. How should it receive AWS permissions?',
    options: [option('a', 'Store root access keys on the instance', 'Root credentials should not be used by applications.'), option('b', 'Attach an IAM role to the instance', 'A role gives the workload temporary credentials.'), option('c', 'Save an IAM password in user data', 'A password is not programmatic authorization.'), option('d', 'Make the bucket public', 'Public access exposes data unnecessarily.')],
    correctOptionIds: ['b'], explanation: 'An instance role supplies temporary credentials. Grant it only the S3 permissions needed.', memoryTip: 'Workload on AWS: use a role.', conceptSummary: 'Roles supply temporary credentials to trusted workloads.' },
  { id: 'sample-ec2-ami', topicId: 'ec2', subtopic: 'AMI and launch templates', conceptId: 'ec2-ami', difficulty: 'exam', kind: 'single',
    text: 'A team must launch several identical EC2 instances with the same operating system and preinstalled software. What should it create?',
    options: [option('a', 'An Amazon Machine Image', 'An AMI contains the image used to launch matching instances.'), option('b', 'An EBS snapshot only', 'A snapshot backs up a volume but is not a complete instance launch image.'), option('c', 'A security group', 'Security groups control network traffic.'), option('d', 'A Reserved Instance', 'A Reserved Instance is a billing commitment.')],
    correctOptionIds: ['a'], explanation: 'An AMI is a reusable instance image; a launch template can also save instance configuration.', memoryTip: 'AMI = launch image.', conceptSummary: 'AMIs define the software image used to launch EC2 instances.' },
  { id: 'sample-ebs-snapshot', topicId: 'ebs', subtopic: 'Snapshots and recovery', conceptId: 'ebs-snapshot', difficulty: 'exam', kind: 'single',
    text: 'Which feature provides a point-in-time backup that can be used to create a new EBS volume?',
    options: [option('a', 'EBS snapshot', 'Snapshots back up EBS volumes and can create new volumes.'), option('b', 'Security group', 'This controls traffic, not backups.'), option('c', 'Elastic IP', 'This is a static public IPv4 address.'), option('d', 'EC2 user data', 'This runs startup commands.')],
    correctOptionIds: ['a'], explanation: 'Create an EBS snapshot and later restore it as a new volume.', memoryTip: 'Volume backup = snapshot.', conceptSummary: 'Snapshots are point-in-time backups of EBS volumes.' },
  { id: 'sample-iam-multi', topicId: 'iam', subtopic: 'Policies and least privilege', conceptId: 'iam-policy-evaluation', difficulty: 'tricky', kind: 'multiple',
    text: 'Which TWO statements about IAM policy evaluation are correct? Select two.',
    options: [option('a', 'An explicit deny overrides an allow', 'Explicit deny has precedence.'), option('b', 'Access is allowed by default', 'Requests are implicitly denied by default.'), option('c', 'An identity policy can grant a permitted action', 'An applicable allow can grant access if no other policy blocks it.'), option('d', 'A group is a principal that assumes roles', 'Groups collect users but are not principals.'), option('e', 'A security group grants IAM API permissions', 'Security groups govern network traffic.')],
    correctOptionIds: ['a', 'c'], explanation: 'IAM starts with implicit deny. An applicable allow grants access unless an explicit deny or another boundary prevents it.', memoryTip: 'Default deny; explicit deny wins.', conceptSummary: 'IAM evaluates allows and denies across applicable policies.' },
  { id: 'sample-ec2-security', topicId: 'ec2', subtopic: 'Security groups', conceptId: 'ec2-sg', difficulty: 'basic', kind: 'single',
    text: 'An EC2 web server must accept HTTPS requests. Which security group rule is needed?',
    options: [option('a', 'Inbound TCP 443 from the required source', 'HTTPS requires inbound TCP 443.'), option('b', 'Outbound TCP 443 only', 'This does not permit new inbound connections.'), option('c', 'Inbound TCP 22 from everyone', 'Port 22 is SSH.'), option('d', 'No rule is needed', 'Inbound traffic is denied by default.')],
    correctOptionIds: ['a'], explanation: 'Allow inbound TCP port 443 from the intended clients. Return traffic is allowed because security groups are stateful.', memoryTip: 'HTTPS = inbound TCP 443.', conceptSummary: 'Security groups filter instance traffic.' },
  { id: 'sample-elb-alb', topicId: 'elb-asg', subtopic: 'ALB versus NLB and listeners', conceptId: 'elb-alb-path', difficulty: 'exam', kind: 'single',
    text: 'A web application must send /api requests to one target group and /images requests to another. Which load balancer should it use?',
    options: [option('a', 'Application Load Balancer', 'An ALB can route HTTP requests by path.'), option('b', 'Network Load Balancer', 'An NLB routes network connections, not URL paths.'), option('c', 'Auto Scaling group', 'An ASG changes instance capacity; it does not route requests.'), option('d', 'Route 53 hosted zone', 'DNS records do not inspect URL paths.')],
    correctOptionIds: ['a'], explanation: 'An ALB listener can send requests to target groups based on URL path rules.', memoryTip: 'HTTP path rules = ALB.', conceptSummary: 'ALB handles application-level HTTP routing.' },
  { id: 'sample-rds-multiaz', topicId: 'rds-aurora-cache', subtopic: 'Multi-AZ versus read replicas', conceptId: 'rds-ha-read', difficulty: 'exam', kind: 'single',
    text: 'An RDS DB instance needs a standby for automatic failover. Which deployment meets this requirement?',
    options: [option('a', 'Multi-AZ DB instance', 'A Multi-AZ DB instance has a synchronous standby for failover.'), option('b', 'Read replica only', 'An asynchronous read replica primarily adds read capacity.'), option('c', 'ElastiCache cluster', 'A cache is not an RDS standby.'), option('d', 'RDS Proxy only', 'A proxy pools connections but does not create a standby.')],
    correctOptionIds: ['a'], explanation: 'Use a Multi-AZ DB instance for a synchronous standby and automatic failover; use read replicas for read scaling.', memoryTip: 'Multi-AZ standby = availability.', conceptSummary: 'A traditional Multi-AZ DB instance maintains a standby in another Availability Zone.' },
  { id: 'sample-route53-alias', topicId: 'route53', subtopic: 'Alias records and AWS targets', conceptId: 'route53-apex-alias', difficulty: 'exam', kind: 'single',
    text: 'A team wants example.com itself to point to an Application Load Balancer. Which Route 53 record should it use?',
    options: [option('a', 'A alias record', 'An alias can point the zone apex to a supported ALB target.'), option('b', 'CNAME at the zone apex', 'A CNAME cannot be created at the zone apex.'), option('c', 'MX record', 'MX records identify mail servers.'), option('d', 'TXT record', 'TXT records store text values, not load balancer routing.')],
    correctOptionIds: ['a'], explanation: 'Route 53 alias records support the zone apex and can target an ALB.', memoryTip: 'Root domain to ALB = alias.', conceptSummary: 'Alias records connect names, including a zone apex, to supported AWS targets.' },
];
