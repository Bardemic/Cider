"use client";

import { useState, useRef, useEffect } from "react";
import type { ChatMessage, ToolCall } from "@/lib/types";

interface Props {
  onToolCall?: (toolCall: ToolCall) => void;
  onBuildOutput?: (line: string) => void;
}

export default function ChatInterface({ onToolCall, onBuildOutput }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendPrompt = async () => {
    const prompt = input.trim();
    if (!prompt || isRunning) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: prompt,
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsRunning(true);

    try {
      const res = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      if (!res.ok || !res.body) {
        throw new Error(`Agent error: ${res.status}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const event = JSON.parse(line.slice(6));
            handleEvent(event);
          } catch {
            // skip malformed events
          }
        }
      }
    } catch (err) {
      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        role: "system",
        content: `Error: ${err instanceof Error ? err.message : String(err)}`,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsRunning(false);
    }
  };

  const handleEvent = (event: { type: string; data: Record<string, unknown> }) => {
    switch (event.type) {
      case "message": {
        const msg = event.data as unknown as ChatMessage;
        setMessages((prev) => [...prev, msg]);
        break;
      }
      case "tool_call": {
        const tc = event.data as unknown as ToolCall;
        onToolCall?.(tc);
        // If it's a build command, stream to build log
        if (tc.name === "execute_command") {
          const cmd = (tc.args as { command?: string }).command || "";
          if (cmd.includes("xcodebuild")) {
            onBuildOutput?.(`$ ${cmd}`);
          }
        }
        break;
      }
      case "tool_result": {
        const tc = event.data as unknown as ToolCall;
        onToolCall?.(tc);
        // Stream build output
        if (tc.name === "execute_command" && tc.result) {
          try {
            const parsed = JSON.parse(tc.result);
            if (parsed.stdout) onBuildOutput?.(parsed.stdout);
            if (parsed.stderr) onBuildOutput?.(parsed.stderr);
          } catch {
            // skip
          }
        }
        break;
      }
      case "error": {
        const errMsg: ChatMessage = {
          id: `err-${Date.now()}`,
          role: "system",
          content: `Agent error: ${(event.data as { message?: string }).message}`,
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, errMsg]);
        break;
      }
      case "done": {
        const doneData = event.data as { finalMessage?: string };
        if (doneData.finalMessage) {
          const finalMsg: ChatMessage = {
            id: `done-${Date.now()}`,
            role: "assistant",
            content: doneData.finalMessage,
            timestamp: Date.now(),
          };
          // Avoid duplicate if already added via "message" event
          setMessages((prev) => {
            const last = prev[prev.length - 1];
            if (last?.content === doneData.finalMessage) return prev;
            return [...prev, finalMsg];
          });
        }
        break;
      }
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-2 border-b border-cider-border">
        <h2 className="text-sm font-semibold text-cider-text-dim">Chat</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <div className="text-center text-cider-text-dim text-xs py-12">
            <p className="mb-2">Describe the iOS app you want to build.</p>
            <p className="text-[11px]">
              e.g., &quot;Build a simple counter app for iPhone&quot;
            </p>
          </div>
        )}
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`fade-in rounded-lg px-3 py-2 text-sm ${
              msg.role === "user"
                ? "bg-cider-accent/10 border border-cider-accent/20 ml-8"
                : msg.role === "system"
                ? "bg-cider-red/10 border border-cider-red/20"
                : "bg-cider-surface border border-cider-border mr-8"
            }`}
          >
            <p className="text-[11px] text-cider-text-dim mb-1">
              {msg.role === "user" ? "You" : msg.role === "assistant" ? "Cider" : "System"}
            </p>
            <p className="whitespace-pre-wrap text-xs leading-relaxed">{msg.content}</p>
          </div>
        ))}
        {isRunning && (
          <div className="flex items-center gap-2 text-xs text-cider-accent fade-in">
            <div className="w-1.5 h-1.5 rounded-full bg-cider-accent animate-pulse" />
            Agent is working...
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-3 border-t border-cider-border">
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendPrompt()}
            placeholder={isRunning ? "Agent is working..." : "Describe your iOS app..."}
            disabled={isRunning}
            className="flex-1 px-3 py-2 rounded-lg bg-cider-terminal border border-cider-border text-sm text-cider-text placeholder:text-cider-text-dim/50 focus:outline-none focus:border-cider-accent/50 disabled:opacity-50"
          />
          <button
            onClick={sendPrompt}
            disabled={isRunning || !input.trim()}
            className="px-4 py-2 rounded-lg bg-cider-accent text-white text-sm font-medium hover:bg-cider-accent-dim transition-colors disabled:opacity-30 disabled:cursor-not-allowed glow-orange"
          >
            Build
          </button>
        </div>
      </div>
    </div>
  );
}
