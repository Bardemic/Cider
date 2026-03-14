"use client";

import { useState, useCallback } from "react";
import Header from "@/components/Header";
import ConnectionStatus from "@/components/ConnectionStatus";
import ChatInterface from "@/components/ChatInterface";
import BuildLog from "@/components/BuildLog";
import ScreenshotPanel from "@/components/ScreenshotPanel";
import AgentActivity from "@/components/AgentActivity";
import type { ToolCall } from "@/lib/types";

export default function Home() {
  const [toolCalls, setToolCalls] = useState<ToolCall[]>([]);
  const [buildLines, setBuildLines] = useState<string[]>([]);

  const handleToolCall = useCallback((tc: ToolCall) => {
    setToolCalls((prev) => {
      const idx = prev.findIndex((t) => t.id === tc.id);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = tc;
        return updated;
      }
      return [...prev, tc];
    });
  }, []);

  const handleBuildOutput = useCallback((output: string) => {
    const lines = output.split("\n").filter((l) => l.trim());
    setBuildLines((prev) => [...prev, ...lines]);
  }, []);

  return (
    <div className="flex flex-col h-screen">
      <Header />

      <div className="px-4 py-3">
        <ConnectionStatus />
      </div>

      <div className="flex-1 grid grid-cols-2 grid-rows-2 gap-3 px-4 pb-4 min-h-0">
        {/* Top-left: Chat */}
        <div className="rounded-xl border border-cider-border bg-cider-surface overflow-hidden">
          <ChatInterface onToolCall={handleToolCall} onBuildOutput={handleBuildOutput} />
        </div>

        {/* Top-right: Build Log */}
        <div className="rounded-xl border border-cider-border bg-cider-surface overflow-hidden">
          <BuildLog lines={buildLines} />
        </div>

        {/* Bottom-left: Agent Activity */}
        <div className="rounded-xl border border-cider-border bg-cider-surface overflow-hidden">
          <AgentActivity toolCalls={toolCalls} />
        </div>

        {/* Bottom-right: Screenshot */}
        <div className="rounded-xl border border-cider-border bg-cider-surface overflow-hidden">
          <ScreenshotPanel />
        </div>
      </div>
    </div>
  );
}
