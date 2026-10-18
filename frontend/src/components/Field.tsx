import type { ReactNode } from "react";

interface Props {
  id: string;
  label: string;
  help: string;
  error?: string;
  children: ReactNode;
}

/** Labelled control with a beginner-friendly explanation and inline validation message. */
export function Field({ id, label, help, error, children }: Props) {
  return (
    <div>
      <label htmlFor={id} className="label" title={help}>
        {label}
      </label>
      {children}
      {error ? (
        <p id={`${id}-err`} role="alert" className="mt-1 text-xs text-bad">
          {error}
        </p>
      ) : (
        <p id={`${id}-help`} className="mt-1 text-xs leading-snug text-muted">
          {help}
        </p>
      )}
    </div>
  );
}
