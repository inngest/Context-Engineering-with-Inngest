import { Inngest, EventSchemas } from "inngest";
import { realtimeMiddleware } from "@inngest/realtime/middleware";
import type { ContextItem } from "./types";
import type { AgentResult } from "./channels";

interface AgentEventData {
  query: string;
  contexts: (ContextItem | null)[];
  sessionId: string;
  userId: string;
}

export const inngest = new Inngest({
  id: "context-engineering-demo",
  middleware: [realtimeMiddleware()],
  schemas: new EventSchemas().fromRecord<{
    "research/query.submitted": {
      data: {
        query: string;
        userId: string;
        sessionId: string;
      };
    };
    "context/llm.invoke": {
      data: {
        query: string;
        contexts: ContextItem[];
        userId: string;
        sessionId: string;
      };
    };
    "agent/analyze": { data: AgentEventData };
    "agent/classify": { data: AgentEventData };
    "agent/summarize": { data: AgentEventData };
    "agent/fact-check": { data: AgentEventData };
    "agent/synthesize": {
      data: {
        query: string;
        agentResults: AgentResult[];
        sessionId: string;
        userId: string;
      };
    };
  }>(),
});
