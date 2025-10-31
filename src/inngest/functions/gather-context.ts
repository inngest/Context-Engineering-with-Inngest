import { inngest } from "../client";
import { researchChannel } from "../channels";
import { fetchArxiv } from "@/lib/sources/arxiv";
import { fetchGithub } from "@/lib/sources/github";
import { fetchVectorDB } from "@/lib/sources/vectordb";
import { fetchWebSearch } from "@/lib/sources/websearch";
import { generateEmbeddings, rankByRelevance } from "@/lib/openai";
import type { ContextItem } from "../types";

export const gatherContext = inngest.createFunction(
  {
    id: "gather-research-context",
    name: "Gather Research Context",
    // Global rate limiting
    concurrency: { limit: 50 },
    rateLimit: { limit: 100, period: "1m" },
  },
  { event: "research/query.submitted" },
  async ({ event, step, publish }) => {
    const { query, userId, sessionId } = event.data;

    // Publish workflow started
    await step.run("publish-start", async () => {
      await publish(
        researchChannel(sessionId).progress({
          step: "initialization",
          status: "completed",
          message: `Starting research query: "${query}"`,
          timestamp: new Date().toISOString(),
          metadata: { userId },
        })
      );
    });

    // Publish concurrency/rate limit info
    await step.run("publish-execution-metadata", async () => {
      await publish(
        researchChannel(sessionId).metadata({
          type: "concurrency",
          message: "Function running with concurrency limit of 50",
          details: { concurrencyLimit: 50, rateLimit: "100 per minute" },
          timestamp: new Date().toISOString(),
        })
      );
    });

    // Step 1: Parallel context gathering from multiple sources
    await step.run("publish-fetching-start", async () => {
      await publish(
        researchChannel(sessionId).progress({
          step: "fetch-sources",
          status: "in_progress",
          message:
            "Fetching context from ArXiv, GitHub, VectorDB, and Web Search in parallel",
          timestamp: new Date().toISOString(),
        })
      );
    });

    const { contexts, results } = await step.run(
      "fetch-all-sources",
      async () => {
        console.log(`Fetching contexts for query: "${query}"`);

        const results = await Promise.allSettled([
          fetchArxiv(query),
          fetchGithub(query),
          fetchVectorDB(query),
          fetchWebSearch(query),
        ]);

        const allContexts: ContextItem[] = [];

        results.forEach((result, index) => {
          const sources = ["ArXiv", "GitHub", "VectorDB", "WebSearch"];
          if (result.status === "fulfilled") {
            console.log(`✓ ${sources[index]}: ${result.value.length} results`);
            allContexts.push(...result.value);
          } else {
            console.error(`✗ ${sources[index]} failed:`, result.reason);
          }
        });

        return { contexts: allContexts, results };
      }
    );

    // Publish source results (one by one for better UX)
    const sources = ["ArXiv", "GitHub", "VectorDB", "WebSearch"];
    for (let i = 0; i < results.length; i++) {
      await step.run(`publish-source-${sources[i].toLowerCase()}`, async () => {
        const result = results[i];
        await publish(
          researchChannel(sessionId)["source-result"]({
            source: sources[i],
            success: result.status === "fulfilled",
            count:
              result.status === "fulfilled" ? result.value.length : undefined,
            error:
              result.status === "rejected" ? String(result.reason) : undefined,
            timestamp: new Date().toISOString(),
          })
        );
      });
    }

    await step.run("publish-fetching-complete", async () => {
      await publish(
        researchChannel(sessionId).progress({
          step: "fetch-sources",
          status: "completed",
          message: `Found ${contexts.length} context items across all sources`,
          timestamp: new Date().toISOString(),
          metadata: { totalContexts: contexts.length },
        })
      );
    });

    if (contexts.length === 0) {
      await step.run("publish-no-contexts", async () => {
        await publish(
          researchChannel(sessionId).error({
            step: "fetch-sources",
            error: "No context found for the given query",
            recoverable: true,
            timestamp: new Date().toISOString(),
          })
        );
      });

      return {
        sessionId,
        response: {
          answer:
            "No context found for the given query. Please try a different search term.",
          model: "none",
          tokensUsed: 0,
        },
        contextsUsed: 0,
        topContexts: [],
      };
    }

    // Step 2: Generate embeddings (rate-limited by OpenAI)
    await step.run("publish-embeddings-start", async () => {
      await publish(
        researchChannel(sessionId).progress({
          step: "generate-embeddings",
          status: "in_progress",
          message: `Generating embeddings for ${contexts.length} contexts (rate-limited by OpenAI)`,
          timestamp: new Date().toISOString(),
        })
      );
    });

    const embeddings = await step.run("generate-embeddings", async () => {
      console.log(`Generating embeddings for ${contexts.length} contexts`);
      return await generateEmbeddings(contexts.map((c) => c.text));
    });

    await step.run("publish-embeddings-complete", async () => {
      await publish(
        researchChannel(sessionId).progress({
          step: "generate-embeddings",
          status: "completed",
          message: `Embeddings generated for ${contexts.length} contexts`,
          timestamp: new Date().toISOString(),
        })
      );
    });

    // Step 3: Rank contexts by relevance
    await step.run("publish-ranking-start", async () => {
      await publish(
        researchChannel(sessionId).progress({
          step: "rank-contexts",
          status: "in_progress",
          message: "Ranking contexts by relevance to your query",
          timestamp: new Date().toISOString(),
        })
      );
    });

    const rankedContexts = await step.run("rank-contexts", async () => {
      console.log("Ranking contexts by relevance");
      return rankByRelevance(contexts, embeddings, query);
    });

    await step.run("publish-ranking-complete", async () => {
      await publish(
        researchChannel(sessionId).progress({
          step: "rank-contexts",
          status: "completed",
          message: `Ranked ${rankedContexts.length} contexts. Using top 10 for response generation.`,
          timestamp: new Date().toISOString(),
          metadata: { totalRanked: rankedContexts.length, topUsed: 10 },
        })
      );
    });

    await step.run("publish-contexts", async () => {
      await publish(
        researchChannel(sessionId).contexts({
          totalFound: rankedContexts.length,
          topContexts: rankedContexts.slice(0, 10),
          timestamp: new Date().toISOString(),
        })
      );
    });

    await step.run("publish-context-gathering-complete", async () => {
      await publish(
        researchChannel(sessionId).progress({
          step: "context-gathering",
          status: "completed",
          message: "Context gathering complete. Ready for agent analysis.",
          timestamp: new Date().toISOString(),
          metadata: { contextsFound: rankedContexts.length, topSelected: 10 },
        })
      );
    });

    // Return contexts for orchestrator to use with agents
    return {
      sessionId,
      contextsUsed: rankedContexts.length,
      topContexts: rankedContexts.slice(0, 10),
    };
  }
);
