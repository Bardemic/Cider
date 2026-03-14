"use client";

import { useEffect, useRef } from "react";
import type { ToolCall } from "@/lib/types";

interface Props {
  toolCalls: ToolCall[];
}

const TOOL_ICONS: Record<string, string> = {
  create_file: "📝",
  read_file: "📖",
  list_files: "📂",
  execute_command: "⚡",
  get_screenshot: "📸",
  get_sandbox_status: "🔍",
  create_xcode_project: "🏗️",
};

export default function AgentActivity({ toolCalls }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [toolCalls]);

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-2 border-b border-cider-border flex items-center justify-between">
        <h2 className="text-sm font-semibold text-cider-text-dim">Agent Activity</h2>
        {toolCalls.length > 0 && (
          <span className="text-[11px] text-cider-text-dim">
            {toolCalls.length} tool calls
          </span>
        )}
      </div>

      <div ref={containerRef} className="flex-1 overflow-y-auto p-3 space-y-2">
        {toolCalls.length === 0 ? (
          <p className="text-xs text-cider-text-dim/50 text-center py-8">
            Tool calls will appear here...
          </p>
        ) : (
          toolCalls.map((tc) => (
            <div
              key={tc.id}
              className="fade-in rounded-lg px-3 py-2 bg-cider-surface border border-cider-border"
            >
              <div className="flex items-center gap-2 mb-1">
                <span>{TOOL_ICONS[tc.name] || "🔧"}</span>
                <span className="text-xs font-medium text-cider-text">{tc.name}</span>
                <span
                  className={`ml-auto text-[10px] px-1.5 py-0.5 rounded ${
                    tc.status === "success"
                      ? "bg-cider-green/10 text-cider-green"
                      : tc.status === "error"
                      ? "bg-cider-red/10 text-cider-red"
                      : tc.status === "running"
                      ? "bg-cider-accent/10 text-cider-accent"
                      : "bg-cider-border text-cider-text-dim"
                  }`}
                >
                  {tc.status}
                </span>
              </div>
              <div className="text-[11px] text-cider-text-dim truncate">
                {tc.name === "create_file" && (tc.args as { path?: string }).path}
                {tc.name === "read_file" && (tc.args as { path?: string }).path}
                {tc.name === "execute_command" && (
                  <span className="font-mono">
                    $ {((tc.args as { command?: string }).command || "").slice(0, 80)}
                  </span>
                )}
                {tc.name === "create_xcode_project" && (tc.args as { name?: string }).name}
                {tc.name === "list_files" && ((tc.args as { path?: string }).path || ".")}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
