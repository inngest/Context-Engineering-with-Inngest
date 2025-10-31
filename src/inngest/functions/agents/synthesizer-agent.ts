import { inngest } from "../../client";
import { researchChannel } from "../../channels";
import { models, modelInfo } from "@/lib/ai-models";
import { streamText } from "ai";

export const synthesizerAgent = inngest.createFunction(
  {
    id: "synthesizer-agent",
    name: "GPT-4 Synthesizer Agent",
    retries: 2,
    throttle: {
      limit: 10,
      period: "1m",
      key: "event.data.userId",
    },
  },
  { event: "agent/synthesize" },
  async ({ event, step, publish }) => {
    const { query, agentResults, sessionId, userId } = event.data;
    const startTime = +new Date(event.ts!);

    await step.run("publish-synthesizer-start", async () => {
      await publish(
        researchChannel(sessionId)["agent-update"]({
          agent: "synthesizer",
          status: "starting",
          message: `${modelInfo.synthesizer.name}: Starting synthesis of all agent responses`,
          timestamp: new Date().toISOString(),
        })
      );
    });

    const result = await step.run("gpt4-synthesis", async () => {
      await publish(
        researchChannel(sessionId)["agent-update"]({
          agent: "synthesizer",
          status: "running",
          message: `${modelInfo.synthesizer.name}: Combining insights from all agents`,
          timestamp: new Date().toISOString(),
        })
      );

      // Format agent responses for synthesis
      const agentInputs = agentResults
        .map((result) => {
          const agentName =
            result.agent.charAt(0).toUpperCase() + result.agent.slice(1);
          return `--- ${agentName} Agent (${result.model}) ---\n${result.response}`;
        })
        .join("\n\n");

      const { textStream } = await streamText({
        model: models.synthesizer,
        prompt: `You are a synthesis specialist. You have received analyses from multiple AI agents, each with different specializations. Your job is to synthesize their insights into a single, comprehensive, coherent answer.

Original Query: ${query}

Agent Responses:
${agentInputs}

Synthesize these perspectives into a comprehensive, well-structured answer that:
1. Combines the best insights from each agent
2. Resolves any contradictions
3. Provides a clear, actionable response
4. Maintains accuracy and nuance

Your synthesized response:`,
      });

      let fullResponse = "";

      // Stream the final response
      for await (const chunk of textStream) {
        fullResponse += chunk;

        // Publish to main AI chunk topic for backward compatibility
        publish(
          researchChannel(sessionId)["ai-chunk"]({
            chunk,
            isComplete: false,
            timestamp: new Date().toISOString(),
          })
        ).catch((err) => console.error("Error publishing chunk:", err));

        // Also publish to agent-chunk for consistency
        publish(
          researchChannel(sessionId)["agent-chunk"]({
            agent: "synthesizer",
            chunk,
            isComplete: false,
            timestamp: new Date().toISOString(),
          })
        ).catch((err) => console.error("Error publishing agent chunk:", err));
      }

      // Signal completion
      await publish(
        researchChannel(sessionId)["ai-chunk"]({
          chunk: "",
          isComplete: true,
          timestamp: new Date().toISOString(),
        })
      );

      await publish(
        researchChannel(sessionId)["agent-chunk"]({
          agent: "synthesizer",
          chunk: "",
          isComplete: true,
          timestamp: new Date().toISOString(),
        })
      );

      return fullResponse;
    });

    const duration = Date.now() - startTime;

    await step.run("publish-synthesizer-complete", async () => {
      await publish(
        researchChannel(sessionId)["agent-update"]({
          agent: "synthesizer",
          status: "completed",
          message: `${modelInfo.synthesizer.name}: Final synthesis complete`,
          timestamp: new Date().toISOString(),
          duration,
        })
      );
    });

    return {
      agent: "synthesizer" as const,
      response: result,
      model: "gpt-4-turbo-preview",
      duration,
    };
  }
);
