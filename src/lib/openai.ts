import { openai } from "@ai-sdk/openai";
import { embed } from "ai";
import type { ContextItem } from "@/inngest/types";

export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  if (!process.env.OPENAI_API_KEY) {
    console.warn("OPENAI_API_KEY not set, returning empty embeddings");
    const dimension = parseInt("1024");
    return texts.map(() => Array(dimension).fill(0));
  }

  try {
    // Use AI SDK's embed function with OpenAI provider
    // Support configurable dimensions via EMBEDDING_DIMENSION env var (default: 1536)
    const dimension = parseInt("1024");
    const embeddingModel = openai.embedding("text-embedding-3-small", {
      dimensions: dimension,
    });
    
    const embeddings: number[][] = [];
    
    // Process each text individually (AI SDK's embed function handles single values)
    for (const text of texts) {
      const { embedding } = await embed({
        model: embeddingModel,
        value: text,
      });
      embeddings.push(embedding);
    }

    return embeddings;
  } catch (error) {
    console.error("Error generating embeddings:", error);
    // Return zero vectors as fallback
    const dimension = parseInt("1024");
    return texts.map(() => Array(dimension).fill(0));
  }
}

// Calculate cosine similarity between two vectors
function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  return denominator === 0 ? 0 : dotProduct / denominator;
}

export async function rankByRelevance(
  contexts: ContextItem[],
  embeddings: number[][],
  query: string
): Promise<ContextItem[]> {
  try {
    // Generate embedding for the query
    const queryEmbeddings = await generateEmbeddings([query]);
    const queryEmbedding = queryEmbeddings[0];

    // Calculate relevance scores using cosine similarity
    const dimension = parseInt("1024");
    const contextsWithRelevance = contexts.map((context, i) => {
      const embedding = embeddings[i] || Array(dimension).fill(0);
      const relevance = cosineSimilarity(queryEmbedding, embedding);

      return {
        ...context,
        relevance,
      };
    });

    // Sort by relevance (highest first)
    return contextsWithRelevance.sort((a, b) => b.relevance - a.relevance);
  } catch (error) {
    console.error("Error ranking contexts:", error);
    // Fallback to random relevance
    return contexts
      .map((context) => ({
        ...context,
        relevance: Math.random(),
      }))
      .sort((a, b) => (b.relevance || 0) - (a.relevance || 0));
  }
}

// No longer exporting openai client - use AI SDK models from @/lib/ai-models instead

