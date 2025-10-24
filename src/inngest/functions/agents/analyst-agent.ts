import { inngest } from "../../client";
import { researchChannel } from "../../channels";
import { models, modelInfo } from "@/lib/ai-models";
import { streamText } from "ai";

export const analystAgent = inngest.createFunction(
  {
    id: "analyst-agent",
    name: "GPT-4 Analyst Agent",
    retries: 2, // Auto-retry on failure
    throttle: {
      limit: 10,
      period: "1m",
      key: "event.data.userId",
    },
  },
  { event: "agent/analyze" },
  async ({ event, step, publish }) => {
    const { query, contexts, sessionId, userId } = event.data;
    const startTime = Date.now();

    // Publish agent starting
    await step.run("publish-analyst-start", async () => {
      await publish(
        researchChannel(sessionId)["agent-update"]({
          agent: "analyst",
          status: "starting",
          message: `${modelInfo.analyst.name}: Starting deep analysis`,
          timestamp: new Date().toISOString(),
        })
      );
    });

    // Simulate potential failure for retry demo (10% chance)
    await step.run("check-availability", async () => {
      if (Math.random() < 0.1) {
        throw new Error("GPT-4 API temporarily unavailable");
      }
    });

    // Generate analysis with streaming
    const result = await step.run("gpt4-analysis", async () => {
      await publish(
        researchChannel(sessionId)["agent-update"]({
          agent: "analyst",
          status: "running",
          message: `${modelInfo.analyst.name}: Analyzing context in detail`,
          timestamp: new Date().toISOString(),
        })
      );

      const contextText = contexts
        .map((c: any, i: number) => `[${i + 1}] ${c.source}: ${c.text}`)
        .join("\n\n");

      const { textStream } = await streamText({
        model: models.analyst,
        prompt: `You are a deep analysis specialist. Provide a comprehensive, detailed analysis of the following query based on the provided context. Be thorough and insightful.

Query: ${query}

Context:
${contextText}

Provide your detailed analysis:`,
      });

      let fullResponse = "";

      // Stream chunks to frontend
      for await (const chunk of textStream) {
        fullResponse += chunk;

        // Publish chunk
        publish(
          researchChannel(sessionId)["agent-chunk"]({
            agent: "analyst",
            chunk,
            isComplete: false,
            timestamp: new Date().toISOString(),
          })
        ).catch((err) => console.error("Error publishing chunk:", err));
      }

      // Signal completion
      await publish(
        researchChannel(sessionId)["agent-chunk"]({
          agent: "analyst",
          chunk: "",
          isComplete: true,
          timestamp: new Date().toISOString(),
        })
      );

      return fullResponse;
    });

    const duration = Date.now() - startTime;

    // Publish completion
    await step.run("publish-analyst-complete", async () => {
      await publish(
        researchChannel(sessionId)["agent-update"]({
          agent: "analyst",
          status: "completed",
          message: `${modelInfo.analyst.name}: Analysis complete`,
          timestamp: new Date().toISOString(),
          duration,
        })
      );

      await publish(
        researchChannel(sessionId)["agent-result"]({
          agent: "analyst",
          response: result,
          model: "gpt-4-turbo-preview",
          timestamp: new Date().toISOString(),
        })
      );
    });

    return {
      agent: "analyst" as const,
      response: result,
      model: "gpt-4-turbo-preview",
      duration,
    };
  }
);

