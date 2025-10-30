# AI Research Assistant - Inngest Context Engineering Examples

A collection of AI agent examples demonstrating **observable, debuggable, and production-ready** patterns using Inngest.

## 🎯 Choose Your Example

### **Option 1: Simple Research Agent** (Recommended Starting Point)

**Focus**: Observability, debugging, and reliability

Perfect for:
- 👉 Learning Inngest fundamentals
- 👉 Understanding how to debug AI agents
- 👉 Building your first agent
- 👉 Following the "Why Your AI Agent Breaks" article

**What you'll learn**:
- Observable workflow steps
- Loop detection and prevention
- Automatic retries with limits
- Debugging through Inngest dashboard

**Quick Start**:
```bash
npm install
npm run dev
npx inngest-cli@latest dev
```

📖 **[Read the Simple Example Guide →](./SIMPLE-EXAMPLE.md)**

---

### **Option 2: Advanced Multi-Agent System**

**Focus**: Production features, real-time updates, multi-source RAG

Perfect for:
- 👉 Production AI systems
- 👉 Multi-agent orchestration
- 👉 Real-time streaming responses
- 👉 Vector database integration

**What you'll learn**:
- Multi-agent coordination
- Real-time UI updates
- Vector embeddings & semantic search
- Rate limiting strategies
- Pinecone integration

📖 **[See Advanced Example Details →](./context-engineering-spec.md)**

---

## 📚 Project Structure

```
context-engineering-and-inngest/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── inngest/
│   │   │   │   └── route.ts          # Serves both examples
│   │   │   └── query/
│   │   │       └── route.ts          
│   │   ├── page.tsx                  # Main UI
│   │   └── actions.ts                # Server actions
│   │
│   ├── inngest/
│   │   ├── client.ts                 # Inngest client
│   │   ├── functions/
│   │   │   ├── gather-context-simple.ts    # 👈 SIMPLE VERSION
│   │   │   ├── gather-context.ts           # Advanced version
│   │   │   ├── orchestrator.ts             # Multi-agent coordinator
│   │   │   └── agents/                     # Specialized agents
│   │   │       ├── analyst-agent.ts
│   │   │       ├── summarizer-agent.ts
│   │   │       ├── fact-checker-agent.ts
│   │   │       ├── classifier-agent.ts
│   │   │       └── synthesizer-agent.ts
│   │   └── types.ts
│   │
│   ├── lib/
│   │   ├── sources/
│   │   │   ├── arxiv.ts              # Research papers
│   │   │   ├── github.ts             # Code repos
│   │   │   ├── vectordb.ts           # Pinecone (advanced)
│   │   │   └── websearch.ts          # Web results
│   │   └── openai.ts                 # LLM utilities
│   │
│   └── components/
│       ├── QueryForm.tsx
│       └── ... (UI components)
│
├── scripts/
│   ├── upload-pdf-to-pinecone.ts     # For advanced example
│   └── test-pinecone-connection.ts
│
├── SIMPLE-EXAMPLE.md                 # 👈 START HERE
├── context-engineering-spec.md       # Advanced example spec
└── README.md                         # This file
```

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- OpenAI API key

### Installation

```bash
# Install dependencies
npm install

# Set up environment
cp .env.example .env.local
# Add your OPENAI_API_KEY to .env.local
```

### Running the Simple Example

**Terminal 1 - Start Inngest Dev Server**:
```bash
npx inngest-cli@latest dev
```
→ Visit `http://localhost:8288` to see workflow execution

**Terminal 2 - Start Next.js**:
```bash
npm run dev
```
→ Visit `http://localhost:3000` to submit queries

**Test Query**:
```
"What are transformer architectures?"
```

Watch the execution in real-time in the Inngest dashboard!

---

## 🎓 Learning Path

### 1. Start with the Simple Example

Follow [SIMPLE-EXAMPLE.md](./SIMPLE-EXAMPLE.md) to:
- ✅ Understand observable workflow steps
- ✅ See loop detection in action
- ✅ Practice debugging with Inngest dashboard
- ✅ Learn retry strategies

### 2. Explore the Advanced Example

When ready for production features:
- Multi-agent orchestration
- Real-time streaming
- Vector database integration
- Complex rate limiting

---

## 🐛 Debugging Your Agent

### In Inngest Dev Server

1. **Submit a query** in the web UI
2. **Open Inngest dashboard** at `http://localhost:8288`
3. **Click "Runs" tab** to see all executions
4. **Click your run** to see step-by-step execution
5. **Replay any step** to test fixes

### Common Issues

**Agent loops forever?**
→ Check the `check-context-quality` step in dashboard
→ See threshold and actual count
→ Notice max retry limit (2 attempts)

**No results found?**
→ Click `search-arxiv` step
→ See exactly what was searched
→ Check if API is accessible

**LLM response is poor?**
→ Click `generate-llm-response` step
→ See exact context passed to model
→ Check token usage and model

---

## 📊 Comparison Table

| Feature | Simple Example | Advanced Example |
|---------|----------------|------------------|
| **Lines of Code** | ~120 | ~800+ |
| **Data Sources** | ArXiv | ArXiv + GitHub + Pinecone + Web |
| **Agents** | Single function | 6 specialized agents |
| **Real-time UI** | No | Yes (streaming) |
| **Vector Search** | No | Yes (semantic ranking) |
| **Rate Limiting** | Basic retries | Multi-tier strategies |
| **Setup Time** | 5 minutes | 30+ minutes |
| **Best For** | Learning & debugging | Production systems |

---

## 🛠️ Environment Variables

### Required (Both Examples)

```bash
OPENAI_API_KEY=your_openai_key_here
```

### Optional (Advanced Example Only)

```bash
# GitHub API (for code search)
GITHUB_TOKEN=your_github_token

# Pinecone (for vector search)
PINECONE_API_KEY=your_pinecone_key
PINECONE_INDEX=your_index_name
EMBEDDING_DIMENSION=1024

# Web Search
SERP_API_KEY=your_serp_key
```

---

## 📖 Documentation

- **[Simple Example Guide](./SIMPLE-EXAMPLE.md)** - Start here!
- **[Advanced Spec](./context-engineering-spec.md)** - Full feature documentation
- **[Inngest Docs](https://www.inngest.com/docs)** - Official Inngest documentation

---

## 🎯 Key Takeaways

**From the Simple Example**:
- ✅ AI agents need **observability** to debug effectively
- ✅ **Loop prevention** is critical for production
- ✅ **Step-by-step execution** makes failures obvious
- ✅ **Replay capability** speeds up debugging 10x

**From the Advanced Example**:
- ✅ **Multi-agent patterns** for complex tasks
- ✅ **Real-time streaming** for better UX
- ✅ **Vector search** for semantic relevance
- ✅ **Rate limiting** protects APIs and budgets

---

## 🤝 Contributing

This is a reference implementation. Feel free to:
- Fork and customize for your use case
- Report issues or suggest improvements
- Share how you've adapted it

---

## 📝 License

MIT

---

## 🔗 Resources

- [Inngest Documentation](https://www.inngest.com/docs)
- [OpenAI API Docs](https://platform.openai.com/docs)
- [Next.js App Router](https://nextjs.org/docs/app)

---

**💡 Remember**: Start simple, add complexity only when needed. The best AI agent is one you can debug when it breaks!
