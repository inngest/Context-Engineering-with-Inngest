/**
 * Simplified Research Agent - Focus on Observability
 * 
 * This example demonstrates:
 * 1. Observable workflow steps
 * 2. Loop detection and prevention
 * 3. Automatic retries with limits
 * 4. Clear debugging through step names
 */

import { inngest } from "../client";
import { researchChannel } from "../channels";
import { fetchArxiv } from "@/lib/sources/arxiv";
import { openai } from "@ai-sdk/openai";
import { generateText } from "ai";

export const gatherContextSimple = inngest.createFunction(
  {
    id: "gather-research-context-simple",
    name: "Simple Research Agent",
    retries: 3, // Auto-retry on failure
  },
  { event: "research/query.submitted" },
  async ({ event, step, attempt, publish }) => {
    const { query, sessionId } = event.data;
    const MIN_PAPERS = 3; // Threshold for quality research
    const MAX_ATTEMPTS = 2; // Loop prevention

    console.log(`🔍 Starting research for: "${query}" (attempt ${attempt}/${MAX_ATTEMPTS})`);

    // ========================================
    // STEP 1: Search ArXiv & Validate Quality
    // This step handles fetching AND quality checking
    // ========================================
    // Publish: Starting search
    await publish(
      researchChannel(sessionId).progress({
        step: "search-arxiv",
        status: "running",
        message: `Searching ArXiv database... (attempt ${attempt + 1}/${MAX_ATTEMPTS + 1})`,
        attempt,
      })
    );

    const papers = await step.run("search-arxiv", async () => {
      console.log("📚 Searching ArXiv database...");
      const results = await fetchArxiv(query);
      
      // 🎯 DEMO: Simulate insufficient results on first attempt
      // This demonstrates retry logic and loop prevention
      let finalResults = results;
      if (attempt === 0 && results.length >= MIN_PAPERS) {
        // On first attempt, artificially limit to 1 paper
        finalResults = results.slice(0, 1);
        console.warn(
          `⚠️ DEMO MODE: Artificially limiting to ${finalResults.length} paper(s) to demonstrate retry logic\n` +
          `   (Actually found ${results.length} papers)`
        );
      }
      
      console.log(`✓ Found ${finalResults.length} research papers (attempt ${attempt})`);
      
      // Quality check: Do we have enough papers?
      const hasEnoughPapers = finalResults.length >= MIN_PAPERS;
      
      if (!hasEnoughPapers && attempt < MAX_ATTEMPTS) {
        console.log(
          `⚠️ Insufficient papers: ${finalResults.length}/${MIN_PAPERS}\n` +
          `   Will retry (attempt ${attempt + 1}/${MAX_ATTEMPTS})`
        );
        
        // Throw error to trigger function retry
        throw new Error(
          `Insufficient research context: found ${finalResults.length} papers, need at least ${MIN_PAPERS}`
        );
      }

      // If we've exhausted retries but still don't have enough, warn and continue
      if (!hasEnoughPapers) {
        console.log(
          `⚠️ Proceeding with ${finalResults.length}/${MIN_PAPERS} papers after max retries\n` +
          `   This may result in lower quality response`
        );
      }
      
      // Return with simple relevance (using ArXiv's native ordering)
      return {
        papers: finalResults.map((paper, index) => ({
          ...paper,
          relevance: 1 - (index * 0.1),
        })),
        quality: hasEnoughPapers ? 'high' : 'low',
        paperCount: finalResults.length,
      };
    });

    // Publish: Search complete with status
    await publish(
      researchChannel(sessionId).progress({
        step: "search-arxiv",
        status: papers.quality === 'high' ? "completed" : "completed",
        message: papers.quality === 'high' 
          ? `✓ Found ${papers.paperCount} research papers`
          : `⚠️ Found only ${papers.paperCount}/${MIN_PAPERS} papers. Proceeding with low quality.`,
        data: { paperCount: papers.paperCount, threshold: MIN_PAPERS },
        attempt,
      })
    );

    // ========================================
    // STEP 2: Generate AI Response
    // ========================================
    await publish(
      researchChannel(sessionId).progress({
        step: "generate-llm-response",
        status: "running",
        message: "Generating AI response...",
        attempt,
      })
    );

    const response = await step.run("generate-llm-response", async () => {

      const contextText = papers.papers
        .slice(0, 5)
        .map((p, i) => `[${i + 1}] ${p.title}\n${p.text}`)
        .join("\n\n");

      const result = await generateText({
        model: openai("gpt-4o-mini"),
        prompt: `You are a research assistant. Answer this question using the provided research papers. Cite sources using [1], [2], etc.

Question: ${query}

Research Papers:
${contextText}`,
      });

      return {
        answer: result.text,
        tokensUsed: result.usage?.totalTokens,
      };
    });

    // Publish: LLM complete
    await publish(
      researchChannel(sessionId).progress({
        step: "generate-llm-response",
        status: "completed",
        message: `✓ Generated response (${response.tokensUsed} tokens)`,
        attempt,
      })
    );

    console.log(
      `✅ Research completed successfully\n` +
      `   Papers used: ${Math.min(papers.papers.length, 5)}\n` +
      `   Total attempts: ${attempt + 1}\n` +
      `   Tokens used: ${response.tokensUsed || 'N/A'}`
    );

    // ========================================
    // Final: Publish Result
    // ========================================
    await publish(
      researchChannel(sessionId).result({
        status: "completed",
        answer: response.answer,
        contextsUsed: papers.papers.length,
        attempts: attempt + 1,
        tokensUsed: response.tokensUsed,
        quality: papers.quality,
      })
    );

    // Return complete result
    return {
      sessionId,
      response: response,
      contextsUsed: papers.papers.length,
      topContexts: papers.papers.slice(0, 5),
      attempts: attempt + 1,
      quality: papers.quality,
    };
  }
);

