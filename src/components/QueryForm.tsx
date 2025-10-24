"use client";

import { useState } from "react";

interface QueryFormProps {
  onSubmit: (query: string) => void;
  loading: boolean;
}

export function QueryForm({ onSubmit, loading }: QueryFormProps) {
  const [query, setQuery] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSubmit(query);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="flex flex-col gap-4">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ask a research question... (e.g., 'What are the latest advances in transformer architectures?')"
          className="w-full p-4 rounded-lg bg-slate-800 text-white border border-slate-700 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 placeholder:text-slate-500"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || !query.trim()}
          className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg
                className="animate-spin h-5 w-5"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Researching...
            </span>
          ) : (
            "Search"
          )}
        </button>
      </div>
    </form>
  );
}

