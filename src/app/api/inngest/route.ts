import { serve } from "inngest/next";
import { inngest } from "@/inngest/client";
import {
  gatherContext,
  orchestrateMultiAgent,
  analystAgent,
  summarizerAgent,
  factCheckerAgent,
  classifierAgent,
  synthesizerAgent,
} from "@/inngest/functions";

// Create the Inngest serve handler
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    // Context gathering (used by orchestrator)
    gatherContext,
    // Multi-agent orchestration
    orchestrateMultiAgent,
    analystAgent,
    summarizerAgent,
    factCheckerAgent,
    classifierAgent,
    synthesizerAgent,
  ],
});

