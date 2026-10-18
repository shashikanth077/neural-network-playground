import type { ComponentType } from "react";

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

export interface Lab {
  id: string;
  number: number;
  title: string;
  subtitle: string;
  course?: string;
  status: "live" | "planned";
  tags: string[];
  /** Tailwind text/background token used for the lab's accent chip. */
  accent: "brand" | "c-teal" | "c-purple" | "c-amber";
  steps: LabStep[];
}
