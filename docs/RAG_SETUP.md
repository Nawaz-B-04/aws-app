# AWS documentation index setup

The phone uses the existing hosted API. Run indexing from the app folder when you first set up Pinecone or want to refresh AWS pages.

**Current status (September 30, 2026):** The 35 curated AWS pages covering 28 subtopics are indexed, the Pinecone settings are in the Expo preview environment, and the hosted API is deployed at `https://aws-practice-nawaz343--api.expo.app`. A live IAM exam question returned AWS source links. Re-run indexing only when refreshing the source pages.

1. Create a free Pinecone Starter project and API key. Add `PINECONE_API_KEY=...` to ignored `.env.local`.
2. Check the curated links covering 28 subtopics: `node scripts/index-aws-docs.cjs --check`. Use `--dry-run` to fetch and parse the pages without changing Pinecone.
3. Run `node scripts/index-aws-docs.cjs`. It creates the `aws-practice-dva-c02` index in AWS `us-east-1`, downloads only the listed official AWS pages, and updates the chunks. It prints the index host when finished.
4. Add the printed `PINECONE_INDEX_HOST=...` to `.env.local`. Add both `PINECONE_API_KEY` and `PINECONE_INDEX_HOST` as **Sensitive** variables in the EAS `preview` environment. Keep `OPENROUTER_API_KEY` there too. Never use an `EXPO_PUBLIC_` prefix for either private key.
5. Export and deploy the hosted API with the `preview` environment, then install the updated Android APK to see source links. Changing a hosted variable needs another API deployment.

If Pinecone is unavailable, indexed exam questions wait for Retry; practice can use a labeled local sample. Full Mock still covers all 23 topic groups and marks questions outside the first six **Without AWS sources**. OpenRouter credits are still needed for new questions.
