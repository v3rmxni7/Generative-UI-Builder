export interface DSLElement {
  type: string;
  props?: Record<string, string>;
  children?: DSLElement[];
}

export interface DSLLayout {
  type: string;
  layout: "vertical" | "horizontal";
  children: DSLElement[];
}

export type GenerationStatus =
  | "idle"
  | "running"
  | "done"
  | "error";

export interface AgentStep {
  name: string;
  status: "pending" | "running" | "done" | "repairing" | "retrying" | "repaired";
  startedAt?: number;
  durationMs?: number;
  issues?: string[];
  reason?: string;
}

export interface ReflectionResult {
  score: number;
  approved: boolean;
  issues: string[];
}

export interface PlanResult {
  complexity: string;
  component_count: number;
  detected_components: string[];
  layout_strategy: string;
  has_navigation: boolean;
  has_forms: boolean;
  has_data_display: boolean;
  notes: string;
}
