# Context Engineering Demo - AI Research Assistant

A demonstration application showcasing Inngest's context engineering capabilities including rate limiting, durable execution, parallel processing, and observability. This app gathers research context from multiple sources and generates AI-powered responses using OpenAI's GPT-4.

![AI Research Assistant](https://img.shields.io/badge/Powered%20by-Inngest-5B4FFF)
![Next.js](https://img.shields.io/badge/Next.js-15-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)

## Features

- 🔄 **Parallel Context Gathering** - Fetches from multiple sources simultaneously (ArXiv, GitHub, Vector DB, Web Search)
- 🚦 **Rate Limiting** - Demonstrates global and per-user rate limits
- 💪 **Durable Execution** - Automatic retries and recovery from failures
- 📊 **Real-time Observability** - Visual workflow progress tracking
- 🧠 **AI-Powered Responses** - Uses GPT-4 with retrieval-augmented generation (RAG)
- 🎯 **Semantic Ranking** - Ranks context by relevance using embeddings
- ⚡ **Live Streaming** - Real-time updates streamed to frontend using Inngest Realtime
  - Step-by-step progress indicators
  - Per-source data fetching results
  - AI response streaming (typewriter effect)
  - Execution metadata (concurrency, throttling, rate limits)
  - Error notifications and completion status

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Orchestration**: Inngest
- **LLM**: OpenAI GPT-4
- **Vector DB**: In-memory (demo) / Pinecone (production)
- **UI**: React + Tailwind CSS
- **APIs**: ArXiv, GitHub, Web Search

## Getting Started

### Prerequisites

- Node.js 18+ installed
- OpenAI API key (required)
- GitHub token (optional, for GitHub search)
- SerpAPI key (optional, for web search)

### Installation

1. **Clone the repository and install dependencies**:

\`\`\`bash
npm install
\`\`\`

2. **Set up environment variables**:

\`\`\`bash
cp .env.example .env.local
\`\`\`

Edit `.env.local` and add your API keys:

\`\`\`bash
OPENAI_API_KEY=your_openai_api_key_here
# Optional: GITHUB_TOKEN, SERP_API_KEY, etc.
\`\`\`

3. **Start the Inngest Dev Server** (in a separate terminal):

\`\`\`bash
npx inngest-cli@latest dev
\`\`\`

This starts the Inngest Dev Server at `http://localhost:8288` where you can see:
- Real-time function execution
- Step-by-step workflow progress
- Rate limiting in action
- Detailed logs and metrics

4. **Start the Next.js development server**:

\`\`\`bash
npm run dev
\`\`\`

5. **Open your browser**:

Navigate to `http://localhost:3000`

## Uploading Documents to Pinecone

To populate your Pinecone vector database with PDF documents:

1. **Ensure your Pinecone index exists**:
   - Log into [Pinecone Console](https://app.pinecone.io/)
   - Create an index named `test-inngest-context-engineering`
   - Dimension: `1536` (for OpenAI embeddings)
   - Metric: `cosine`

2. **Upload a PDF**:

\`\`\`bash
npm run upload-pdf path/to/your/document.pdf
\`\`\`

Or upload multiple PDFs:

\`\`\`bash
npm run upload-pdf ./documents/*.pdf
\`\`\`

The script will:
- Extract text from the PDF
- Split it into ~1000 character chunks
- Generate embeddings using OpenAI
- Upload to your Pinecone index

**Example**:
\`\`\`bash
npm run upload-pdf ./research-papers/transformer-architecture.pdf
\`\`\`

## Usage

### Try Sample Queries

- "What are the latest advances in transformer architectures?"
- "Explain retrieval-augmented generation"
- "How does rate limiting work in distributed systems?"

### Viewing the Workflow

1. Submit a query in the web UI
2. Watch the real-time progress visualization
3. Open the Inngest Dev Server at `http://localhost:8288`
4. Navigate to the "Runs" tab to see detailed execution

## Project Structure

\`\`\`
context-engineering-and-inngest/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── inngest/
│   │   │   │   └── route.ts          # Inngest serve endpoint
│   │   │   └── query/
│   │   │       └── route.ts          # Query submission API
│   │   ├── page.tsx                  # Main UI
│   │   ├── layout.tsx
│   │   ├── globals.css
│   │   └── favicon.ico
│   ├── inngest/
│   │   ├── client.ts             # Inngest client setup
│   │   ├── types.ts              # TypeScript types
│   │   └── functions/
│   │       ├── gather-context.ts # Main context gathering
│   │       └── generate-response.ts # LLM response
│   ├── lib/
│   │   ├── openai.ts             # OpenAI utilities
│   │   ├── utils.ts              # Helper functions
│   │   └── sources/
│   │       ├── arxiv.ts          # ArXiv API wrapper
│   │       ├── github.ts         # GitHub API wrapper
│   │       ├── vectordb.ts       # Vector DB wrapper
│   │       └── websearch.ts      # Web search wrapper
│   └── components/
│       ├── QueryForm.tsx         # Search input form
│       ├── WorkflowVisualizer.tsx # Progress visualization
│       └── ResultsPanel.tsx      # Results display
├── .env.example                  # Environment template
└── README.md
\`\`\`

## Key Inngest Features Demonstrated

### 1. Rate Limiting

**Global Rate Limiting**:
\`\`\`typescript
concurrency: { limit: 50 },
rateLimit: { limit: 100, period: "1m" }
\`\`\`

**Per-User Throttling**:
\`\`\`typescript
throttle: {
  limit: 10,
  period: "1m",
  key: "event.data.userId"
}
\`\`\`

### 2. Durable Execution

All steps are wrapped in \`step.run()\` for automatic retries:
\`\`\`typescript
const contexts = await step.run("fetch-all-sources", async () => {
  // Automatically retried on failure
  return await fetchFromMultipleSources();
});
\`\`\`

### 3. Function Composition

Functions can invoke other functions with \`step.invoke()\`:
\`\`\`typescript
const response = await step.invoke("generate-llm-response", {
  function: generateLLMResponse,
  data: { query, contexts }
});
\`\`\`

### 4. Parallel Execution

Multiple data sources are fetched in parallel:
\`\`\`typescript
await Promise.allSettled([
  fetchArxiv(query),
  fetchGithub(query),
  fetchVectorDB(query),
  fetchWebSearch(query),
]);
\`\`\`

## Environment Variables

### Required

- \`OPENAI_API_KEY\` - OpenAI API key for LLM and embeddings

### Optional (for development)

- \`INNGEST_SIGNING_KEY\` - Inngest signing key (production only)
- \`INNGEST_EVENT_KEY\` - Inngest event key (production only)

### Optional (for full functionality)

- \`GITHUB_TOKEN\` - GitHub personal access token for code search
- \`PINECONE_API_KEY\` - Pinecone API key for vector search
- \`PINECONE_ENVIRONMENT\` - Pinecone environment
- \`SERP_API_KEY\` - SerpAPI key for web search

## Development

### Running Tests

\`\`\`bash
npm test
\`\`\`

### Linting

\`\`\`bash
npm run lint
\`\`\`

### Building for Production

\`\`\`bash
npm run build
npm start
\`\`\`

## Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Import the project in Vercel
3. Add environment variables in Vercel dashboard
4. Deploy!

### Configure Inngest for Production

1. Sign up at [app.inngest.com](https://app.inngest.com)
2. Create a new app
3. Get your signing key and event key
4. Add them to your environment variables
5. Point your production app to Inngest Cloud

## How It Works

1. **User submits a query** → Event sent to Inngest
2. **Parallel context gathering** → Fetches from 4 sources simultaneously
3. **Embedding generation** → Creates vector embeddings for all contexts
4. **Relevance ranking** → Scores contexts using cosine similarity
5. **LLM invocation** → Generates answer using top 10 contexts
6. **Response delivery** → Returns answer with sources

## Success Metrics

This demo successfully shows:

- ✅ Parallel context gathering from multiple sources
- ✅ Automatic rate limiting (visible in Inngest dashboard)
- ✅ Step-by-step execution with observability
- ✅ Graceful failure handling and retries
- ✅ End-to-end AI research assistant workflow

## Learn More

- [Inngest Documentation](https://www.inngest.com/docs)
- [Inngest Realtime Streaming Guide](./REALTIME_STREAMING.md) - **New!** Learn how we implemented live updates
- [Next.js Documentation](https://nextjs.org/docs)
- [OpenAI API Documentation](https://platform.openai.com/docs)

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
# Context-Engineering-with-Inngest
