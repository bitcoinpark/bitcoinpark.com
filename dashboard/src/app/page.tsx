import Link from "next/link";
import Image from "next/image";

export default function Home() {
  return (
    <main className="min-h-screen" style={{ background: "var(--bp-bg)" }}>
      <div className="container mx-auto px-6 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <div className="flex justify-center mb-6">
              <Image
                src="/bp-logo.png"
                alt="Bitcoin Park"
                width={160}
                height={80}
                style={{ objectFit: "contain", filter: "brightness(0) invert(1)" }}
              />
            </div>
            <h1 className="text-5xl font-bold mb-4" style={{ color: "var(--bp-text)" }}>
              Mission Control Dashboard
            </h1>
            <p className="text-xl" style={{ color: "var(--bp-text-muted)" }}>
              Task management for humans and AI agents
            </p>
          </div>

          <div
            className="rounded-lg shadow-xl p-8 mb-8"
            style={{ background: "var(--bp-card)", border: "1px solid var(--bp-border)" }}
          >
            <div className="grid md:grid-cols-2 gap-8 mb-8">
              <div style={{ borderLeft: "4px solid var(--bp-green-light)", paddingLeft: "1rem" }}>
                <h3 className="text-lg font-bold mb-2" style={{ color: "var(--bp-text)" }}>
                  👤 For Humans
                </h3>
                <ul className="text-sm space-y-1" style={{ color: "var(--bp-text-muted)" }}>
                  <li>✓ Beautiful Kanban board UI</li>
                  <li>✓ Real-time task updates</li>
                  <li>✓ Comments &amp; collaboration</li>
                  <li>✓ Priority management</li>
                </ul>
              </div>
              <div style={{ borderLeft: "4px solid var(--bp-green)", paddingLeft: "1rem" }}>
                <h3 className="text-lg font-bold mb-2" style={{ color: "var(--bp-text)" }}>
                  🤖 For AI Agents
                </h3>
                <ul className="text-sm space-y-1" style={{ color: "var(--bp-text-muted)" }}>
                  <li>✓ Simple HTTP REST API</li>
                  <li>✓ Python CLI included</li>
                  <li>✓ Example automation agents</li>
                  <li>✓ Full API documentation</li>
                </ul>
              </div>
            </div>

            <div
              className="p-4 mb-6 rounded"
              style={{
                background: "#1a2a10",
                borderLeft: "4px solid var(--bp-green-light)",
              }}
            >
              <h3 className="font-bold mb-2" style={{ color: "var(--bp-green-light)" }}>
                🚀 Setup Required
              </h3>
              <p className="text-sm mb-3" style={{ color: "var(--bp-text-muted)" }}>
                To use the full application with real-time sync, you need to initialize Convex:
              </p>
              <code className="block p-3 rounded text-sm mb-3" style={{ background: "var(--bp-bg-dark)", color: "var(--bp-green-light)" }}>
                npx convex dev
              </code>
              <p className="text-xs" style={{ color: "var(--bp-text-dim)" }}>
                This requires a free Convex account and will open a browser for login.
              </p>
            </div>

            <div className="flex flex-col gap-4">
              <Link
                href="/demo"
                className="bp-btn-primary block text-center font-bold py-4 px-6 rounded-lg transition-colors"
              >
                🎨 View Demo (No Setup Required)
              </Link>
              <div className="text-center text-sm" style={{ color: "var(--bp-text-dim)" }}>
                or follow the setup instructions below
              </div>
            </div>
          </div>

          <div
            className="rounded-lg shadow-xl p-8"
            style={{ background: "var(--bp-card)", border: "1px solid var(--bp-border)" }}
          >
            <h2 className="text-2xl font-bold mb-4" style={{ color: "var(--bp-text)" }}>
              📋 Quick Setup
            </h2>
            <div className="space-y-6">
              <div>
                <h3 className="font-bold mb-2" style={{ color: "var(--bp-text-muted)" }}>
                  Step 1: Initialize Convex
                </h3>
                <code className="block p-3 rounded text-sm" style={{ background: "var(--bp-bg-dark)", color: "var(--bp-green-light)" }}>
                  npx convex dev
                </code>
                <p className="text-sm mt-2" style={{ color: "var(--bp-text-dim)" }}>
                  Opens browser for login, creates .env.local automatically
                </p>
              </div>

              <div>
                <h3 className="font-bold mb-2" style={{ color: "var(--bp-text-muted)" }}>
                  Step 2: Start Next.js
                </h3>
                <code className="block p-3 rounded text-sm" style={{ background: "var(--bp-bg-dark)", color: "var(--bp-green-light)" }}>
                  npm run dev
                </code>
                <p className="text-sm mt-2" style={{ color: "var(--bp-text-dim)" }}>
                  Starts the development server on port 3000
                </p>
              </div>

              <div>
                <h3 className="font-bold mb-2" style={{ color: "var(--bp-text-muted)" }}>
                  Step 3: Create Test Data
                </h3>
                <p className="text-sm" style={{ color: "var(--bp-text-dim)" }}>
                  Open the Convex dashboard and add users/tasks, or use the Python CLI
                </p>
              </div>
            </div>

            <div className="mt-6 pt-6" style={{ borderTop: "1px solid var(--bp-border)" }}>
              <h3 className="font-bold mb-3" style={{ color: "var(--bp-text-muted)" }}>📚 Documentation</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {[
                  ["📄", "START_HERE.md", "Getting started"],
                  ["⚡", "QUICK_START.md", "5-minute setup"],
                  ["📖", "README.md", "API reference"],
                  ["🏗️", "ARCHITECTURE.md", "System design"],
                ].map(([icon, file, desc]) => (
                  <div
                    key={file}
                    className="p-2 rounded"
                    style={{ background: "var(--bp-bg-dark)", color: "var(--bp-text-muted)" }}
                  >
                    {icon} <strong style={{ color: "var(--bp-text)" }}>{file}</strong> - {desc}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-8 text-center text-sm" style={{ color: "var(--bp-text-dim)" }}>
            <p>
              Location:{" "}
              <code className="px-2 py-1 rounded" style={{ background: "var(--bp-card)", color: "var(--bp-green-light)" }}>
                /Users/andrewdavis/mission-control
              </code>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
