import type { Topic } from '@/types/study';

export const domains = [
  { id: 'development', name: 'Development with AWS Services', weight: 32, tasks: [
    { id: '1.1', name: 'Develop code for applications hosted on AWS' },
    { id: '1.2', name: 'Develop code for AWS Lambda' },
    { id: '1.3', name: 'Use data stores in application development' },
  ] },
  { id: 'security', name: 'Security', weight: 26, tasks: [
    { id: '2.1', name: 'Implement authentication and authorization' },
    { id: '2.2', name: 'Implement encryption by using AWS services' },
    { id: '2.3', name: 'Manage sensitive data in application code' },
  ] },
  { id: 'deployment', name: 'Deployment', weight: 24, tasks: [
    { id: '3.1', name: 'Prepare application artifacts' },
    { id: '3.2', name: 'Test applications in development environments' },
    { id: '3.3', name: 'Automate deployment testing' },
    { id: '3.4', name: 'Deploy code by using CI/CD services' },
  ] },
  { id: 'troubleshooting', name: 'Troubleshooting and Optimization', weight: 18, tasks: [
    { id: '4.1', name: 'Assist in a root cause analysis' },
    { id: '4.2', name: 'Instrument code for observability' },
    { id: '4.3', name: 'Optimize applications' },
  ] },
] as const;

type Row = [string, string, string, string, string[]];
const rows: Row[] = [
  ['iam', 'IAM', 'Roles, policies, and AWS permissions.', '2.1', ['Roles and temporary credentials', 'Policies and least privilege', 'MFA and account security', 'Users and groups', 'Cross-account access']],
  ['ec2', 'EC2', 'Compute instances, AMIs, and networking.', '1.1', ['AMI and launch templates', 'Instance lifecycle', 'Security groups', 'Instance types', 'Purchasing options', 'User data and instance metadata']],
  ['ebs', 'EBS', 'Persistent block storage for EC2.', '1.3', ['Volumes and attachment', 'Volume types and performance', 'Snapshots and recovery', 'Encryption and KMS']],
  ['elb-asg', 'ELB + Auto Scaling', 'Distribute traffic and scale EC2 capacity.', '1.1', ['ALB versus NLB and listeners', 'Target groups and health checks', 'ASG capacity and scaling policies', 'Instance refresh and lifecycle']],
  ['rds-aurora-cache', 'RDS, Aurora + ElastiCache', 'Relational databases, connections, and caching.', '1.3', ['RDS basics and backups', 'Multi-AZ versus read replicas', 'Aurora clusters and endpoints', 'RDS Proxy and connections', 'ElastiCache engines and caching patterns']],
  ['route53', 'Route 53', 'DNS records, routing, and failover.', '1.1', ['Hosted zones, records and TTL', 'Alias records and AWS targets', 'Routing policies', 'Health checks and failover']],
  ['lambda', 'Lambda', 'Serverless functions and event processing.', '1.2', ['Configuration, handlers, layers and versions', 'Concurrency and performance', 'Triggers, destinations and error handling', 'VPC access and integrations', 'Testing and event transformation']],
  ['api-gateway', 'API Gateway', 'Build and deploy APIs.', '1.1', ['Routes, validation and transformations', 'Authentication and throttling', 'Stages, custom domains and deployments']],
  ['s3', 'S3', 'Object storage and access patterns.', '1.3', ['Objects, versioning and lifecycle', 'Presigned URLs and access', 'Encryption and event notifications']],
  ['dynamodb', 'DynamoDB', 'NoSQL access patterns and indexes.', '1.3', ['Partition and sort keys', 'Query versus Scan and indexes', 'Consistency and capacity', 'Streams, TTL and transactions']],
  ['datastores', 'Other data stores', 'OpenSearch, serialization, and data choices.', '1.3', ['Specialized stores and search', 'Serialization and data formats', 'Data lifecycle and access patterns']],
  ['messaging', 'Messaging and events', 'SQS, SNS, EventBridge and Step Functions.', '1.1', ['SQS queues, visibility and DLQs', 'SNS fanout and filtering', 'EventBridge rules and buses', 'Step Functions orchestration', 'Kinesis streaming and retries']],
  ['architecture', 'Application architecture', 'Resilience, APIs, SDKs and integration.', '1.1', ['Stateful versus stateless', 'Coupling and synchronous versus asynchronous', 'Fault tolerance, retries and circuit breakers', 'AWS SDK and API integration', 'Microservices and event-driven patterns']],
  ['cognito', 'Cognito and tokens', 'Application identities and authorization.', '2.1', ['User and identity pools', 'Federation and bearer tokens', 'Fine-grained application authorization']],
  ['kms', 'KMS and encryption', 'Keys, certificates and data protection.', '2.2', ['Encryption at rest and in transit', 'Client versus server encryption', 'KMS keys, rotation and grants', 'Cross-account encryption and certificates']],
  ['secrets', 'Secrets and sensitive data', 'Protect credentials and tenant data.', '2.3', ['Secrets Manager and Parameter Store', 'Encrypted environment variables', 'PII, masking and sanitization', 'Multi-tenant data access']],
  ['packaging', 'Application packaging', 'Artifacts and environment configuration.', '3.1', ['Dependencies and directory structure', 'Container images and resource requirements', 'Code repositories and AppConfig']],
  ['testing', 'Testing', 'Test deployed and event-driven apps.', '3.2', ['Unit and integration tests', 'Mock APIs and development endpoints', 'SAM local and staged stack updates', 'Event-driven testing']],
  ['iac', 'Infrastructure as code', 'SAM and CloudFormation environments.', '3.3', ['SAM and CloudFormation templates', 'Test events and API environments', 'Aliases, tags and approved versions']],
  ['cicd', 'CI/CD and releases', 'Build, deploy and roll back safely.', '3.4', ['CodeBuild and CodePipeline workflows', 'Lambda packaging and API stages', 'Canary, blue-green and rolling releases', 'Rollbacks and version management']],
  ['diagnostics', 'Troubleshooting', 'Find defects and failed integrations.', '4.1', ['Metrics, logs and traces', 'CloudWatch Logs Insights and dashboards', 'Custom metrics and deployment failures', 'Debugging integration and code defects']],
  ['observability', 'Observability', 'Instrument applications and alert on health.', '4.2', ['Structured logging and custom metrics', 'X-Ray tracing and annotations', 'Alarms, notifications and health checks']],
  ['optimization', 'Optimization', 'Tune performance, compute and caching.', '4.3', ['Concurrency and profiling', 'Memory and compute sizing', 'Caching and subscription filters', 'Bottlenecks and resource usage']],
];
export const topics: Topic[] = rows.map(([id, name, description, taskId, labels], index) => ({
  id, name, description, accent: ['#5672C9', '#B7744B', '#438B83', '#8A65AD'][index % 4],
  subtopics: labels.map((title, position) => ({ id: `${id}-${position + 1}`, title, taskId })),
}));
export const initialReadyTopicIds = ['iam', 'ec2', 'ebs'];
export const getTopic = (id: string) => topics.find((topic) => topic.id === id);
export const getDomainForTask = (taskId: string) => domains.find((domain) => domain.tasks.some((task) => task.id === taskId));
export const guideUrl = 'https://docs.aws.amazon.com/aws-certification/latest/developer-associate-02/developer-associate-02.html';
