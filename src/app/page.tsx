"use client";

import { useState } from "react";
import { QueryForm } from "@/components/QueryForm";
import { SimpleRealtimeStatus } from "@/components/SimpleRealtimeStatus";
import { submitResearchQuery } from "./actions";

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [currentQuery, setCurrentQuery] = useState<string>("");

  const handleSubmit = async (query: string) => {
    setLoading(true);
    setError(null);
    setSubmitted(false);

    const newSessionId = crypto.randomUUID();
    const userId = "demo-user";

    try {
      const result = await submitResearchQuery(query, newSessionId, userId);

      if (!result.success) {
        throw new Error(result.error || "Failed to submit query");
      }

      setSessionId(newSessionId);
      setCurrentQuery(query);
      setSubmitted(true);
    } catch (err) {
      console.error("Error submitting query:", err);
      setError(
        "Failed to submit query. Make sure the Inngest Dev Server is running."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 p-4 sm:p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            Simple Research Agent
          </h1>
          <p className="text-slate-400">
            Powered by Inngest • Observable, debuggable AI workflows
          </p>
          <p className="text-sm text-slate-500 mt-2">
            🎯 This is the <strong className="text-slate-400">simplified example</strong> - focused on observability & debugging
          </p>
          <div className="mt-3 p-3 bg-yellow-900/20 border border-yellow-900/50 rounded-lg">
            <p className="text-xs text-yellow-400">
              <strong>🎬 Demo Mode:</strong> First attempt artificially limited to show retry logic in action!
            </p>
          </div>
        </div>

        {/* Query Form */}
        <div className="mb-8">
          <QueryForm onSubmit={handleSubmit} loading={loading} />
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-8 p-4 bg-red-900/20 border border-red-900 rounded-lg">
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {/* Real-time Status */}
        {submitted && sessionId && currentQuery && (
          <div className="mb-8">
            <SimpleRealtimeStatus sessionId={sessionId} query={currentQuery} />
          </div>
        )}

        {/* Success Message - Instructions */}
        {submitted && (
          <div className="mb-8 p-6 bg-green-900/20 border border-green-900 rounded-lg">
            <div className="flex items-start gap-3">
              <svg
                className="w-6 h-6 text-green-400 flex-shrink-0 mt-0.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-green-400 mb-2">
                  Query Submitted! 🎉
                </h3>
                <p className="text-green-300 mb-3">
                  Watch the <strong>observable workflow</strong> execute in real-time.
                </p>
                <div className="bg-slate-800 rounded-lg p-4 mb-3">
                  <p className="text-sm text-slate-300 mb-2 font-semibold">
                    🐛 Debug in Inngest Dashboard:
                  </p>
                  <ol className="text-sm text-slate-400 space-y-1 list-decimal list-inside">
                    <li>
                      Open{" "}
                      <a
                        href="http://localhost:8288"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-indigo-400 hover:text-indigo-300 underline font-semibold"
                      >
                        http://localhost:8288
                      </a>
                    </li>
                    <li>Click the &quot;Runs&quot; tab</li>
                    <li>
                      Find: <code className="text-indigo-400 bg-slate-900 px-1 py-0.5 rounded">Simple Research Agent</code>
                    </li>
                    <li>Click through each step to see timing, input, output</li>
                  </ol>
                </div>
                <div className="text-sm text-slate-400">
                  <p className="font-semibold mb-1">Observable steps you&apos;ll see:</p>
                  <ul className="space-y-1 ml-4">
                    <li>✓ <code className="text-indigo-400">search-arxiv</code> - Papers found & timing</li>
                    <li>✗ <code className="text-yellow-400">check-context-quality</code> - <strong>FAILS</strong> (1/3 papers - attempt 0)</li>
                    <li>🔄 <strong className="text-yellow-400">Automatic retry triggered</strong></li>
                    <li>✓ <code className="text-indigo-400">search-arxiv</code> - More papers found (attempt 1)</li>
                    <li>✓ <code className="text-green-400">check-context-quality</code> - <strong>PASSES</strong> (3+ papers)</li>
                    <li>✓ <code className="text-indigo-400">generate-llm-response</code> - Token usage</li>
                  </ul>
                  <p className="mt-3 p-2 bg-slate-900 rounded text-slate-500 text-xs">
                    <strong>🎬 Demo:</strong> First attempt artificially returns only 1 paper to demonstrate retry logic. 
                    Retry gets full results. Max 2 attempts prevents infinite loops!
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Getting Started Section */}
        {!loading && !submitted && (
          <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
            <h2 className="text-xl font-bold text-white mb-4">
              Getting Started
            </h2>
            <div className="space-y-4 text-slate-300">
              <div>
                <h3 className="font-semibold text-white mb-2">
                  1. Set up environment variables
                </h3>
                <p className="text-sm text-slate-400">
                  Add <code className="text-indigo-400 bg-slate-900 px-1 py-0.5 rounded">OPENAI_API_KEY</code> to{" "}
                  <code className="text-indigo-400 bg-slate-900 px-1 py-0.5 rounded">.env.local</code>
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-white mb-2">
                  2. Start the Inngest Dev Server
                </h3>
                <p className="text-sm text-slate-400 mb-1">
                  Run in a separate terminal:
                </p>
                <code className="block bg-slate-900 p-2 rounded text-sm text-indigo-400">
                  npx inngest-cli@latest dev
                </code>
              </div>
              <div>
                <h3 className="font-semibold text-white mb-2">
                  3. Try these queries
                </h3>
                <div className="text-sm text-slate-400 space-y-2">
                  <div>
                    <span className="text-green-400 font-semibold">✓ Try any valid query:</span>
                    <ul className="list-disc list-inside ml-4 mt-1">
                      <li>&quot;transformer architecture&quot;</li>
                      <li>&quot;machine learning&quot;</li>
                      <li>&quot;neural networks&quot;</li>
                    </ul>
                  </div>
                  <div className="mt-2 p-2 bg-yellow-900/20 rounded border border-yellow-900/50">
                    <p className="text-xs text-yellow-400">
                      <strong>🎬 Demo Mode:</strong> All queries will show retry logic on first attempt!
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
