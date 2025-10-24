"use server";

import { inngest } from "@/inngest/client";
import { researchChannel } from "@/inngest/channels";
import { getSubscriptionToken } from "@inngest/realtime";

export async function submitResearchQuery(
  query: string,
  sessionId: string,
  userId: string
) {
  try {
    // Send event directly to Inngest from server action
    await inngest.send({
      name: "research/query.submitted",
      data: {
        query,
        sessionId,
        userId,
      },
    });

    return { success: true, sessionId };
  } catch (error) {
    console.error("Error submitting query:", error);
    return { success: false, error: "Failed to submit query" };
  }
}

export async function getResearchSubscriptionToken(sessionId: string) {
  try {
    const token = await getSubscriptionToken(inngest, {
      channel: researchChannel(sessionId),
      topics: [
        "progress",
        "source-result",
        "contexts",
        "ai-chunk",
        "result",
        "metadata",
        "error",
        "agent-update",
        "agent-chunk",
        "agent-result",
      ],
    });
    return token;
  } catch (error) {
    console.error("Error getting subscription token:", error);
    throw new Error("Failed to get subscription token");
  }
}

