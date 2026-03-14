"use client";

import { useEffect, useState } from "react";
import type { SandboxStatus } from "@/lib/types";

export default function ConnectionStatus() {
  const [status, setStatus] = useState<SandboxStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);

  const checkStatus = async () => {
    try {
      const res = await fetch("/api/sandbox?endpoint=/status");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setStatus(data);
      setError(null);
    } catch (err) {
      setStatus(null);
      setError(err instanceof Error ? err.message : "Connection failed");
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    checkStatus();
    const interval = setInterval(checkStatus, 10000);
    return () => clearInterval(interval);
  }, []);

  const connected = status !== null;

  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-cider-surface border border-cider-border">
      <div className="relative">
        <div
          className={`w-3 h-3 rounded-full ${
            connected ? "bg-cider-green pulse-green" : "bg-cider-red"
          }`}
        />
        {connected && (
          <div className="absolute inset-0 w-3 h-3 rounded-full bg-cider-green opacity-30 animate-ping" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        {checking ? (
          <p className="text-xs text-cider-text-dim">Connecting to sandbox...</p>
        ) : connected ? (
          <div className="space-y-0.5">
            <p className="text-xs font-medium text-cider-green">Connected</p>
            <p className="text-[11px] text-cider-text-dim truncate">
              macOS {status.macos_version} &middot;{" "}
              {status.xcode.split("\n")[0]} &middot;{" "}
              {status.booted_simulators.length > 0
                ? status.booted_simulators.map((s) => s.name).join(", ")
                : "No simulators booted"}
            </p>
          </div>
        ) : (
          <div className="space-y-0.5">
            <p className="text-xs font-medium text-cider-red">Disconnected</p>
            <p className="text-[11px] text-cider-text-dim truncate">{error}</p>
          </div>
        )}
      </div>

      <button
        onClick={() => {
          setChecking(true);
          checkStatus();
        }}
        className="text-[11px] px-2 py-1 rounded bg-cider-border hover:bg-cider-text-dim/20 transition-colors text-cider-text-dim"
      >
        Retry
      </button>
    </div>
  );
}
