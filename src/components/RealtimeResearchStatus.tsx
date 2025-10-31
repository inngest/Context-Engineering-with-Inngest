"use client";

import { useInngestSubscription } from "@inngest/realtime/hooks";
import { getResearchSubscriptionToken } from "@/app/actions";
import { useState, useEffect, useRef } from "react";
import { AgentCard } from "./AgentCard";
import type { AgentType } from "@/lib/ai-models";
import type {
  FinalResult,
  MetadataUpdate,
  ProgressUpdate,
  SourceResult,
} from "@/inngest/channels";

interface RealtimeResearchStatusProps {
  sessionId: string;
  query: string;
}

export function RealtimeResearchStatus({
  sessionId,
  query,
}: RealtimeResearchStatusProps) {
  const { freshData, error, state } = useInngestSubscription({
    refreshToken: () => getResearchSubscriptionToken(sessionId),
  });
  const sourcesSectionRef = useRef<HTMLDivElement>(null);
  const agentsSectionRef = useRef<HTMLDivElement>(null);
  const scrollStatuses = useRef({
    sources: false,
    agents: false,
    synthesis: false,
  });

  const [progressSteps, setProgressSteps] = useState<ProgressUpdate[]>([]);
  const [sourceResults, setSourceResults] = useState<SourceResult[]>([]);
  const [aiResponse, setAiResponse] = useState<string>("");
  const [isAiComplete, setIsAiComplete] = useState(false);
  const [metadata, setMetadata] = useState<MetadataUpdate[]>([]);
  const [finalResult, setFinalResult] = useState<FinalResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Agent state
  const [agentStates, setAgentStates] = useState<
    Record<
      AgentType,
      {
        status:
          | "idle"
          | "starting"
          | "running"
          | "completed"
          | "failed"
          | "retrying";
        message?: string;
        duration?: number;
        response?: string;
        retryCount?: number;
      }
    >
  >({
    analyst: { status: "idle" },
    summarizer: { status: "idle" },
    factChecker: { status: "idle" },
    classifier: { status: "idle" },
    synthesizer: { status: "idle" },
  });
  const [agentResponses, setAgentResponses] = useState<
    Record<AgentType, string>
  >({
    analyst: "",
    summarizer: "",
    factChecker: "",
    classifier: "",
    synthesizer: "",
  });

  useEffect(() => {
    if (!freshData || freshData.length === 0) return;

    // Process only fresh (new) data updates - prevents re-processing all historical data
    freshData.forEach((update) => {
      switch (update.topic) {
        case "progress":
          setProgressSteps((prev) => {
            const progressData = update.data as ProgressUpdate;
            const exists = prev.find((p) => p.step === progressData.step);
            if (exists) {
              return prev.map((p) =>
                p.step === progressData.step ? progressData : p
              );
            }
            return [...prev, progressData];
          });
          break;

        case "source-result":
          setSourceResults((prev) => {
            const sourceData = update.data as SourceResult;
            const exists = prev.find((s) => s.source === sourceData.source);
            if (!exists) {
              return [...prev, sourceData];
            }
            return prev;
          });
          break;

        case "ai-chunk": {
          const chunkData = update.data as {
            chunk: string;
            isComplete: boolean;
            timestamp: string;
          };
          if (chunkData.isComplete) {
            setIsAiComplete(true);
          } else {
            setAiResponse((prev) => prev + chunkData.chunk);
          }
          break;
        }

        case "result":
          setFinalResult(update.data);
          break;

        case "metadata":
          setMetadata((prev) => [...prev, update.data]);
          break;

        case "error": {
          const errorData = update.data as {
            error: string;
            recoverable: boolean;
            timestamp: string;
          };
          setErrorMessage(errorData.error);
          break;
        }

        case "agent-update": {
          const agentData = update.data;
          setAgentStates((prev) => ({
            ...prev,
            [agentData.agent]: {
              status: agentData.status,
              message: agentData.message,
              duration: agentData.duration,
              retryCount: agentData.retryCount,
              response: prev[agentData.agent].response,
            },
          }));
          break;
        }

        case "agent-chunk": {
          const chunkData = update.data as {
            agent: AgentType;
            chunk: string;
            isComplete: boolean;
            timestamp: string;
          };
          if (!chunkData.isComplete) {
            setAgentResponses((prev) => ({
              ...prev,
              [chunkData.agent]: prev[chunkData.agent] + chunkData.chunk,
            }));
          }
          break;
        }

        case "agent-result": {
          const resultData = update.data;
          setAgentStates((prev) => ({
            ...prev,
            [resultData.agent]: {
              ...prev[resultData.agent],
              response: resultData.response,
            },
          }));
          break;
        }
      }
    });
  }, [freshData]);

  // auto scrolls
  useEffect(() => {
    if (isAiComplete) {
      window.scrollTo({
        top: document.body.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [isAiComplete]);

  useEffect(() => {
    if (
      Object.values(agentStates).some((a) => a.status !== "idle") &&
      !scrollStatuses.current.agents
    ) {
      window.scrollTo({
        top: agentsSectionRef.current?.offsetTop ?? 0,
        behavior: "smooth",
      });
      scrollStatuses.current.agents = true;
    }
  }, [agentStates, scrollStatuses]);

  useEffect(() => {
    if (sourceResults.length > 0 && !scrollStatuses.current.sources) {
      window.scrollTo({
        top: sourcesSectionRef.current?.offsetTop ?? 0,
        behavior: "smooth",
      });
      scrollStatuses.current.sources = true;
    }
  }, [sourceResults, scrollStatuses]);

  const getStepIcon = (status: string) => {
    switch (status) {
      case "starting":
        return "⏳";
      case "in_progress":
        return "🔄";
      case "completed":
        return "✅";
      case "failed":
        return "❌";
      default:
        return "⏸️";
    }
  };

  const getStepColor = (status: string) => {
    switch (status) {
      case "starting":
        return "text-blue-400";
      case "in_progress":
        return "text-yellow-400 animate-pulse";
      case "completed":
        return "text-green-400";
      case "failed":
        return "text-red-400";
      default:
        return "text-slate-400";
    }
  };

  if (error) {
    return (
      <div className="bg-red-900/20 border border-red-900 rounded-lg p-6">
        <h3 className="text-red-400 font-semibold mb-2">Connection Error</h3>
        <p className="text-red-300 text-sm">{error.message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      <div className="flex items-center gap-2">
        <div
          className={`w-2 h-2 rounded-full ${
            String(state) === "active"
              ? "bg-green-400 animate-pulse"
              : String(state) === "connecting"
              ? "bg-yellow-400 animate-pulse"
              : "bg-red-400"
          }`}
        />
        <span className="text-sm text-slate-400">
          {String(state) === "active" && "Live updates active"}
          {String(state) === "connecting" && "Connecting to Inngest..."}
          {String(state) !== "active" &&
            String(state) !== "connecting" &&
            "Disconnected"}
        </span>
      </div>

      {/* Query Info */}
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-slate-300 mb-2">
          Research Query
        </h3>
        <p className="text-white">{query}</p>
        <p className="text-xs text-slate-500 mt-2">
          Session: {sessionId.substring(0, 8)}...
        </p>
      </div>

      {/* Progress Steps */}
      {progressSteps.length > 0 && (
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-slate-300 mb-3">
            Processing Steps
          </h3>
          <div className="space-y-2">
            {progressSteps.map((step) => (
              <div
                key={step.step}
                className="flex items-start gap-3 p-2 rounded bg-slate-900/50"
              >
                <span className="text-lg">{getStepIcon(step.status)}</span>
                <div className="flex-1">
                  <div className={`font-medium ${getStepColor(step.status)}`}>
                    {step.message}
                  </div>
                  {step.metadata && (
                    <div className="text-xs text-slate-500 mt-1">
                      {Object.entries(step.metadata).map(([key, value]) => (
                        <span key={key} className="mr-3">
                          {key}: {JSON.stringify(value)}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Source Results */}
      {sourceResults.length > 0 && (
        <div
          className="bg-slate-800 border border-slate-700 rounded-lg p-4"
          ref={sourcesSectionRef}
        >
          <h3 className="text-sm font-semibold text-slate-300 mb-3">
            Data Sources ({sourceResults.length}/4)
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {sourceResults.map((source) => (
              <div
                key={source.source}
                className={`p-3 rounded-lg ${
                  source.success
                    ? "bg-green-900/20 border border-green-900"
                    : "bg-red-900/20 border border-red-900"
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">
                    {source.success ? "✅" : "❌"}
                  </span>
                  <span
                    className={`font-medium ${
                      source.success ? "text-green-400" : "text-red-400"
                    }`}
                  >
                    {source.source}
                  </span>
                </div>
                {source.success && source.count !== undefined && (
                  <p className="text-sm text-slate-400">
                    {source.count} results found
                  </p>
                )}
                {!source.success && source.error && (
                  <p className="text-xs text-red-300">{source.error}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Multi-Agent Orchestration */}
      {(agentStates.analyst.status !== "idle" ||
        agentStates.summarizer.status !== "idle" ||
        agentStates.factChecker.status !== "idle" ||
        agentStates.classifier.status !== "idle") && (
        <div
          className="bg-slate-800 border border-slate-700 rounded-lg p-4"
          ref={agentsSectionRef}
        >
          <h3 className="text-sm font-semibold text-slate-300 mb-3">
            Multi-Agent Analysis (Parallel Execution)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
            <AgentCard
              agent="analyst"
              status={agentStates.analyst.status}
              message={agentStates.analyst.message}
              duration={agentStates.analyst.duration}
              response={agentResponses.analyst || agentStates.analyst.response}
              retryCount={agentStates.analyst.retryCount}
            />
            <AgentCard
              agent="summarizer"
              status={agentStates.summarizer.status}
              message={agentStates.summarizer.message}
              duration={agentStates.summarizer.duration}
              response={
                agentResponses.summarizer || agentStates.summarizer.response
              }
              retryCount={agentStates.summarizer.retryCount}
            />
            <AgentCard
              agent="factChecker"
              status={agentStates.factChecker.status}
              message={agentStates.factChecker.message}
              duration={agentStates.factChecker.duration}
              response={
                agentResponses.factChecker || agentStates.factChecker.response
              }
              retryCount={agentStates.factChecker.retryCount}
            />
            <AgentCard
              agent="classifier"
              status={agentStates.classifier.status}
              message={agentStates.classifier.message}
              duration={agentStates.classifier.duration}
              response={
                agentResponses.classifier || agentStates.classifier.response
              }
              retryCount={agentStates.classifier.retryCount}
            />
          </div>

          {/* Synthesizer (Separate, runs after others) */}
          {agentStates.synthesizer.status !== "idle" && (
            <div>
              <h4 className="text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wide">
                Final Synthesis
              </h4>
              <AgentCard
                agent="synthesizer"
                status={agentStates.synthesizer.status}
                message={agentStates.synthesizer.message}
                duration={agentStates.synthesizer.duration}
                response={
                  agentResponses.synthesizer || agentStates.synthesizer.response
                }
                retryCount={agentStates.synthesizer.retryCount}
              />
            </div>
          )}
        </div>
      )}

      {/* Execution Metadata */}
      {metadata.length > 0 && (
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-slate-300 mb-3">
            Execution Details
          </h3>
          <div className="space-y-2">
            {metadata.map((meta, idx) => (
              <div key={idx} className="flex items-start gap-2 text-sm">
                <span className="text-indigo-400">
                  {meta.type === "concurrency" && "⚡"}
                  {meta.type === "throttle" && "🔒"}
                  {meta.type === "rate_limit" && "⏱️"}
                  {meta.type === "retry" && "🔄"}
                  {meta.type === "info" && "ℹ️"}
                </span>
                <div className="flex-1">
                  <p className="text-slate-300">{meta.message}</p>
                  {meta.details && (
                    <p className="text-xs text-slate-500 mt-1">
                      {Object.entries(meta.details)
                        .map(([k, v]) => `${k}: ${v}`)
                        .join(" • ")}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI Response Stream */}
      {aiResponse && (
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-slate-300">
              AI Response
            </h3>
            {!isAiComplete && (
              <span className="text-xs text-yellow-400 animate-pulse">
                Streaming...
              </span>
            )}
            {isAiComplete && (
              <span className="text-xs text-green-400">Complete</span>
            )}
          </div>
          <div className="prose prose-invert prose-sm max-w-none">
            <p className="text-slate-100 whitespace-pre-wrap leading-relaxed">
              {aiResponse}
              {!isAiComplete && (
                <span className="inline-block w-2 h-4 bg-indigo-400 ml-1 animate-pulse" />
              )}
            </p>
          </div>
        </div>
      )}

      {/* Final Result */}
      {finalResult && (
        <div className="bg-gradient-to-br from-green-900/20 to-emerald-900/20 border border-green-900 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-2xl">🎉</span>
            <h3 className="text-lg font-semibold text-green-400">
              Research Complete!
            </h3>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-400">Model:</span>
              <span className="text-slate-200">{finalResult.model}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Contexts Used:</span>
              <span className="text-slate-200">{finalResult.contextsUsed}</span>
            </div>
            {finalResult.tokensUsed && (
              <div className="flex justify-between">
                <span className="text-slate-400">Tokens Used:</span>
                <span className="text-slate-200">{finalResult.tokensUsed}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Error Message */}
      {errorMessage && (
        <div className="bg-red-900/20 border border-red-900 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <span className="text-xl">⚠️</span>
            <div>
              <h3 className="text-red-400 font-semibold mb-1">Error</h3>
              <p className="text-red-300 text-sm">{errorMessage}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
