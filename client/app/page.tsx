import Image from "next/image";
import CiderIcon from "@/components/CiderIcon";

const commands = [
  "cider create",
  'cider create --repo "url"',
  "cider list",
  "cider [ID] --emulator ios",
  "cider stop [ID]",
];

const sections = [
  {
    title: "Provision",
    copy: "Start a fresh macOS sandbox with `cider create`, or seed it from a repo and get back a clean sandbox ID.",
  },
  {
    title: "Build",
    copy: "Boot the iOS simulator, run the agent, and iterate against a real Xcode toolchain from any machine.",
  },
  {
    title: "Reset",
    copy: "When the work is done, tear the environment down and start again from the same known-good image.",
  },
];

export default function Home() {
  return (
    <main className="page-shell">
      <section className="grid items-start gap-14 pt-16 lg:grid-cols-[minmax(0,1fr)_minmax(420px,470px)]">
        <div>
          <div className="flex items-center gap-3">
            <CiderIcon size={28} />
            <span className="eyebrow">Brew iOS apps in the cloud</span>
          </div>
          <h1 className="hero-title mt-6 max-w-3xl">Let agents build iOS apps from any machine.</h1>
          <p className="body-copy mt-6 max-w-xl text-lg">
            Spin up a macOS sandbox, build and run iOS apps in a remote simulator,
            and ship without needing a Mac on your desk.
          </p>
          <div className="mt-5 inline-flex items-center gap-3 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5">
            <span className="mono-inline text-base">npm i -g cider-cli</span>
          </div>

          {/* "Sponsored" badge */}
          <div className="mt-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface)] px-5 py-2.5 opacity-80 hover:opacity-100 transition-opacity">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none">
                <path d="M12 2L8.5 8.5 2 12l6.5 3.5L12 22l3.5-6.5L22 12l-6.5-3.5z" fill="#4285F4"/>
                <path d="M12 2L8.5 8.5 2 12l6.5 3.5L12 22" fill="#34A853"/>
                <path d="M12 2l3.5 6.5L22 12l-6.5 3.5L12 22" fill="#FBBC04"/>
                <path d="M12 7l-2.5 5L12 17l2.5-5z" fill="#EA4335"/>
              </svg>
              <span className="text-sm font-medium tracking-wide">
                <span style={{ fontSize: '3px', verticalAlign: 'super' }}>not </span>
                Sponsored by Gemini
              </span>
            </div>
          </div>

          <div className="mt-12 max-w-xl border-t border-[var(--border)] pt-6">
            <div className="data-label">CLI flow</div>
            <ul className="mt-4 space-y-3">
              {commands.map((command) => (
                <li key={command} className="flex items-start gap-3">
                  <span className="mt-[9px] h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />
                  <span className="mono-inline">{command}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-[var(--border)]">
          <Image
            src="/CLI.png"
            alt="Cider CLI"
            width={940}
            height={600}
            className="w-full object-cover"
            priority
          />
        </div>
      </section>

      <section className="mt-24 grid items-start gap-14 border-t border-[var(--border)] pt-16 lg:grid-cols-[minmax(0,0.8fr)_minmax(420px,1.2fr)]">
        <div>
          <div className="data-label">How it works</div>
          <h2 className="section-title mt-4 max-w-lg">
            Provision a remote Mac, build inside it, and throw it away when you are done.
          </h2>
          <div className="mt-10 space-y-8">
            {sections.map((section) => (
              <div key={section.title} className="border-t border-[var(--border)] pt-4">
                <h3 className="text-xl font-semibold">{section.title}</h3>
                <p className="body-copy mt-3 max-w-md">{section.copy}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="surface-card divide-y divide-[var(--border)] overflow-hidden">
          {[
            { label: "Sandbox", value: "macOS · Xcode · iOS Simulator" },
            { label: "Build output", value: "Live log stream from xcodebuild" },
            { label: "Agent session", value: "Prompt-driven SwiftUI builds inside the sandbox" },
            { label: "Simulator preview", value: "On-demand screenshot capture" },
            { label: "Lifecycle", value: "Create, inspect, and destroy disposable macOS environments" },
          ].map(({ label, value }) => (
            <div key={label} className="flex items-center justify-between gap-6 px-6 py-4">
              <span className="data-label">{label}</span>
              <span className="body-copy text-right text-sm">{value}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-20 grid gap-10 border-t border-[var(--border)] pt-10 md:grid-cols-3">
        <div>
          <div className="data-label">Provision</div>
          <p className="body-copy mt-3">
            `cider create` can start clean or initialize from a repo URL without any extra web flow.
          </p>
        </div>
        <div>
          <div className="data-label">Build</div>
          <p className="body-copy mt-3">
            Use the sandbox to compile Swift, boot the simulator, and iterate on the app from the CLI.
          </p>
        </div>
        <div>
          <div className="data-label">Cleanup</div>
          <p className="body-copy mt-3">
            Destroy the VM when you are finished and return to a clean base image for the next run.
          </p>
        </div>
      </section>

    </main>
  );
}
