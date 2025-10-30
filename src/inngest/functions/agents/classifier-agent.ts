import { inngest } from "../../client";
import { researchChannel } from "../../channels";
import { models, modelInfo } from "@/lib/ai-models";
import { streamText } from "ai";
import { publishTokenByTokenUpdates } from "@/lib/utils";

export const classifierAgent = inngest.createFunction(
  {
    id: "classifier-agent",
    name: "Mistral Classifier Agent",
    retries: 2,
    throttle: {
      limit: 10,
      period: "1m",
      key: "event.data.userId",
    },
  },
  { event: "agent/classify" },
  async ({ event, step, publish }) => {
    const { query, contexts, sessionId, userId } = event.data;
    const startTime = +new Date(event.ts!);

    await step.run("publish-classifier-start", async () => {
      await publish(
        researchChannel(sessionId)["agent-update"]({
          agent: "classifier",
          status: "starting",
          message: `${modelInfo.classifier.name}: Starting classification`,
          timestamp: new Date().toISOString(),
        })
      );
    });

    // Simulate potential failure (10% chance)
    await step.run("check-availability", async () => {
      if (Math.random() < 0.1) {
        throw new Error("Mistral API temporarily unavailable");
      }
    });

    const result = await step.run("mistral-classification", async () => {
      await publish(
        researchChannel(sessionId)["agent-update"]({
          agent: "classifier",
          status: "running",
          message: `${modelInfo.classifier.name}: Categorizing and classifying content`,
          timestamp: new Date().toISOString(),
        })
      );

      const contextText = contexts
        .map((c: any, i: number) => `[${i + 1}] ${c.source}: ${c.text}`)
        .join("\n\n");

      const { textStream } = await streamText({
        model: models.classifier,
        prompt: `You are a classification specialist. Categorize the query and identify key topics, themes, and relevant domains. Provide clear categorization.

Query: ${query}

Context:
${contextText}

Provide your classification and categorization:`,
      });

      let fullResponse = await publishTokenByTokenUpdates(
        textStream,
        async (message) => {
          return publish(
            researchChannel(sessionId)["agent-chunk"]({
              agent: "classifier",
              ...message,
            })
          );
        }
      );

      return fullResponse;
    });

    const duration = Date.now() - startTime;

    await step.run("publish-classifier-complete", async () => {
      await publish(
        researchChannel(sessionId)["agent-update"]({
          agent: "classifier",
          status: "completed",
          message: `${modelInfo.classifier.name}: Classification complete`,
          timestamp: new Date().toISOString(),
          duration,
        })
      );

      await publish(
        researchChannel(sessionId)["agent-result"]({
          agent: "classifier",
          response: result,
          model: "mistral-large-latest",
          timestamp: new Date().toISOString(),
        })
      );
    });

    return {
      agent: "classifier" as const,
      response: result,
      model: "mistral-large-latest",
      duration,
    };
  }
);
