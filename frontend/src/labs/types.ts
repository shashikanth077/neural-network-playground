import type { ComponentType } from "react";
import type { DomainId } from "./domains";

export interface LabStep {
  id: string;
  title: string;
  /** One sentence shown under the step heading and in the sidebar tooltip. */
  summary: string;
  /** Sidebar group heading. */
  group: string;
  /** Rough reading + playing time. */
  minutes: number;
  Component: ComponentType;
}

/** A guided, step-by-step project. Stand-alone apps are `Tool`s (see lib/features.ts). */
export interface Lab {
  id: string;
  number: number;
  domain: DomainId;
  title: string;
  subtitle: string;
  course?: string;
  status: "live" | "planned";
  tags: string[];
  steps: LabStep[];
}
