import { useRef, useEffect } from "react";
import { useNukeTuneStore } from "~/store";

export function DeletionLog() {
  const deletionLog = useNukeTuneStore((state) => state.deletionLog);
  const logContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [deletionLog]);

  const statusColors = {
    success: "text-[var(--terminal-green)]",
    error: "text-[var(--danger-red)]",
    skipped: "text-[var(--warning-amber)]",
  };

  return (
    <div>
      <h3 className="mb-3 text-xs font-medium uppercase tracking-wider text-[var(--text-dim)]">
        Activity Log
      </h3>
      <div
        ref={logContainerRef}
        className="console-panel h-48 overflow-auto rounded-lg p-4 font-mono text-xs"
      >
        {deletionLog.length === 0 ? (
          <div className="flex h-full items-center justify-center text-[var(--text-muted)]">
            <span className="text-[var(--terminal-green)]">$</span>
            <span className="ml-2">Waiting for operations...</span>
            <span className="cursor-blink" />
          </div>
        ) : (
          deletionLog.map((entry, index) => (
            <div key={index} className="mb-1.5 flex gap-2">
              <span className="text-[var(--text-muted)]">
                {entry.timestamp.toLocaleTimeString()}
              </span>
              <span className={statusColors[entry.status]}>
                {entry.status === "success" ? "[OK]" : entry.status === "error" ? "[ERR]" : "[SKIP]"}
              </span>
              <span className="text-[var(--text-dim)]">[{entry.categoryName}]</span>
              <span className="text-white">{entry.objectName}</span>
              {entry.message && (
                <span className="text-[var(--text-muted)]">- {entry.message}</span>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
