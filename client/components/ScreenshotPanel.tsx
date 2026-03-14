"use client";

import { useState, useCallback } from "react";

export default function ScreenshotPanel() {
  const [screenshotUrl, setScreenshotUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const captureScreenshot = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/sandbox?endpoint=/screenshot");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const contentType = res.headers.get("content-type") || "";

      if (contentType.includes("image/")) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        setScreenshotUrl((prev) => {
          if (prev) URL.revokeObjectURL(prev);
          return url;
        });
      } else {
        const data = await res.json();
        throw new Error(data.error || "No screenshot available");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to capture");
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-2 border-b border-cider-border flex items-center justify-between">
        <h2 className="text-sm font-semibold text-cider-text-dim">Simulator</h2>
        <button
          onClick={captureScreenshot}
          disabled={loading}
          className="text-[11px] px-2 py-1 rounded bg-cider-border hover:bg-cider-text-dim/20 transition-colors text-cider-text-dim disabled:opacity-50"
        >
          {loading ? "Capturing..." : "Screenshot"}
        </button>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 bg-cider-terminal">
        {screenshotUrl ? (
          <div className="iphone-frame max-w-[280px] w-full aspect-[9/19.5] bg-black">
            <img
              src={screenshotUrl}
              alt="iOS Simulator screenshot"
              className="w-full h-full object-contain"
            />
          </div>
        ) : error ? (
          <div className="text-center">
            <p className="text-xs text-cider-red mb-2">{error}</p>
            <p className="text-[11px] text-cider-text-dim">
              Make sure a simulator is booted
            </p>
          </div>
        ) : (
          <div className="text-center">
            <div className="iphone-frame max-w-[280px] w-full aspect-[9/19.5] bg-black/50 flex items-center justify-center mx-auto mb-4">
              <span className="text-cider-text-dim text-xs">No screenshot</span>
            </div>
            <p className="text-[11px] text-cider-text-dim">
              Screenshots appear after the app is built and launched
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
