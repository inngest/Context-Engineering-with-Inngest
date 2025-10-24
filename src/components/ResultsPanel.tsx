"use client";

import type { ContextItem } from "@/inngest/types";

interface ResultsPanelProps {
  answer: string;
  contexts: ContextItem[];
  tokensUsed?: number;
  model?: string;
}

export function ResultsPanel({
  answer,
  contexts,
  tokensUsed,
  model,
}: ResultsPanelProps) {
  return (
    <div className="space-y-6">
      {/* Answer Section */}
      <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <svg
            className="w-6 h-6 text-indigo-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          Answer
        </h2>
        <p className="text-slate-200 whitespace-pre-wrap leading-relaxed">
          {answer}
        </p>
        {(tokensUsed || model) && (
          <div className="mt-4 pt-4 border-t border-slate-700 flex gap-4 text-sm text-slate-400">
            {model && <span>Model: {model}</span>}
            {tokensUsed && <span>Tokens: {tokensUsed}</span>}
          </div>
        )}
      </div>

      {/* Context Sources Section */}
      {contexts && contexts.length > 0 && (
        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <svg
              className="w-6 h-6 text-indigo-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
              />
            </svg>
            Sources ({contexts.length})
          </h2>
          <div className="space-y-3">
            {contexts.map((context, i) => (
              <div
                key={i}
                className="p-4 bg-slate-900 rounded-lg border border-slate-700"
              >
                <div className="flex items-start justify-between gap-4 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center justify-center w-6 h-6 text-xs font-bold text-white bg-indigo-600 rounded-full">
                      {i + 1}
                    </span>
                    <span className="font-medium text-indigo-400 capitalize">
                      {context.source}
                    </span>
                  </div>
                  {context.relevance !== undefined && (
                    <span className="text-xs text-slate-500">
                      Relevance: {(context.relevance * 100).toFixed(1)}%
                    </span>
                  )}
                </div>
                {context.title && (
                  <h3 className="text-sm font-semibold text-slate-300 mb-1">
                    {context.title}
                  </h3>
                )}
                <p className="text-sm text-slate-400 line-clamp-3">
                  {context.text}
                </p>
                {context.url && (
                  <a
                    href={context.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-indigo-400 hover:text-indigo-300 mt-2 inline-block"
                  >
                    View source →
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

