interface Props {
  message: string | null;
  onDismiss?: () => void;
  onRetry?: () => void;
  title?: string;
}

export function ErrorMessage({ message, onDismiss, onRetry, title = "Something went wrong" }: Props) {
  if (!message) return null;
  return (
    <div
      role="alert"
      className="flex items-start gap-3 rounded-xl border border-bad/40 bg-bad/10 p-3 text-sm text-ink"
    >
      <span aria-hidden className="mt-0.5 text-bad">⚠</span>
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-bad">{title}</p>
        <p className="break-words text-muted">{message}</p>
      </div>
      <div className="flex shrink-0 gap-2">
        {onRetry && (
          <button className="btn-ghost !py-1" onClick={onRetry}>
            Retry
          </button>
        )}
        {onDismiss && (
          <button className="btn-ghost !py-1" onClick={onDismiss} aria-label="Dismiss error">
            Dismiss
          </button>
        )}
      </div>
    </div>
  );
}
