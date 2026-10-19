import { useEffect, useId, useRef, useState, type ComponentType } from "react";
import { renderRich, useT } from "./lab1/rich";
import { Callout, Demo, Seg } from "./ui";
import type { Lab, LabStep, SetupCommand, SetupFlowNode, SetupNeed, SetupOs } from "./types";

/** Id of the extra first step the lab shell adds to a lab that declares `setup`. */
export const SETUP_STEP_ID = "setup";
export const SETUP_GROUP = "Setup & run";

const OS_LABEL: Record<SetupOs, string> = { linux: "Linux", mac: "macOS", windows: "Windows" };
const OS_KEY = "ailab-setup-os";

function detectOs(): SetupOs {
  try {
    const saved = localStorage.getItem(OS_KEY);
    if (saved === "linux" || saved === "mac" || saved === "windows") return saved;
  } catch { /* storage unavailable */ }
  const ua = typeof navigator !== "undefined" ? `${navigator.userAgent} ${navigator.platform ?? ""}` : "";
  if (/Win/i.test(ua)) return "windows";
  if (/Mac/i.test(ua)) return "mac";
  return "linux";
}

const cmdFor = (c: SetupCommand, os: SetupOs): string => (typeof c.cmd === "string" ? c.cmd : c.cmd[os] ?? c.cmd.linux ?? "");

/** Copy text to the clipboard; falls back to a hidden textarea where the async API is missing. Resolves to success. */
export async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch { /* permission denied: try the fallback */ }
  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}

function Chip({ label, state, plain }: { label: string; state: SetupNeed; plain?: boolean }) {
  const t = useT();
  const tone = state === "yes" ? "!border-ok/40 !bg-ok/10 !text-ok" : state === "optional" ? "!border-c-amber/50 !bg-c-amber/10 !text-c-amber" : "";
  const word = state === "optional" ? t("setup.state.optional")
    : state === "yes" ? t(plain ? "setup.state.yes" : "setup.state.required")
    : t(plain ? "setup.state.no" : "setup.state.notNeeded");
  return (
    <li className={`chip !text-[13px] ${tone}`} data-state={state}>
      <span className="font-semibold">{label}</span>
      <span aria-hidden className="mx-1.5 opacity-50">·</span>
      <span>{word}</span>
    </li>
  );
}

function CopyButton({ text, label }: { text: string; label: string }) {
  const t = useT();
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle");
  const timer = useRef<ReturnType<typeof setTimeout>>();
  useEffect(() => () => clearTimeout(timer.current), []);
  const onClick = async () => {
    const ok = await copyText(text);
    setState(ok ? "copied" : "failed");
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setState("idle"), 1800);
  };
  const word = state === "copied" ? t("setup.copied") : state === "failed" ? t("setup.copyFailed") : t("setup.copy");
  return (
    <button
      type="button"
      onClick={onClick}
      data-copy-state={state}
      aria-label={state === "idle" ? `${t("setup.copy")}: ${label}` : word}
      className={`btn-ghost shrink-0 !px-2.5 !py-1 !text-xs ${state === "copied" ? "!border-ok !text-ok" : state === "failed" ? "!border-bad !text-bad" : ""}`}
    >
      {word}
    </button>
  );
}

function Command({ labId, stageId, c, os }: { labId: string; stageId: string; c: SetupCommand; os: SetupOs }) {
  const t = useT();
  const text = cmdFor(c, os);
  const label = t(`setup.${labId}.s.${stageId}.c.${c.id}`);
  const tested = !!c.tested?.includes(os) && (typeof c.cmd === "string" || c.cmd[os] !== undefined || os === "linux");
  return (
    <div className="min-w-0" data-testid="setup-command">
      <p className="text-xs text-muted">{label}</p>
      <div className="mt-1 flex items-start gap-2">
        <pre className="min-w-0 flex-1 overflow-x-auto rounded-lg border border-line bg-raised px-3 py-2 font-mono text-[13px] leading-relaxed" tabIndex={0}><code>{text}</code></pre>
        <CopyButton text={text} label={label} />
      </div>
      <p className={`mt-1 text-[11px] ${tested ? "text-ok" : "text-muted"}`}>
        {tested ? t("setup.tested", undefined, { os: OS_LABEL[os] }) : t("setup.notTested", undefined, { os: OS_LABEL[os] })}
      </p>
    </div>
  );
}

const NODE_ORDER = ["python", "api", "ui", "db"] as const;

/** Python → API → React → database as one inline SVG; colours come from the theme variables. */
function FlowDiagram({ lab }: { lab: Lab }) {
  const t = useT();
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const setup = lab.setup!;
  const BOX_H = 58;
  const GAP = 26;
  const H = NODE_ORDER.length * BOX_H + (NODE_ORDER.length - 1) * GAP + 4;
  const stroke = (n: SetupFlowNode) => (n.state === "unused" ? "rgb(var(--line))" : "rgb(var(--brand))");
  return (
    <div className="grid items-start gap-4 md:grid-cols-[minmax(0,340px)_minmax(0,1fr)]">
      <svg viewBox={`0 0 300 ${H}`} role="img" aria-labelledby={`${uid}t ${uid}d`} className="mx-auto w-full max-w-[340px]" data-testid="setup-flow">
        <title id={`${uid}t`}>{t("setup.flow.title")}</title>
        <desc id={`${uid}d`}>{NODE_ORDER.map((k) => `${t(`setup.flow.${k}`)}: ${t(`setup.state.flow.${setup.flow[k].state}`)}`).join(" → ")}</desc>
        <defs>
          <marker id={`${uid}a`} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M0 0 L10 5 L0 10 z" fill="rgb(var(--muted))" />
          </marker>
        </defs>
        {NODE_ORDER.map((k, i) => {
          const n = setup.flow[k];
          const y = 2 + i * (BOX_H + GAP);
          const dim = n.state === "unused";
          return (
            <g key={k} data-node={k} data-state={n.state}>
              {i > 0 && <line x1="150" y1={y - GAP + 2} x2="150" y2={y - 2} stroke="rgb(var(--muted))" strokeWidth="1.6" markerEnd={`url(#${uid}a)`} />}
              <rect x="6" y={y} width="288" height={BOX_H} rx="10" fill="rgb(var(--surface))" stroke={stroke(n)} strokeWidth={dim ? 1 : 1.8} strokeDasharray={n.state === "used" ? undefined : "5 4"} />
              <text x="18" y={y + 24} fontSize="14" fontWeight="700" fill={dim ? "rgb(var(--muted))" : "rgb(var(--ink))"}>{t(`setup.flow.${k}`)}</text>
              <text x="282" y={y + 24} fontSize="11" textAnchor="end" fill={dim ? "rgb(var(--muted))" : "rgb(var(--brand))"}>{t(`setup.state.flow.${n.state}`)}</text>
              <text x="18" y={y + 44} fontSize="11" fontFamily="ui-monospace, Menlo, monospace" fill="rgb(var(--muted))">{n.detail ?? ""}</text>
            </g>
          );
        })}
      </svg>
      <ol className="space-y-2 text-sm">
        {NODE_ORDER.map((k) => (
          <li key={k} className="flex gap-2">
            <span className="mt-0.5 shrink-0 font-semibold">{t(`setup.flow.${k}`)}</span>
            <span className="min-w-0 text-muted">{renderRich(t(`setup.${lab.id}.flow.${k}`))}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

const fmtBytes = (b: number) => (b >= 1_000_000 ? `${(b / 1_000_000).toFixed(1)} MB` : `${Math.round(b / 1000)} kB`);

/** The "Setup & run" guide of a lab: what you need, every stage with copyable commands, folders, data, timing, fixes. */
export function LabSetupPanel({ lab }: { lab: Lab }) {
  const t = useT();
  const setup = lab.setup;
  const [os, setOs] = useState<SetupOs>(detectOs);
  if (!setup) return null;
  const k = (s: string) => `setup.${lab.id}.${s}`;
  const pickOs = (v: SetupOs) => {
    setOs(v);
    try { localStorage.setItem(OS_KEY, v); } catch { /* ignore */ }
  };
  const minutes = lab.steps.reduce((n, s) => n + s.minutes, 0);
  const anyCommands = setup.stages.some((s) => s.commands?.length);

  return (
    <div className="space-y-5 [&_code]:[overflow-wrap:anywhere]" data-testid="lab-setup">
      <Demo title={t("setup.need.title")}>
        <p className="max-w-3xl text-sm leading-relaxed">{renderRich(t(k("summary")))}</p>
        <ul className="mt-3 flex flex-wrap gap-2" aria-label={t("setup.need.title")}>
          <Chip plain label={t("setup.chip.browser")} state={setup.needs.backend === "yes" ? "no" : "yes"} />
          <Chip label={t("setup.chip.python")} state={setup.needs.python} />
          <Chip label={t("setup.chip.backend")} state={setup.needs.backend} />
          <Chip label={t("setup.chip.database")} state={setup.needs.database} />
        </ul>
        {(setup.python || setup.node) && (
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {setup.python && (
              <div className="min-w-0">
                <h3 className="text-sm font-semibold">{t("setup.python.title")}: <span className="font-mono">{setup.python.version}</span></h3>
                <p className="mt-1 text-sm leading-relaxed text-muted">{renderRich(t(k("pynotes")))}</p>
                <dl className="mt-2 space-y-1.5 text-sm">
                  {setup.python.packages.map((p) => (
                    <div key={p.name} className="flex flex-wrap gap-x-2">
                      <dt className="font-mono text-[13px] font-semibold">{p.name}</dt>
                      <dd className="min-w-0 text-muted">{renderRich(t(k(`pkg.${p.name}`)))}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}
            {setup.node && (
              <div className="min-w-0">
                <h3 className="text-sm font-semibold">{t("setup.node.title")}: <span className="font-mono">{setup.node.version}</span></h3>
                <p className="mt-1 text-sm leading-relaxed text-muted">{renderRich(t(k("nodenote")))}</p>
              </div>
            )}
          </div>
        )}
      </Demo>

      <Demo title={t("setup.flow.title")}>
        <FlowDiagram lab={lab} />
        <p className="mt-3 text-xs text-muted">{t("setup.flow.legend")}</p>
      </Demo>

      <Demo title={t("setup.stages.title")}>
        {anyCommands && (
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <span className="text-sm text-muted" id="setup-os-label">{t("setup.os.label")}</span>
            <Seg<SetupOs>
              label={t("setup.os.label")}
              value={os}
              onChange={pickOs}
              options={(Object.keys(OS_LABEL) as SetupOs[]).map((v) => ({ value: v, label: OS_LABEL[v] }))}
            />
          </div>
        )}
        <ol className="space-y-5">
          {setup.stages.map((s, i) => (
            <li key={s.id} className="flex gap-3" data-testid="setup-stage" data-stage={s.id}>
              <span aria-hidden className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full border border-brand bg-brand/10 text-sm font-semibold text-brand">{i + 1}</span>
              <div className="min-w-0 flex-1 space-y-2">
                <h3 className="text-sm font-semibold leading-snug sm:text-base">
                  {t(k(`s.${s.id}.title`))}
                  {s.optional && <span className="chip ml-2 !py-0 align-middle">{t("setup.state.optional")}</span>}
                </h3>
                <p className="text-sm leading-relaxed text-muted">{renderRich(t(k(`s.${s.id}.body`)))}</p>
                {s.commands?.map((c) => <Command key={c.id} labId={lab.id} stageId={s.id} c={c} os={os} />)}
                {s.check && (
                  <p className="rounded-lg border border-ok/40 bg-ok/5 px-3 py-1.5 text-sm" data-testid="setup-check">
                    <b className="text-ok">✓ {t("setup.check")}</b>{" "}{renderRich(t(k(`s.${s.id}.check`)))}
                  </p>
                )}
              </div>
            </li>
          ))}
        </ol>
        {anyCommands && <Callout tone="warn" title={t("setup.honest.title")}>{t("setup.honest.body")}</Callout>}
      </Demo>

      <Demo title={t("setup.folders.title")}>
        <dl className="space-y-2 text-sm">
          {setup.folders.map((f) => (
            <div key={f.id} className="grid gap-x-3 gap-y-0.5 sm:grid-cols-[minmax(0,16rem)_minmax(0,1fr)]">
              <dt className="min-w-0 break-words font-mono text-[13px] font-semibold">{f.path}</dt>
              <dd className="min-w-0 text-muted">{renderRich(t(k(`f.${f.id}`)))}</dd>
            </div>
          ))}
        </dl>
      </Demo>

      {setup.data && setup.data.length > 0 && (
        <Demo title={t("setup.data.title")}>
          <ul className="space-y-3 text-sm">
            {setup.data.map((d) => (
              <li key={d.id} className="min-w-0">
                <p className="break-words"><span className="font-mono text-[13px] font-semibold">{d.name}</span>{" "}
                  <span className="chip !py-0">{d.auto ? t("setup.data.auto") : t("setup.data.manual")}</span>
                  {d.bytes !== undefined && <span className="chip ml-1 !py-0" data-testid="setup-size">{fmtBytes(d.bytes)}</span>}
                </p>
                <p className="mt-0.5 text-muted">{renderRich(t(k(`d.${d.id}.source`)))}</p>
              </li>
            ))}
          </ul>
          {setup.data.some((d) => d.bytes !== undefined) && <p className="mt-3 text-xs text-muted">{t("setup.data.sizeNote")}</p>}
        </Demo>
      )}

      <Demo title={t("setup.time.title")}>
        <ul className="list-disc space-y-1.5 pl-5 text-sm">
          <li>{t("setup.time.read", undefined, { n: lab.steps.length, m: minutes })}</li>
          {setup.timeFor?.map((x) => <li key={x.id} className="text-muted">{renderRich(t(k(`t.${x.id}`), undefined, x.vars))}</li>)}
        </ul>
      </Demo>

      <Demo title={t("setup.db.title")}>
        <p className="text-sm leading-relaxed text-muted">{renderRich(t(k("db")))}</p>
      </Demo>

      <Demo title={t("setup.trouble.title")}>
        <div className="space-y-2">
          {setup.troubleshooting.map((x) => (
            <details key={x.id} className="rounded-xl border border-line bg-raised/50 px-3 py-2">
              <summary className="cursor-pointer text-sm font-medium">{renderRich(t(k(`tr.${x.id}.p`)))}</summary>
              <p className="mt-1.5 text-sm leading-relaxed text-muted">{renderRich(t(k(`tr.${x.id}.f`)))}</p>
            </details>
          ))}
        </div>
      </Demo>
    </div>
  );
}

const cache = new WeakMap<Lab, LabStep>();

/** The extra first step of a lab with `setup` (same object every call, so React keeps its identity). */
function setupStep(lab: Lab): LabStep {
  let s = cache.get(lab);
  if (!s) {
    const Component: ComponentType = () => <LabSetupPanel lab={lab} />;
    s = {
      id: SETUP_STEP_ID,
      group: SETUP_GROUP,
      minutes: 5,
      title: "Setup & run",
      summary: "What you need and how to run it, from Python to the browser.",
      Component,
    };
    cache.set(lab, s);
  }
  return s;
}

/** The lab's steps as the shell shows them: the setup guide first when the lab declares one. */
export function labSteps(lab: Lab): LabStep[] {
  if (!lab.setup || lab.steps.some((s) => s.id === SETUP_STEP_ID)) return lab.steps;
  return [setupStep(lab), ...lab.steps];
}

/** The step a bare `/labs/:labId` opens: the first lesson (the setup guide is one click away in the stepper). */
export const firstLessonId = (lab: Lab) => lab.steps[0]?.id ?? SETUP_STEP_ID;
