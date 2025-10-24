import { XMLParser } from "fast-xml-parser";
import type { ArxivResult } from "@/inngest/types";

export async function fetchArxiv(query: string): Promise<ArxivResult[]> {
  try {
    // ArXiv allows 1 request per second
    const response = await fetch(
      `http://export.arxiv.org/api/query?search_query=all:${encodeURIComponent(query)}&max_results=5`
    );

    if (!response.ok) {
      console.error("ArXiv API error:", response.statusText);
      return [];
    }

    const xml = await response.text();
    return parseArxivXML(xml);
  } catch (error) {
    console.error("Error fetching from ArXiv:", error);
    return [];
  }
}

function parseArxivXML(xml: string): ArxivResult[] {
  try {
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: "@_",
    });

    const result = parser.parse(xml);
    const feed = result.feed;

    if (!feed || !feed.entry) {
      return [];
    }

    // Handle both single entry (object) and multiple entries (array)
    const entries = Array.isArray(feed.entry) ? feed.entry : [feed.entry];

    return entries.map((entry: any) => ({
      source: "arxiv" as const,
      title: entry.title?.replace(/\s+/g, " ").trim() || "Untitled",
      text: entry.summary?.replace(/\s+/g, " ").trim() || "",
      url: entry.id || "",
      published: entry.published || "",
      relevance: 0,
    }));
  } catch (error) {
    console.error("Error parsing ArXiv XML:", error);
    return [];
  }
}

