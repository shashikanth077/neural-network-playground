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

/** Props of the optional per-step slots a lab can render around its step content. */
export interface StepSlotProps {
  stepId: string;
  /** Ids of the steps the learner has completed. */
  done: string[];
}

/** Operating systems a setup command can differ on. */
export type SetupOs = "linux" | "mac" | "windows";

/** How much a lab needs of something: not at all, only for an optional extra, or always. */
export type SetupNeed = "no" | "optional" | "yes";

export interface SetupCommand {
  /** Unique within the stage; names the translated label `setup.<lab>.s.<stage>.c.<id>`. */
  id: string;
  /** One string for every OS, or one per OS (an OS left out falls back to `linux`). Never translated. */
  cmd: string | Partial<Record<SetupOs, string>>;
  /** OSes on which the authors really ran this command. The panel says so; everything else is "not run". */
  tested?: SetupOs[];
}

export interface SetupStage {
  /** Names the translated texts `setup.<lab>.s.<id>.title | body | check`. */
  id: string;
  /** An optional stage is marked as such (an extra, not needed to follow the lab). */
  optional?: boolean;
  commands?: SetupCommand[];
  /** True when a "check it worked" line exists (`setup.<lab>.s.<id>.check`). */
  check?: boolean;
}

/** One box of the end-to-end diagram. `detail` is a file or URL, shown as is. */
export interface SetupFlowNode {
  state: "used" | "optional" | "unused";
  detail?: string;
}

/**
 * Everything a learner needs to run a lab, from Python to the browser. Only language-neutral facts live
 * here (ids, commands, paths, package names, sizes); every sentence is a translation key built from the
 * lab id and these ids, in `i18n/messages/labsetup.ts` (a test checks that none is missing).
 */
export interface LabSetup {
  needs: { python: SetupNeed; backend: SetupNeed; database: SetupNeed };
  /** Python version advice and packages; `setup.<lab>.pynotes` and `setup.<lab>.pkg.<name>` hold the text. */
  python?: { version: string; packages: { name: string }[] };
  /** Node.js version, when the lab needs the frontend dev server (`setup.<lab>.nodenote`). */
  node?: { version: string };
  stages: SetupStage[];
  /** `setup.<lab>.f.<id>` says what the path is. */
  folders: { id: string; path: string }[];
  /** `setup.<lab>.d.<id>.source` says where it comes from. `bytes` is the verified download size. */
  data?: { id: string; name: string; bytes?: number; auto: boolean }[];
  /** Extra timing facts, `setup.<lab>.t.<id>` (placeholders filled from `vars`). Facts you can source only. */
  timeFor?: { id: string; vars?: Record<string, string | number> }[];
  /** `setup.<lab>.db`: what a database does for this lab (or that none is used). */
  database: boolean;
  /** `setup.<lab>.tr.<id>.p` (problem) and `.f` (fix). */
  troubleshooting: { id: string }[];
  /** Python → API → React → database, left to right in the diagram. `setup.<lab>.flow.<kind>` explains each box. */
  flow: { python: SetupFlowNode; api: SetupFlowNode; ui: SetupFlowNode; db: SetupFlowNode };
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
  /** Optional "Setup & run" guide. When present the lab shell adds it as a first step (id `setup`). */
  setup?: LabSetup;
  /** Optional overview (e.g. a pipeline map) shown above every step. */
  Map?: ComponentType<StepSlotProps>;
  /** Optional guide shown between the step heading and the step content (goal, tasks ...). */
  Intro?: ComponentType<StepSlotProps>;
  /** Optional guide shown after the step content (quiz, takeaways ...). */
  Outro?: ComponentType<StepSlotProps>;
}
