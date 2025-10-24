// Type definitions for the research assistant

export interface ContextItem {
  source: string;
  text: string;
  title?: string;
  url?: string;
  relevance?: number;
}

export interface ArxivResult extends ContextItem {
  source: "arxiv";
  published: string;
}

export interface GithubResult extends ContextItem {
  source: "github";
}

export interface VectorDBResult extends ContextItem {
  source: "vectordb";
}

export interface WebSearchResult extends ContextItem {
  source: "websearch";
}

export interface LLMResponse {
  answer: string;
  model: string;
  tokensUsed?: number;
}

