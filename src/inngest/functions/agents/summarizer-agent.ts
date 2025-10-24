import { inngest } from "../../client";
import { researchChannel } from "../../channels";
import { models, modelInfo } from "@/lib/ai-models";
import { streamText } from "ai";

export const summarizerAgent = inngest.createFunction(
  {
    id: "summarizer-agent",
    name: "Claude Summarizer Agent",
    retries: 2,
    throttle: {
      limit: 10,
      period: "1m",
      key: "event.data.userId",
    },
  },
  { event: "agent/summarize" },
  async ({ event, step, publish }) => {
    const { query, contexts, sessionId, userId } = event.data;
    const startTime = Date.now();

    await step.run("publish-summarizer-start", async () => {
      await publish(
        researchChannel(sessionId)["agent-update"]({
          agent: "summarizer",
          status: "starting",
          message: `${modelInfo.summarizer.name}: Starting summarization`,
          timestamp: new Date().toISOString(),
        })
      );
    });

    // Simulate potential failure (10% chance)
    await step.run("check-availability", async () => {
      if (Math.random() < 0.1) {
        throw new Error("Claude API temporarily unavailable");
      }
    });

    const result = await step.run("claude-summarization", async () => {
      await publish(
        researchChannel(sessionId)["agent-update"]({
          agent: "summarizer",
          status: "running",
          message: `${modelInfo.summarizer.name}: Generating concise summary`,
          timestamp: new Date().toISOString(),
        })
      );

      const contextText = contexts
        .map((c: any, i: number) => `[${i + 1}] ${c.source}: ${c.text}`)
        .join("\n\n");

      const { textStream } = await streamText({
        model: models.summarizer,
        prompt: `You are a summarization specialist. Create a clear, concise summary of the key points related to the query. Focus on the most important information.

Query: ${query}

Context:
${contextText}

Provide a concise summary with key points:`,
      });

      let fullResponse = "";

      for await (const chunk of textStream) {
        fullResponse += chunk;

        publish(
          researchChannel(sessionId)["agent-chunk"]({
            agent: "summarizer",
            chunk,
            isComplete: false,
            timestamp: new Date().toISOString(),
          })
        ).catch((err) => console.error("Error publishing chunk:", err));
      }

      await publish(
        researchChannel(sessionId)["agent-chunk"]({
          agent: "summarizer",
          chunk: "",
          isComplete: true,
          timestamp: new Date().toISOString(),
        })
      );

      return fullResponse;
    });

    const duration = Date.now() - startTime;

    await step.run("publish-summarizer-complete", async () => {
      await publish(
        researchChannel(sessionId)["agent-update"]({
          agent: "summarizer",
          status: "completed",
          message: `${modelInfo.summarizer.name}: Summary complete`,
          timestamp: new Date().toISOString(),
          duration,
        })
      );

      await publish(
        researchChannel(sessionId)["agent-result"]({
          agent: "summarizer",
          response: result,
          model: "claude-3-5-sonnet",
          timestamp: new Date().toISOString(),
        })
      );
    });

    return {
      agent: "summarizer" as const,
      response: result,
      model: "claude-3-5-sonnet",
      duration,
    };
  }
);

