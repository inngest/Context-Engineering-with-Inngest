import { serve } from "inngest/next";
import { inngest } from "@/inngest/client";
import { gatherContextSimple } from "@/inngest/functions";

// Create the Inngest serve handler
// Simple example only - focused on observability and debugging
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    gatherContextSimple, // Simple, observable research agent
  ],
});
