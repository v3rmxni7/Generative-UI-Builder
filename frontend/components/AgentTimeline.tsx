"use client";

import {
  Brain,
  CheckCircle2,
  Code2,
  Eye,
  Loader2,
  RefreshCw,
  ScanSearch,
  ShieldCheck,
  Wrench,
} from "lucide-react";

import type { AgentStep, PlanResult, ReflectionResult } from "@/types/generation";

interface Props {
  agents: AgentStep[];
  plan: PlanResult | null;
  reflection: ReflectionResult | null;
}

const ICONS: Record<string, React.ElementType> = {
  Planner: Brain,
  Vision: ScanSearch,
  Validator: ShieldCheck,
  CodeGenerator: Code2,
  Reflection: Eye,
};

const STATUS_COLORS: Record<string, string> = {
  pending: "text-zinc-600",
  running: "text-blue-400",
  done: "text-green-400",
  repairing: "text-amber-400",
  repaired: "text-amber-400",
  retrying: "text-amber-400",
};

const STATUS_LABELS: Record<string, string> = {
  pending: "",
  running: "Running…",
  done: "Done",
  repairing: "Repairing…",
  repaired: "Repaired",
  retrying: "Retrying…",
};

export default function AgentTimeline({ agents, plan, reflection }: Props) {
  return (
    <div className="flex flex-col gap-1">
      <h3 className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest mb-1">
        Agent Pipeline
      </h3>

      {agents.map((agent, i) => {
        const Icon = ICONS[agent.name] ?? Brain;
        const color = STATUS_COLORS[agent.status] ?? "text-zinc-600";
        const isActive = agent.status === "running" || agent.status === "repairing" || agent.status === "retrying";
        const isDone = agent.status === "done" || agent.status === "repaired";

        return (
          <div key={i} className="flex items-start gap-2 relative">
            {/* Connector line */}
            {i < agents.length - 1 && (
              <div
                className={`absolute left-[11px] top-[22px] w-px h-[calc(100%)] ${
                  isDone ? "bg-zinc-700" : "bg-zinc-800"
                }`}
              />
            )}

            {/* Icon */}
            <div className={`relative z-10 mt-0.5 ${color}`}>
              {isActive ? (
                <Loader2 size={14} className="animate-spin" />
              ) : isDone ? (
                <CheckCircle2 size={14} />
              ) : (
                <Icon size={14} />
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0 pb-3">
              <div className="flex items-center gap-2">
                <span
                  className={`text-xs font-medium ${
                    isDone
                      ? "text-zinc-300"
                      : isActive
                        ? "text-zinc-200"
                        : "text-zinc-600"
                  }`}
                >
                  {agent.name}
                </span>
                {agent.status !== "pending" && (
                  <span className={`text-[10px] ${color}`}>
                    {STATUS_LABELS[agent.status]}
                  </span>
                )}
              </div>

              {/* Planner detail */}
              {agent.name === "Planner" && isDone && plan && (
                <p className="text-[10px] text-zinc-500 mt-0.5 truncate">
                  {plan.complexity} · {plan.component_count} components · {plan.layout_strategy}
                </p>
              )}

              {/* Validator issues */}
              {agent.name === "Validator" && agent.issues && agent.issues.length > 0 && (
                <div className="flex items-center gap-1 mt-0.5">
                  <Wrench size={10} className="text-amber-500" />
                  <span className="text-[10px] text-amber-500">
                    Self-repaired ({agent.issues.length} issue{agent.issues.length > 1 ? "s" : ""})
                  </span>
                </div>
              )}

              {/* Reflection detail */}
              {agent.name === "Reflection" && isDone && reflection && (
                <div className="flex items-center gap-2 mt-0.5">
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                      reflection.approved
                        ? "bg-green-500/10 text-green-400"
                        : "bg-red-500/10 text-red-400"
                    }`}
                  >
                    {reflection.score}/10
                  </span>
                  {!reflection.approved && (
                    <span className="text-[10px] text-amber-400 flex items-center gap-0.5">
                      <RefreshCw size={9} /> Retrying
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
