import { Inngest, EventSchemas } from "inngest";
import { realtimeMiddleware } from "@inngest/realtime/middleware";
import type { ContextItem } from "./types";

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
  }>(),
});

