"use client";

import { modelInfo, type AgentType } from "@/lib/ai-models";

interface AgentCardProps {
  agent: AgentType;
  status: "idle" | "starting" | "running" | "completed" | "failed" | "retrying";
  message?: string;
  duration?: number;
  response?: string;
  retryCount?: number;
}

export function AgentCard({ agent, status, message, duration, response, retryCount }: AgentCardProps) {
  const info = modelInfo[agent];

  const getStatusColor = () => {
    switch (status) {
      case "idle":
        return "bg-slate-800 border-slate-700";
      case "starting":
        return "bg-blue-900/20 border-blue-900";
      case "running":
        return "bg-yellow-900/20 border-yellow-900";
      case "completed":
        return "bg-green-900/20 border-green-900";
      case "failed":
        return "bg-red-900/20 border-red-900";
      case "retrying":
        return "bg-orange-900/20 border-orange-900 animate-pulse";
      default:
        return "bg-slate-800 border-slate-700";
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case "idle":
        return "⏸️";
      case "starting":
        return "⏳";
      case "running":
        return "🔄";
      case "completed":
        return "✅";
      case "failed":
        return "❌";
      case "retrying":
        return "🔄";
      default:
        return "⏸️";
    }
  };

  const getStatusText = () => {
    switch (status) {
      case "idle":
        return "Waiting...";
      case "starting":
        return "Starting...";
      case "running":
        return "Processing...";
      case "completed":
        return "Complete";
      case "failed":
        return "Failed";
      case "retrying":
        return `Retrying (${retryCount})...`;
      default:
        return "Unknown";
    }
  };

  return (
    <div className={`p-4 rounded-lg border ${getStatusColor()} transition-all duration-300`}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-3">
        <span className="text-2xl">{info.icon}</span>
        <div className="flex-1">
          <h4 className="font-semibold text-white">{info.name}</h4>
          <p className="text-xs text-slate-400">{info.provider}</p>
        </div>
        <span className={`text-xl ${status === "running" ? "animate-spin" : ""}`}>
          {getStatusIcon()}
        </span>
      </div>

      {/* Description */}
      <p className="text-xs text-slate-400 mb-2">{info.description}</p>

      {/* Status */}
      <div className="flex items-center justify-between text-sm">
        <span className={`font-medium ${
          status === "completed" ? "text-green-400" :
          status === "failed" ? "text-red-400" :
          status === "running" || status === "starting" ? "text-yellow-400" :
          status === "retrying" ? "text-orange-400" :
          "text-slate-400"
        }`}>
          {getStatusText()}
        </span>
        {duration && (
          <span className="text-xs text-slate-500">
            {(duration / 1000).toFixed(1)}s
          </span>
        )}
      </div>

      {/* Message */}
      {message && (
        <p className="text-xs text-slate-400 mt-2 italic">
          {message}
        </p>
      )}

      {/* Response Preview (if completed) */}
      {status === "completed" && response && (
        <div className="mt-3 p-2 bg-slate-900/50 rounded text-xs text-slate-300 max-h-20 overflow-hidden">
          {response.substring(0, 150)}...
        </div>
      )}
    </div>
  );
}

