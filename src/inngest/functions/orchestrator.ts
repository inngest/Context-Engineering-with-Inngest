import { inngest } from "../client";
import { AgentResult, researchChannel } from "../channels";
import { gatherContext } from "./gather-context";
import { analystAgent } from "./agents/analyst-agent";
import { summarizerAgent } from "./agents/summarizer-agent";
import { factCheckerAgent } from "./agents/fact-checker-agent";
import { classifierAgent } from "./agents/classifier-agent";
import { synthesizerAgent } from "./agents/synthesizer-agent";

export const orchestrateMultiAgent = inngest.createFunction(
  {
    id: "orchestrate-multi-agent-research",
    name: "Multi-Agent Research Orchestrator",
    concurrency: { limit: 50 },
    rateLimit: { limit: 100, period: "1m" },
  },
  { event: "research/query.submitted" },
  async ({ event, step, publish }) => {
    const { query, userId, sessionId } = event.data;

    // Step 1: Gather context from multiple sources (existing function)
    await step.run("publish-orchestration-start", async () => {
      await publish(
        researchChannel(sessionId).progress({
          step: "orchestration",
          status: "starting",
          message: "Starting multi-agent research orchestration",
          timestamp: new Date().toISOString(),
          metadata: { agents: 4, finalSynthesis: true },
        })
      );
    });

    // Gather context (keep existing logic)
    const contextResult = await step.invoke("gather-context", {
      function: gatherContext,
      data: { query, userId, sessionId },
    });

    const { topContexts } = contextResult;

    if (!topContexts || topContexts.length === 0) {
      // No context found - return early
      await step.run("publish-no-context-result", async () => {
        await publish(
          researchChannel(sessionId).result({
            answer:
              "No context found for the given query. Please try a different search term.",
            model: "none",
            tokensUsed: 0,
            contextsUsed: 0,
            timestamp: new Date().toISOString(),
          })
        );
      });

      return contextResult;
    }

    // Step 2: FAN-OUT - Dispatch to multiple agents in parallel
    await step.run("publish-fan-out", async () => {
      await publish(
        researchChannel(sessionId).metadata({
          type: "info",
          message: "Fanning out to 4 specialized AI agents in parallel",
          details: {
            agents: [
              "GPT-4 Analyst",
              "Claude Summarizer",
              "Gemini Fact-Checker",
              "Mistral Classifier",
            ],
            parallelExecution: true,
          },
          timestamp: new Date().toISOString(),
        })
      );
    });

    // Invoke all 4 agents in parallel
    const agentResults = (await Promise.all([
      step.invoke("analyst-agent", {
        function: analystAgent,
        data: {
          query,
          contexts: topContexts as any,
          sessionId,
          userId,
        },
      }),
      step.invoke("summarizer-agent", {
        function: summarizerAgent,
        data: {
          query,
          contexts: topContexts as any,
          sessionId,
          userId,
        },
      }),
      step.invoke("fact-checker-agent", {
        function: factCheckerAgent,
        data: {
          query,
          contexts: topContexts as any,
          sessionId,
          userId,
        },
      }),
      step.invoke("classifier-agent", {
        function: classifierAgent,
        data: {
          query,
          contexts: topContexts as any,
          sessionId,
          userId,
        },
      }),
    ])) as Awaited<AgentResult[]>;

    // Step 3: FAN-IN - Synthesize all agent responses
    await step.run("publish-fan-in", async () => {
      await publish(
        researchChannel(sessionId).metadata({
          type: "info",
          message: "All agents complete. Synthesizing results with GPT-4",
          details: {
            completedAgents: agentResults.length,
            synthesisModel: "gpt-4-turbo-preview",
          },
          timestamp: new Date().toISOString(),
        })
      );
    });

    const synthesisResult = await step.invoke("synthesizer-agent", {
      function: synthesizerAgent,
      data: {
        query,
        agentResults: agentResults as AgentResult[],
        sessionId,
        userId,
      },
    });

    // Step 4: Publish final completion
    await step.run("publish-orchestration-complete", async () => {
      await publish(
        researchChannel(sessionId).progress({
          step: "orchestration",
          status: "completed",
          message: "Multi-agent research orchestration complete",
          timestamp: new Date().toISOString(),
        })
      );
    });

    // Publish final result
    await step.run("publish-final-result", async () => {
      await publish(
        researchChannel(sessionId).result({
          answer: synthesisResult.response,
          model: synthesisResult.model,
          tokensUsed: undefined, // Streaming doesn't provide token counts
          contextsUsed: topContexts.length,
          timestamp: new Date().toISOString(),
        })
      );
    });

    return {
      sessionId,
      response: {
        answer: synthesisResult.response,
        model: synthesisResult.model,
        tokensUsed: undefined,
      },
      contextsUsed: topContexts.length,
      topContexts,
      agentResults: agentResults.map((r) => ({
        agent: r.agent,
        model: r.model,
        duration: r.duration,
      })),
      synthesis: {
        model: synthesisResult.model,
        duration: synthesisResult.duration,
      },
    };
  }
);
