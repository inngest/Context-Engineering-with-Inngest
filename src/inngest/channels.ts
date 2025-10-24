import { channel, topic } from "@inngest/realtime";
import type { ContextItem } from "./types";

/**
 * Research session channel - tracks progress for a specific research query
 * Scoped by sessionId to isolate updates per query
 */


export const researchChannel = channel((sessionId: string) => `research-session-${sessionId}`)
    // Step-by-step progress updates
    .addTopic(
      topic("progress").type<{
        step: string;
        status: "starting" | "in_progress" | "completed" | "failed";
        message: string;
        timestamp: string;
        metadata?: Record<string, string | number | boolean>;
      }>()
    )
    // Source-by-source results as they come in
    .addTopic(
      topic("source-result").type<{
        source: string;
        success: boolean;
        count?: number;
        error?: string;
        timestamp: string;
      }>()
    )
    // Context items found and ranked
    .addTopic(
      topic("contexts").type<{
        totalFound: number;
        topContexts: ContextItem[];
        timestamp: string;
      }>()
    )
    // Streaming AI response chunks
    .addTopic(
      topic("ai-chunk").type<{
        chunk: string;
        isComplete: boolean;
        timestamp: string;
      }>()
    )
    // Final result
    .addTopic(
      topic("result").type<{
        answer: string;
        model: string;
        tokensUsed?: number;
        contextsUsed: number;
        timestamp: string;
      }>()
    )
    // Execution metadata (rate limiting, concurrency, etc.)
    .addTopic(
      topic("metadata").type<{
        type: "rate_limit" | "concurrency" | "throttle" | "retry" | "info";
        message: string;
        details?: Record<string, string | number | boolean>;
        timestamp: string;
      }>()
    )
    // Error notifications
    .addTopic(
      topic("error").type<{
        step: string;
        error: string;
        recoverable: boolean;
        timestamp: string;
      }>()
    )
    // Agent status updates (for multi-agent orchestration)
    .addTopic(
      topic("agent-update").type<{
        agent: "analyst" | "summarizer" | "factChecker" | "classifier" | "synthesizer";
        status: "starting" | "running" | "completed" | "failed" | "retrying";
        message: string;
        timestamp: string;
        duration?: number;
        retryCount?: number;
      }>()
    )
    // Agent response chunks (streaming from individual agents)
    .addTopic(
      topic("agent-chunk").type<{
        agent: "analyst" | "summarizer" | "factChecker" | "classifier" | "synthesizer";
        chunk: string;
        isComplete: boolean;
        timestamp: string;
      }>()
    )
    // Agent final responses
    .addTopic(
      topic("agent-result").type<{
        agent: "analyst" | "summarizer" | "factChecker" | "classifier";
        response: string;
        model: string;
        timestamp: string;
      }>()
    );


