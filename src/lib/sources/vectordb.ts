import { Pinecone } from "@pinecone-database/pinecone";
import type { VectorDBResult } from "@/inngest/types";
import { generateEmbeddings } from "@/lib/openai";

// Initialize Pinecone client (singleton pattern)
let pineconeClient: Pinecone | null = null;

function getPineconeClient(): Pinecone | null {
  if (!process.env.PINECONE_API_KEY) {
    return null;
  }

  if (!pineconeClient) {
    pineconeClient = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY,
    });
  }

  return pineconeClient;
}

// Mock vector database for demo purposes when Pinecone isn't configured
const mockVectorDB = [
  {
    text: "Machine learning is a subset of artificial intelligence that focuses on learning from data. It enables systems to improve from experience without being explicitly programmed.",
    embedding: Array(1536)
      .fill(0)
      .map(() => Math.random()),
  },
  {
    text: "Transformer architectures revolutionized natural language processing by introducing self-attention mechanisms. They enable models to process entire sequences in parallel rather than sequentially.",
    embedding: Array(1536)
      .fill(0)
      .map(() => Math.random()),
  },
  {
    text: "Retrieval-augmented generation (RAG) combines information retrieval with language generation. It allows models to access external knowledge bases to produce more accurate and up-to-date responses.",
    embedding: Array(1536)
      .fill(0)
      .map(() => Math.random()),
  },
  {
    text: "Rate limiting in distributed systems prevents resource exhaustion by controlling the number of requests a client can make in a given time period. Common strategies include token bucket and leaky bucket algorithms.",
    embedding: Array(1536)
      .fill(0)
      .map(() => Math.random()),
  },
  {
    text: "Vector embeddings are numerical representations of data that capture semantic meaning. They enable efficient similarity search and are fundamental to modern AI applications.",
    embedding: Array(1536)
      .fill(0)
      .map(() => Math.random()),
  },
];

export async function fetchVectorDB(query: string): Promise<VectorDBResult[]> {
  const pinecone = getPineconeClient();

  // If Pinecone is not configured, use mock data
  if (!pinecone) {
    console.log("Pinecone not configured, using mock vector DB");
    return mockVectorDB.slice(0, 3).map((item) => ({
      source: "vectordb" as const,
      text: item.text,
      title: item.text.substring(0, 50) + "...",
      relevance: Math.random(),
    }));
  }

    try {
      // Get the index name from environment or use default
      const indexName = process.env.PINECONE_INDEX || "test-inngest-context-engineering";

      // Get the index
      const index = pinecone.index(indexName);

    // Generate embedding for the query
    const queryEmbeddings = await generateEmbeddings([query]);
    const queryEmbedding = queryEmbeddings[0];

    // Query Pinecone for similar vectors
    const queryResponse = await index.query({
      vector: queryEmbedding,
      topK: 5,
      includeMetadata: true,
    });
    // Transform Pinecone results to our format
    return (
      queryResponse.matches?.map((match) => ({
        source: "vectordb" as const,
        text: (match.metadata?.text as string) || "",
        title: (match.metadata?.title as string) || "Vector DB Result",
        url: (match.metadata?.url as string) || undefined,
        relevance: match.score || 0,
      })) || []
    );
  } catch (error) {
    console.error("Error fetching from Pinecone:", error);
    // Fallback to mock data on error
    return mockVectorDB.slice(0, 3).map((item) => ({
      source: "vectordb" as const,
      text: item.text,
      title: item.text.substring(0, 50) + "...",
      relevance: Math.random(),
    }));
  }
}

/**
 * Helper function to populate Pinecone with initial data
 * Call this once to seed your index with documents
 */
export async function seedPineconeIndex(
  documents: Array<{ id: string; text: string; title?: string; url?: string }>
): Promise<void> {
  const pinecone = getPineconeClient();

  if (!pinecone) {
    throw new Error("Pinecone is not configured. Set PINECONE_API_KEY.");
  }

  const indexName = process.env.PINECONE_INDEX || "test-inngest-context-engineering";
  const index = pinecone.index(indexName);

  // Generate embeddings for all documents
  const texts = documents.map((doc) => doc.text);
  const embeddings = await generateEmbeddings(texts);

  // Prepare vectors for upsert
  const vectors = documents.map((doc, i) => ({
    id: doc.id,
    values: embeddings[i],
    metadata: {
      text: doc.text,
      title: doc.title || "",
      url: doc.url || "",
    },
  }));

  // Upsert vectors in batches of 100
  const batchSize = 100;
  for (let i = 0; i < vectors.length; i += batchSize) {
    const batch = vectors.slice(i, i + batchSize);
    await index.upsert(batch);
    console.log(
      `Upserted batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(vectors.length / batchSize)}`
    );
  }

  console.log(`Successfully seeded ${vectors.length} vectors to Pinecone`);
}
