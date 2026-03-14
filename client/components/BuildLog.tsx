"use client";

import { useEffect, useRef } from "react";

interface Props {
  lines: string[];
}

export default function BuildLog({ lines }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [lines]);

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-2 border-b border-cider-border flex items-center justify-between">
        <h2 className="text-sm font-semibold text-cider-text-dim">Build Output</h2>
        {lines.length > 0 && (
          <span className="text-[11px] text-cider-text-dim">
            {lines.length} lines
          </span>
        )}
      </div>

      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto p-4 bg-cider-terminal"
      >
        {lines.length === 0 ? (
          <p className="text-xs text-cider-text-dim/50 text-center py-8">
            Build output will appear here...
          </p>
        ) : (
          <pre className="terminal-text text-cider-text">
            {lines.map((line, i) => (
              <div
                key={i}
                className={
                  line.includes("error:") || line.includes("Error:")
                    ? "text-cider-red"
                    : line.includes("warning:")
                    ? "text-yellow-500"
                    : line.startsWith("$")
                    ? "text-cider-accent"
                    : line.includes("BUILD SUCCEEDED") || line.includes("Build Succeeded")
                    ? "text-cider-green font-bold"
                    : ""
                }
              >
                {line}
              </div>
            ))}
          </pre>
        )}
      </div>
    </div>
  );
}
