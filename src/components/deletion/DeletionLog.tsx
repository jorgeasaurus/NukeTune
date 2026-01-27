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
    success: "text-green-400",
    error: "text-red-400",
    skipped: "text-yellow-400",
  };

  const statusIcons = {
    success: "✓",
    error: "✗",
    skipped: "○",
  };

  return (
    <div>
      <h3 className="mb-3 text-sm font-medium text-gray-300">Activity Log</h3>
      <div
        ref={logContainerRef}
        className="glass h-48 overflow-auto rounded-xl p-4 font-mono text-xs"
      >
        {deletionLog.length === 0 ? (
          <div className="flex h-full items-center justify-center text-gray-500">
            Waiting for operations...
          </div>
        ) : (
          deletionLog.map((entry, index) => (
            <div key={index} className="mb-1.5 flex gap-2">
              <span className="text-gray-500">
                {entry.timestamp.toLocaleTimeString()}
              </span>
              <span className={statusColors[entry.status]}>
                {statusIcons[entry.status]}
              </span>
              <span className="text-gray-400">[{entry.categoryName}]</span>
              <span className="text-gray-200">{entry.objectName}</span>
              {entry.message && (
                <span className="text-gray-500">- {entry.message}</span>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
