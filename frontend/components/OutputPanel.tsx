"use client";

import { useState } from "react";
import { Code2, Eye, LayoutTemplate, Loader2 } from "lucide-react";

import type {
  DSLLayout,
  GenerationStatus,
  ReflectionResult,
} from "@/types/generation";
import CodeViewer from "./CodeViewer";
import LivePreview from "./LivePreview";

interface Props {
  dsl: DSLLayout | null;
  code: string;
  status: GenerationStatus;
  reflection: ReflectionResult | null;
}

type Tab = "dsl" | "code" | "preview";

const TABS: { id: Tab; label: string; Icon: React.ElementType }[] = [
  { id: "dsl", label: "DSL JSON", Icon: LayoutTemplate },
  { id: "code", label: "React Code", Icon: Code2 },
  { id: "preview", label: "Preview", Icon: Eye },
];

export default function OutputPanel({ dsl, code, status, reflection }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>("code");

  const isRunning = status === "running";

  return (
    <div className="flex flex-col h-full bg-zinc-950">
      {/* Tab bar */}
      <div className="flex items-center gap-1 px-3 pt-2 pb-0 border-b border-zinc-800 bg-zinc-900">
        {TABS.map(({ id, label, Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-t transition-colors
              ${
                activeTab === id
                  ? "text-zinc-100 border-b-2 border-blue-500 -mb-px bg-zinc-950"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
          >
            <Icon size={13} />
            {label}
            {id === "code" && isRunning && (
              <Loader2
                size={11}
                className="animate-spin text-blue-400 ml-0.5"
              />
            )}
          </button>
        ))}

        {/* Status badges */}
        <div className="ml-auto flex items-center gap-2 pr-2">
          {isRunning && (
            <span className="text-[10px] text-blue-400 flex items-center gap-1">
              <Loader2 size={10} className="animate-spin" />
              Processing…
            </span>
          )}
          {reflection && status === "done" && (
            <span
              className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                reflection.approved
                  ? "bg-green-500/10 text-green-400 border border-green-500/20"
                  : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
              }`}
            >
              Quality: {reflection.score}/10
            </span>
          )}
          {status === "done" && (
            <span className="text-[10px] text-green-400">✓ Ready</span>
          )}
        </div>
      </div>

      {/* Tab content */}
      <div className="flex-1 min-h-0">
        {activeTab === "dsl" && (
          <CodeViewer
            code={dsl ? JSON.stringify(dsl, null, 2) : ""}
            language="json"
            filename="layout.json"
          />
        )}
        {activeTab === "code" && (
          <CodeViewer code={code} filename="GeneratedPage.tsx" />
        )}
        {activeTab === "preview" && (
          <LivePreview code={status === "done" ? code : ""} />
        )}
      </div>
    </div>
  );
}
