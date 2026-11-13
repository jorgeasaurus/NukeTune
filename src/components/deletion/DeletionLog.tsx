import { memo, useCallback, useLayoutEffect, useRef, useState } from "react";
import { useNukeTuneStore } from "~/store";
import type { DeletionLogEntry } from "~/types/intune";
import { getLogWindow, isScrolledToBottom } from "./logWindow";

const statusTag: Record<DeletionLogEntry["status"], { label: string; className: string }> = {
  success: { label: "[OK]", className: "text-[var(--terminal-green)]" },
  error: { label: "[ERR]", className: "font-bold text-[var(--critical-red)]" },
  skipped: { label: "[SKIP]", className: "text-[var(--warning-amber)]" },
};

/** One log line. Entries are immutable, so memo skips every existing row on append. */
const LogRow = memo(function LogRow({ entry }: { entry: DeletionLogEntry }) {
  const tag = statusTag[entry.status];
  const isError = entry.status === "error";
  return (
    <li
      className={`border-l-2 py-1 pl-2 ${
        isError ? "border-[var(--critical-red)] bg-[var(--critical-red)]/5" : "border-transparent"
      }`}
    >
      <div className="flex flex-wrap items-baseline gap-x-2">
        <span className="text-[var(--text-muted)]">{entry.timestamp.toLocaleTimeString()}</span>
        <span className={tag.className}>{tag.label}</span>
        <span className="text-[var(--text-dim)]">[{entry.categoryName}]</span>
        <span className="min-w-0 break-words text-white [overflow-wrap:anywhere]">
          {entry.objectName}
        </span>
      </div>
      {entry.message && (
        <p
          className={`mt-0.5 whitespace-pre-wrap break-words [overflow-wrap:anywhere] ${
            isError ? "text-white/85" : "text-[var(--text-dim)]"
          }`}
        >
          {entry.message}
        </p>
      )}
    </li>
  );
});

export function DeletionLog({ className = "" }: { className?: string }) {
  const deletionLog = useNukeTuneStore((state) => state.deletionLog);
  const [errorsOnly, setErrorsOnly] = useState(false);
  const logContainerRef = useRef<HTMLDivElement>(null);
  // Follow new entries only while the user is already at the bottom.
  const followRef = useRef(true);

  const { rows, matchingCount, errorCount } = getLogWindow(deletionLog, { errorsOnly });
  const hiddenCount = matchingCount - rows.length;

  const handleScroll = useCallback(() => {
    const el = logContainerRef.current;
    if (el) followRef.current = isScrolledToBottom(el);
  }, []);

  useLayoutEffect(() => {
    const el = logContainerRef.current;
    if (el && followRef.current) el.scrollTop = el.scrollHeight;
  }, [deletionLog, errorsOnly]);

  const toggleErrorsOnly = () => {
    followRef.current = true;
    setErrorsOnly((value) => !value);
  };

  return (
    <div className={`flex min-h-0 flex-col ${className}`}>
      <div className="mb-2 flex items-center justify-between gap-3">
        <h3 className="text-xs font-medium uppercase tracking-wider text-[var(--text-dim)]">
          Activity Log
          <span className="ml-2 font-mono normal-case tracking-normal text-[var(--text-muted)]">
            {deletionLog.length.toLocaleString()}
          </span>
        </h3>
        <button
          type="button"
          onClick={toggleErrorsOnly}
          aria-pressed={errorsOnly}
          disabled={errorCount === 0 && !errorsOnly}
          className={`rounded-md border px-2.5 py-1 text-xs font-medium uppercase tracking-wider transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
            errorsOnly
              ? "border-[var(--critical-red)] bg-[var(--critical-red)]/15 text-[var(--critical-red)]"
              : "border-[var(--console-border)] text-[var(--text-dim)] hover:border-white/20 hover:text-white"
          }`}
        >
          Errors only ({errorCount.toLocaleString()})
        </button>
      </div>
      <div
        ref={logContainerRef}
        onScroll={handleScroll}
        tabIndex={0}
        aria-label="Activity log"
        className="console-panel min-h-40 flex-1 overflow-auto rounded-lg p-3 font-mono text-xs leading-relaxed"
      >
        {hiddenCount > 0 && (
          <p className="mb-2 border-b border-[var(--console-border)] pb-2 text-[var(--text-dim)]">
            Showing the last {rows.length.toLocaleString()} of {matchingCount.toLocaleString()}{" "}
            {errorsOnly ? "errors" : "entries"} — export the CSV for the full log.
          </p>
        )}
        {rows.length === 0 ? (
          <div className="flex h-full min-h-24 items-center justify-center text-[var(--text-muted)]">
            {errorsOnly ? (
              <span>No errors.</span>
            ) : (
              <>
                <span className="text-[var(--terminal-green)]">$</span>
                <span className="ml-2">Waiting for operations...</span>
                <span className="cursor-blink" />
              </>
            )}
          </div>
        ) : (
          <ol className="space-y-0.5">
            {rows.map(({ key, entry }) => (
              <LogRow key={key} entry={entry} />
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}
