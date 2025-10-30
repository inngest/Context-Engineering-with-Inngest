"use client";

import { useState, useEffect } from "react";
import { useInngestSubscription } from "@inngest/realtime/hooks";
import { getResearchSubscriptionToken } from "@/app/actions";

interface Props {
  sessionId: string;
  query: string;
}

interface ProgressUpdate {
  step: string;
  status: string;
  message: string;
  data?: any;
  attempt?: number;
}

interface ResultUpdate {
  answer: string;
  contextsUsed: number;
  attempts: number;
  tokensUsed?: number;
  quality: string;
}

export function SimpleRealtimeStatus({ sessionId, query }: Props) {
  const [latestProgress, setLatestProgress] = useState<ProgressUpdate | null>(null);
  const [finalResult, setFinalResult] = useState<ResultUpdate | null>(null);

  // Subscribe to real-time updates
  const { data: updates } = useInngestSubscription({
    refreshToken: () => getResearchSubscriptionToken(sessionId),
  });

  // Update state when new data arrives
  useEffect(() => {
    if (!updates || updates.length === 0) return;

    // Get the most recent update
    const latestUpdate = updates[updates.length - 1];
    
    if (latestUpdate.topic === "progress") {
      setLatestProgress(latestUpdate.data);
    } else if (latestUpdate.topic === "result") {
      setFinalResult(latestUpdate.data);
    }
  }, [updates]);

  return (
    <div className="space-y-4">
      {/* Real-time Progress */}
      <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-500"></span>
          </span>
          Live Workflow Status
        </h3>
        
        <div className="space-y-2 text-sm">
          <p className="text-slate-400">
            <strong className="text-white">Query:</strong> {query}
          </p>
          
          {latestProgress && (
            <div className="mt-4 p-3 bg-slate-900 rounded border-l-4 border-indigo-500">
              <div className="flex items-start gap-2">
                {latestProgress.status === "running" && (
                  <svg className="animate-spin h-4 w-4 text-indigo-400 mt-0.5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                )}
                {latestProgress.status === "completed" && (
                  <svg className="h-4 w-4 text-green-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                )}
                {latestProgress.status === "failed" && (
                  <svg className="h-4 w-4 text-red-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                )}
                {latestProgress.status === "retrying" && (
                  <svg className="h-4 w-4 text-yellow-400 mt-0.5 animate-spin" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                  </svg>
                )}
                {latestProgress.status === "starting" && (
                  <svg className="h-4 w-4 text-blue-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                  </svg>
                )}
                <div className="flex-1">
                  <p className="text-white font-medium">
                    {latestProgress.step || "Processing"}
                  </p>
                  <p className="text-slate-400 text-xs mt-1">
                    {latestProgress.message}
                  </p>
                  {latestProgress.data && (
                    <p className="text-slate-500 text-xs mt-1 font-mono">
                      {JSON.stringify(latestProgress.data)}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Final Result */}
      {finalResult && (
        <div className="bg-slate-800 rounded-lg p-6 border border-green-900">
          <h3 className="text-lg font-semibold text-green-400 mb-3 flex items-center gap-2">
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Research Complete!
          </h3>
          <p className="text-slate-200 whitespace-pre-wrap leading-relaxed mb-4">
            {finalResult.answer}
          </p>
          <div className="flex gap-4 text-xs text-slate-400 pt-3 border-t border-slate-700">
            <span>Papers used: {finalResult.contextsUsed}</span>
            <span>Attempts: {finalResult.attempts}</span>
            {finalResult.tokensUsed && <span>Tokens: {finalResult.tokensUsed}</span>}
            <span className="text-green-400">Quality: {finalResult.quality}</span>
          </div>
        </div>
      )}
    </div>
  );
}

