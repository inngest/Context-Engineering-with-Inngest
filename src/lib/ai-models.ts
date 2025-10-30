import { openai } from "@ai-sdk/openai";
import { anthropic } from "@ai-sdk/anthropic";
import { google } from "@ai-sdk/google";
import { mistral } from "@ai-sdk/mistral";
import { gateway } from "@ai-sdk/gateway";

/**
 * AI Model configurations for different agents
 * Each model is specialized for a specific task
 */
export const models = {
  // GPT-4: Deep analysis and detailed responses
  analyst: gateway("openai/gpt-4-turbo"),

  // Claude: Summarization and concise explanations
  summarizer: gateway("anthropic/claude-3.5-sonnet"),

  // Gemini: Fact-checking and validation
  factChecker: gateway("google/gemini-2.5-flash"),

  // Mistral: Topic classification and categorization
  classifier: gateway("mistral/mistral-large"),

  // GPT-4: Final synthesis combining all agent outputs
  synthesizer: gateway("openai/gpt-4-turbo"),
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
