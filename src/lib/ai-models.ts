import { openai } from "@ai-sdk/openai";
import { anthropic } from "@ai-sdk/anthropic";
import { google } from "@ai-sdk/google";
import { mistral } from "@ai-sdk/mistral";

/**
 * AI Model configurations for different agents
 * Each model is specialized for a specific task
 */
export const models = {
  // GPT-4: Deep analysis and detailed responses
  analyst: openai("gpt-4-turbo-preview", {
    structuredOutputs: false,
  }),

  // Claude: Summarization and concise explanations
  summarizer: anthropic("claude-3-5-sonnet-20241022"),

  // Gemini: Fact-checking and validation
  factChecker: google("gemini-1.5-pro"),

  // Mistral: Topic classification and categorization
  classifier: mistral("mistral-large-latest"),

  // GPT-4: Final synthesis combining all agent outputs
  synthesizer: openai("gpt-4-turbo-preview", {
    structuredOutputs: false,
  }),
};

/**
 * Model metadata for display purposes
 */
export const modelInfo = {
  analyst: {
    name: "GPT-4 Analyst",
    provider: "OpenAI",
    icon: "🔍",
    description: "Deep analysis and detailed insights",
    color: "blue",
  },
  summarizer: {
    name: "Claude Summarizer",
    provider: "Anthropic",
    icon: "📝",
    description: "Concise summaries and key points",
    color: "purple",
  },
  factChecker: {
    name: "Gemini Fact-Checker",
    provider: "Google",
    icon: "✓",
    description: "Validates claims and checks accuracy",
    color: "green",
  },
  classifier: {
    name: "Mistral Classifier",
    provider: "Mistral AI",
    icon: "🏷️",
    description: "Categorizes and classifies content",
    color: "orange",
  },
  synthesizer: {
    name: "GPT-4 Synthesizer",
    provider: "OpenAI",
    icon: "🧠",
    description: "Combines insights from all agents",
    color: "indigo",
  },
} as const;

export type AgentType = keyof typeof models;

