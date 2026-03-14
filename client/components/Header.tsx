"use client";

export default function Header() {
  return (
    <header className="flex items-center justify-between px-6 py-3 border-b border-cider-border bg-cider-surface/50 backdrop-blur-sm">
      <div className="flex items-center gap-3">
        <div className="text-2xl">🍺</div>
        <div>
          <h1 className="text-lg font-bold tracking-tight text-cider-text">
            Cider
          </h1>
          <p className="text-xs text-cider-text-dim">
            Brew iOS apps in the cloud
          </p>
        </div>
      </div>
      <div className="flex items-center gap-4 text-xs text-cider-text-dim">
        <span>Google DeepMind Hackathon 2025</span>
        <a
          href="https://github.com"
          target="_blank"
          rel="noopener"
          className="hover:text-cider-accent transition-colors"
        >
          GitHub
        </a>
      </div>
    </header>
  );
}
