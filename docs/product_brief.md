# AWS Practice App — Master Product Brief

## 1. Product Vision

Build a mobile-first AWS certification practice app designed for frequent, lightweight study sessions on a phone.

The app should make it easy for a learner to open it at any time and immediately practice AWS questions, review concepts, revisit mistakes, and strengthen weak areas.

The core product is not a static question bank.

The core differentiator is:

* dynamically generated AWS exam-style questions
* grounded in trusted AWS documentation and exam concepts
* adaptive practice based on the learner’s performance
* short, clear concept explanations
* strong explanations for correct and incorrect answers
* mobile-first UX optimized for frequent use

The app should feel fast, simple, focused, and habit-forming.

Do not attempt to build the entire product in one implementation pass. This document describes the end-state. Implementation will be done phase by phase through separate instructions.

---

# 2. Primary User

The primary user is someone preparing for an AWS certification exam who:

* studies mostly on a phone
* wants to practice frequently throughout the day
* prefers short sessions over long study blocks
* wants both questions and concept explanations
* wants to understand why an answer is correct, not just memorize it
* wants weak areas to receive more attention automatically
* does not want to keep seeing the same fixed question bank repeatedly

The initial learning focus is:

* IAM
* EC2
* EBS

Additional AWS topics will be added later.

---

# 3. Core Learning Loop

The ideal practice flow is:

1. User opens the app.
2. User starts Quick Practice or chooses a topic.
3. App determines an appropriate topic/subtopic and difficulty.
4. App retrieves relevant AWS source context.
5. App generates a fresh exam-style question.
6. User selects an answer.
7. App evaluates the answer.
8. App immediately explains:

   * whether the answer was correct
   * why the correct answer is correct
   * why the other options are wrong
   * the underlying AWS concept
   * a short memory tip
9. Attempt is saved.
10. App adjusts future practice based on performance.
11. User continues to the next question.

The app should progressively focus more on weak concepts while still revisiting mastered areas often enough to maintain retention.

---

# 4. Question Philosophy

Questions should be generated dynamically rather than relying only on a fixed bank.

The app should eventually support a hybrid system:

## Dynamic Questions

Most normal practice questions should be generated on demand from trusted AWS-grounded context.

Generated questions should vary in:

* wording
* scenario
* difficulty
* distractors
* service combinations
* exam traps
* conceptual depth

The app should avoid generating near-duplicate questions within recent sessions.

## Anchor Questions

A smaller set of curated and validated questions may exist for:

* quality control
* benchmarks
* mock exams
* regression testing
* checking whether a learner truly understands a core concept

The app must never depend entirely on static questions.

---

# 5. Question Structure

Every question should use a structured schema.

Conceptually, a question contains:

```ts
type Question = {
  id: string;
  topic: string;
  subtopic: string;
  difficulty: "basic" | "exam" | "tricky";
  type: "single-choice";
  question: string;
  options: {
    id: string;
    text: string;
  }[];
  correctOptionId: string;
  explanation: string;
  optionExplanations: {
    optionId: string;
    explanation: string;
  }[];
  memoryTip: string;
  conceptSummary: string;
  sourceReferences?: SourceReference[];
};
```

The exact schema may evolve later, but the implementation should remain structured and strongly typed.

---

# 6. Difficulty Levels

The app should support at least three levels:

## Basic

Tests direct AWS knowledge.

Example:

Which EC2 purchasing option provides access to an entire physical server?

## Exam

Tests the same concept through a realistic AWS certification-style scenario.

## Tricky

Uses plausible distractors and closely related AWS services/features to test whether the learner understands the distinction.

Difficulty should eventually adapt based on user performance.

---

# 7. Question Explanation Experience

After answering, the learner should immediately see a strong explanation.

The explanation UI should include:

## Result

Example:

Correct

or

Incorrect — Correct answer: Dedicated Host

## Why

Explain the AWS concept in simple language.

## Why the other answers are wrong

Each incorrect option should receive a short explanation.

## Remember

A short memory aid.

Example:

Physical server / sockets / cores → Dedicated Host

## Concept

A slightly deeper explanation for users who want to review the topic.

The learner should not have to leave the question flow just to understand the answer.

---

# 8. AWS Grounding

Dynamic questions must eventually be grounded in authoritative AWS sources.

Preferred sources include:

* official AWS documentation
* AWS certification exam guides
* AWS FAQs
* AWS service documentation
* AWS Well-Architected material where relevant
* other first-party AWS learning material

The system should retrieve relevant source content before generating a question.

Conceptual architecture:

```text
Topic / subtopic selected
        ↓
Retrieve relevant AWS knowledge
        ↓
Send grounded context to LLM
        ↓
Generate structured question
        ↓
Validate response
        ↓
Show question
```

The LLM should not be asked to generate AWS questions entirely from memory when grounding is available.

The app should eventually be able to retain source references for generated questions.

---

# 9. Adaptive Learning

The system should track performance at multiple levels.

Potential metrics:

* topic accuracy
* subtopic accuracy
* recent accuracy
* difficulty-specific accuracy
* repeated mistakes
* time since last practice
* question confidence if added later
* number of attempts
* mastery level

Example:

```text
EC2
  Instance Types       85%
  Security Groups      92%
  Purchasing Options   54%
  EBS                  61%
```

If the learner performs poorly on Purchasing Options, future Quick Practice sessions should automatically include more questions about that area.

Adaptive behavior should not become extreme.

The learner should still receive a healthy mix of:

* weak topics
* medium-strength topics
* mastered topics for retention

---

# 10. Repetition Control

Dynamic generation should not mean meaningless variation.

The app should track recently tested concepts.

For example, if the learner recently answered several questions about:

* Dedicated Hosts
* Spot Instances
* EC2 Reserved Instances

the app should avoid immediately generating another near-identical Dedicated Host question unless that concept is currently a major weakness.

Store enough history to discourage recent semantic repetition.

---

# 11. Core Product Areas

The final application should include the following main areas.

## Home

The home screen should provide an immediate path into study.

Potential contents:

* Quick Practice
* current streak
* recent progress
* weak topics
* continue session
* daily goal
* topic shortcuts

The primary CTA should be obvious.

Example:

Practice 10 Questions

---

## Topics

Display AWS topics and progress.

Initial topics:

* IAM
* EC2
* EBS

Future examples:

* S3
* VPC
* RDS
* DynamoDB
* Route 53
* ELB
* Auto Scaling
* CloudFront
* SQS
* SNS
* Lambda
* CloudWatch
* Organizations
* KMS
* CloudFormation

Each topic can contain multiple subtopics.

---

## Practice

The central question experience.

Should include:

* topic indicator
* progress in current session
* question
* answer options
* submit/check answer
* explanation
* next question
* bookmark action

The UI should prioritize readability and thumb-friendly interaction.

---

## Concepts

A lightweight learning area.

Each concept should be presented in short sections such as:

* What it is
* Simple example
* Important exam point
* Common confusion
* Exam trap
* Remember this
* Quick check question

Concepts should avoid unnecessarily long textbook-style pages.

---

## Wrong Answers

Automatically collect questions or concepts the learner previously got wrong.

Allow the learner to:

* retry them
* review explanations
* filter by topic
* mark something as understood if appropriate

Wrong-answer behavior may eventually use concept-level regeneration rather than always replaying the exact same question.

---

## Weak Areas

Show concepts where performance is weakest.

Example:

```text
Needs work

EBS volume types       48%
EC2 purchasing         53%
IAM policies           64%
```

Users should be able to start practice directly from a weak area.

---

## Bookmarks

Allow users to save:

* confusing questions
* important concepts
* tricky exam scenarios

---

## Progress

Show useful learning progress without becoming overly complicated.

Possible metrics:

* overall accuracy
* topic accuracy
* questions answered
* streak
* weak areas
* improvement over time
* recent activity
* mastery status

Avoid meaningless gamification metrics unless they help learning.

---

## Mock Exam

A more exam-like experience.

Behavior:

* fixed session length
* optional timer
* no answer explanation during the exam
* answers reviewed at the end
* category breakdown
* missed-concept analysis

Mock mode should come later in development.

---

## Settings

Potential settings:

* certification target
* daily question goal
* preferred difficulty
* explanation depth
* theme
* notifications if later supported

---

# 12. Mobile-First UX

The primary experience is on a smartphone.

Design assumptions:

* one-handed interaction should be easy
* large touch targets
* minimal typing
* no dense desktop-first dashboards
* simple navigation
* fast screen transitions
* concise text
* readable question cards
* comfortable spacing
* clear hierarchy

The app should still work on desktop, but mobile is the priority.

---

# 13. Navigation

A simple bottom navigation may include:

```text
Home
Practice
Topics
Progress
```

Other sections can live within these areas.

Avoid having too many permanent navigation items.

---

# 14. PWA

The application should eventually behave like an installable mobile app through Progressive Web App support.

Target behavior:

* installable from browser
* home-screen icon
* standalone display where supported
* fast initial loading
* offline-friendly application shell if practical

Full offline question generation is not required.

---

# 15. Authentication

Authentication is not required in the earliest phase.

Eventually the app may support account authentication so progress can sync across devices.

The architecture should avoid decisions that make authentication difficult to add later.

---

# 16. Data Model

Eventually the application will need entities similar to:

```text
User
Topic
Subtopic
Concept
Question
Source
PracticeSession
Attempt
Bookmark
UserTopicStats
UserConceptStats
GenerationHistory
```

Important attempt data may include:

```text
userId
questionId
topic
subtopic
conceptId
selectedAnswer
correct
difficulty
timestamp
responseTime
sessionId
```

Dynamic questions should still receive a generated ID and enough metadata to track them.

---

# 17. AI Question Generation

The generation system should produce structured output.

The backend should validate LLM responses before showing them to users.

The model should receive instructions covering:

* target certification style
* topic
* subtopic
* difficulty
* AWS source context
* recently asked concepts
* weak concepts
* required JSON schema
* question quality rules

The model should not return arbitrary markdown that the frontend must parse.

Use structured JSON output.

---

# 18. Question Quality Rules

Generated questions should:

* have one clearly correct answer
* avoid ambiguous wording
* stay within supplied AWS context
* use plausible distractors
* test meaningful distinctions
* avoid trivia that is irrelevant to AWS certification
* avoid trick questions based on wording alone
* avoid hallucinated AWS features
* avoid unsupported numerical values
* include useful explanations
* remain concise enough for mobile

When the system cannot confidently generate a valid question, it should retry or fail gracefully rather than display questionable content.

---

# 19. Validation

The backend should eventually validate generated questions.

Potential checks:

* required fields exist
* exactly one correct option
* correctOptionId exists
* 4 options where appropriate
* no duplicate options
* explanations exist
* text length limits
* known topic/subtopic values
* source references exist when required

Later, semantic or model-based validation may be considered.

---

# 20. Initial Topic Taxonomy

The first content scope is IAM, EC2, and EBS.

Potential taxonomy:

## IAM

* root user
* IAM users
* IAM groups
* IAM roles
* policies
* policy structure
* password policy
* MFA
* access keys
* AWS CLI credentials
* least privilege
* temporary credentials
* instance roles

## EC2

* EC2 basics
* instance types
* security groups
* SSH
* public and private IP
* Elastic IP
* purchasing options
* On-Demand
* Reserved Instances
* Savings Plans
* Spot Instances
* Dedicated Instances
* Dedicated Hosts
* AMIs
* instance lifecycle
* user data
* instance metadata
* EC2 roles
* placement concepts where relevant

## EBS

* EBS basics
* persistence
* snapshots
* encryption
* gp2
* gp3
* io1/io2
* st1
* sc1
* IOPS
* throughput
* volume attachment
* resizing
* EBS vs Instance Store

This taxonomy should remain easy to extend.

---

# 21. Concept Content Style

Concept explanations should use plain language.

Preferred teaching structure:

```text
What is it?

Simple explanation.

Example

A realistic AWS example.

Exam point

What the certification question is likely testing.

Common confusion

Difference between similar AWS concepts.

Remember

A one-line memory shortcut.
```

The tone should be clear, practical, and concise.

Avoid overly formal AWS-documentation-style prose when a simpler explanation is possible.

---

# 22. Example Learning Experience

Question:

```text
A company uses software licenses that are billed based on physical CPU sockets and cores.

Which EC2 purchasing option provides visibility into the underlying physical server?

A. Reserved Instance
B. Dedicated Instance
C. Dedicated Host
D. Spot Instance
```

After selecting C:

```text
Correct

Dedicated Hosts give you an entire physical server dedicated to your AWS account.

Why?

They expose information about the underlying host, including sockets and physical cores, which can be important for certain licensing models.

Why the others are wrong

Reserved Instance
A billing discount model. It does not expose the physical host.

Dedicated Instance
Runs on hardware dedicated to one customer, but does not provide the same host-level visibility/control.

Spot Instance
Uses spare EC2 capacity at a discount and can be interrupted.

Remember

Sockets / physical cores / host-level licensing → Dedicated Host
```

This is the desired explanation style.

---

# 23. Technology Direction

The initial project uses:

* Next.js
* TypeScript
* Tailwind CSS
* App Router

The application should maintain clear separation between:

```text
UI
domain logic
API/backend logic
data access
AI generation
AWS knowledge retrieval
```

Do not tightly couple AI providers to UI components.

Provider-specific code should be behind abstractions where practical.

---

# 24. Backend Direction

The app may initially use Next.js server functionality rather than a separate backend service.

Potential future components:

```text
Next.js frontend
        ↓
Server/API layer
        ↓
Question generation service
        ↓
Retrieval service
        ↓
LLM provider
        ↓
Database
```

Avoid premature microservices.

Keep the first versions simple.

---

# 25. Database Direction

A Postgres-based backend such as Supabase is a likely future option, but implementation should not assume it until specifically requested.

The first phases may use local/mock data.

Persistence can be introduced later.

---

# 26. Security

Never expose private AI API keys in client-side code.

All sensitive model requests should happen server-side.

Future authentication and database access should use proper authorization rules.

Generated AWS content should be treated as untrusted input until validated.

---

# 27. Performance

Questions should feel fast.

Potential future strategy:

* pre-generate the next question while the learner reads the explanation
* cache AWS retrieval results
* cache generated questions selectively
* maintain small question queues
* avoid unnecessary API calls

Do not optimize prematurely, but keep this future pattern in mind.

---

# 28. Cost Awareness

Dynamic AI generation has a real API cost.

The final architecture should consider:

* efficient prompts
* smaller models where quality is sufficient
* caching
* pre-generation
* reuse of retrieval context
* token limits
* generation queues
* avoiding unnecessary regeneration

Question quality is more important than minimizing cost to the point of damaging the learning experience.

---

# 29. Error Handling

The UI should gracefully handle:

* network errors
* AI provider failures
* invalid generated questions
* retrieval failures
* empty states
* slow generation

The learner should never see raw provider errors.

A failed generation should allow retrying cleanly.

---

# 30. Visual Direction

The visual style should feel:

* clean
* modern
* focused
* lightweight
* calm
* mobile-native

Avoid:

* overly corporate dashboards
* excessive gradients
* cluttered cards
* tiny text
* too many metrics
* visual noise

The question itself should remain the visual focus during practice.

---

# 31. Gamification

Useful gamification may include:

* daily streak
* daily goal
* questions completed
* progress milestones

Do not allow gamification to overpower actual learning.

Accuracy and understanding matter more than points.

---

# 32. Future Possibilities

Not part of early implementation, but architecture should not unnecessarily block:

* multiple AWS certification tracks
* AI tutor/chat about a question
* voice explanations
* push notifications
* daily challenges
* shared question links
* admin/content review tools
* spaced repetition
* confidence rating
* certification readiness estimation
* importing study notes
* personalized revision plans

These are future ideas, not current requirements.

---

# 33. Implementation Strategy

This project MUST be implemented incrementally.

Do not attempt to build all features in one pass.

Each implementation phase will be given separately.

General rules:

1. Read this brief before working on a phase.
2. Only implement functionality requested in the current phase.
3. Do not prematurely implement later-phase features.
4. Keep architecture compatible with the end-state described here.
5. Prefer small, understandable abstractions.
6. Avoid unnecessary dependencies.
7. Keep TypeScript types strict.
8. Keep components reusable but do not over-engineer.
9. Run lint/build checks after meaningful implementation.
10. Fix errors introduced during the phase before finishing.
11. Do not silently change the core architecture without explaining why.
12. Maintain mobile-first UX throughout.
13. Do not introduce AI, databases, authentication, or retrieval until the relevant phase explicitly requests them.

---

# 34. Planned Development Phases

The likely implementation sequence is:

## Phase 1 — UI Foundation

* app shell
* mobile navigation
* home
* topics
* practice UI
* concept UI
* wrong answers UI
* mock local data
* reusable components

No AI, database, authentication, or retrieval.

## Phase 2 — Practice Engine

* question types
* session state
* scoring
* explanations
* local attempt tracking
* question progression
* difficulty handling

## Phase 3 — Dynamic Question Generation

* server-side LLM integration
* structured response schema
* validation
* question generation endpoint
* failure handling

## Phase 4 — AWS Knowledge Grounding

* source ingestion/retrieval
* AWS context retrieval
* grounded generation
* source metadata

## Phase 5 — Persistent User Data

* database
* attempt history
* bookmarks
* sessions
* topic statistics
* user progress

## Phase 6 — Adaptive Learning

* weak-area detection
* question selection logic
* repetition control
* adaptive difficulty

## Phase 7 — Concepts and Revision

* concept library
* exam traps
* memory tips
* revision sessions
* concept-linked practice

## Phase 8 — Mock Exams

* exam sessions
* timer
* delayed grading
* final analysis
* topic breakdown

## Phase 9 — PWA and Production Polish

* installability
* performance
* production error handling
* accessibility
* UX refinement
* deployment readiness

This sequence may evolve as implementation progresses.

---

# 35. Current Instruction to Codex

Treat this document as persistent product and architecture context.

Do not implement the product merely because you have read this brief.

Do not scaffold future features unless explicitly requested.

Wait for a separate phase-specific implementation request.

When a phase request arrives:

* inspect the existing repository first
* understand what already exists
* implement only the requested phase
* preserve compatibility with this product vision
* test the result
* summarize what changed
* identify any relevant limitations or follow-up items
