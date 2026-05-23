import React from "react";
import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="mb-16 text-center">
          <h1 className="mb-4 text-5xl font-bold text-white">
            🚀 ASANMOD Enterprise Template
          </h1>
          <p className="mb-8 text-xl text-gray-300">
            AI-native, only-agent-driven universal starter
          </p>
          <div className="flex justify-center gap-4">
            <Link
              href="/dashboard"
              className="rounded-lg bg-purple-600 px-6 py-3 text-white transition hover:bg-purple-700"
            >
              Dashboard
            </Link>
            <Link
              href="/login"
              className="rounded-lg bg-slate-700 px-6 py-3 text-white transition hover:bg-slate-600"
            >
              Login
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div className="mb-16 grid gap-8 md:grid-cols-3">
          <FeatureCard
            icon="⚡"
            title="Next.js 15"
            description="App Router, Server Components, Streaming"
          />
          <FeatureCard
            icon="🔒"
            title="Type-Safe API"
            description="tRPC + Zod end-to-end type safety"
          />
          <FeatureCard
            icon="🗃️"
            title="Drizzle ORM"
            description="Lightweight, TypeScript-first database"
          />
        </div>

        {/* Quick Start */}
        <div className="rounded-xl bg-slate-800/50 p-8 backdrop-blur">
          <h2 className="mb-4 text-2xl font-bold text-white">Quick Start</h2>
          <div className="space-y-2 font-mono text-sm">
            <CodeLine>npm run agent:init</CodeLine>
            <CodeLine>npm run mode:status</CodeLine>
            <CodeLine>npm run verify -- --dry-run</CodeLine>
          </div>
        </div>
      </div>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-xl bg-slate-800/50 p-6 backdrop-blur">
      <div className="mb-3 text-4xl">{icon}</div>
      <h3 className="mb-2 text-xl font-semibold text-white">{title}</h3>
      <p className="text-gray-400">{description}</p>
    </div>
  );
}

function CodeLine({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded bg-slate-900 px-4 py-2 text-green-400">
      $ {children}
    </div>
  );
}
