"use client";

import { useCallback, useRef, useState } from "react";

import type {
  AgentStep,
  DSLLayout,
  GenerationStatus,
  PlanResult,
  ReflectionResult,
} from "@/types/generation";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const AGENT_ORDER = ["Planner", "Vision", "Validator", "CodeGenerator", "Reflection"];

function initialAgents(): AgentStep[] {
  return AGENT_ORDER.map((name) => ({ name, status: "pending" as const }));
}

interface SSEEvent {
  type: string;
  name?: string;
  status?: string;
  issues?: string[];
  reason?: string;
  payload?: unknown;
}

export function useGenerationStream() {
  const [dsl, setDsl] = useState<DSLLayout | null>(null);
  const [code, setCode] = useState("");
  const [status, setStatus] = useState<GenerationStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [agents, setAgents] = useState<AgentStep[]>(initialAgents());
  const [plan, setPlan] = useState<PlanResult | null>(null);
  const [reflection, setReflection] = useState<ReflectionResult | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const updateAgent = useCallback(
    (name: string, patch: Partial<AgentStep>) => {
      setAgents((prev) =>
        prev.map((a) => {
          // Match by name prefix to handle "CodeGenerator (retry 1)"
          if (a.name === name || name.startsWith(a.name)) {
            return { ...a, ...patch };
          }
          return a;
        }),
      );
    },
    [],
  );

  const generate = useCallback(
    async (file: File, instructions: string) => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setStatus("running");
      setCode("");
      setDsl(null);
      setError(null);
      setPlan(null);
      setReflection(null);
      setAgents(initialAgents());

      const form = new FormData();
      form.append("file", file);
      form.append("instructions", instructions);

      try {
        const res = await fetch(
          `${API_URL}/generate/stream`,
          { method: "POST", body: form, signal: controller.signal },
        );

        if (!res.ok) {
          const msg = await res.text().catch(() => `HTTP ${res.status}`);
          throw new Error(msg);
        }
        if (!res.body) throw new Error("No response body");

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            let event: SSEEvent;
            try {
              event = JSON.parse(line.slice(6)) as SSEEvent;
            } catch {
              continue;
            }

            switch (event.type) {
              case "agent":
                updateAgent(event.name ?? "", {
                  status: event.status as AgentStep["status"],
                  ...(event.status === "running"
                    ? { startedAt: Date.now() }
                    : {}),
                  ...(event.issues ? { issues: event.issues } : {}),
                  ...(event.reason ? { reason: event.reason } : {}),
                });
                break;
              case "plan":
                setPlan(event.payload as PlanResult);
                break;
              case "dsl":
                setDsl(event.payload as DSLLayout);
                break;
              case "code_chunk":
                setCode((prev) => prev + (event.payload as string));
                break;
              case "code_reset":
                setCode("");
                break;
              case "reflection":
                setReflection(event.payload as ReflectionResult);
                break;
              case "done":
                setStatus("done");
                break;
              case "error":
                throw new Error(event.payload as string);
            }
          }
        }
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        setError((err as Error).message ?? "Unknown error");
        setStatus("error");
      }
    },
    [updateAgent],
  );

  const cancel = useCallback(() => {
    abortRef.current?.abort();
    setStatus("idle");
  }, []);

  return { dsl, code, status, error, agents, plan, reflection, generate, cancel };
}
