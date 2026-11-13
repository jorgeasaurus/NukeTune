import { useShallow } from "zustand/react/shallow";
import { useNukeTuneStore, useDeletionStats } from "~/store";
import { useIntune } from "~/hooks/useIntune";
import { sortByDeletionOrder } from "~/lib/intune/deletionOrder";
import { countRetryableFailures } from "~/utils/deletionRun";
import { CategoryRunProgress } from "./CategoryRunProgress";
import { DeletionLog } from "./DeletionLog";

export function DeletionProgress() {
  const deletionPhase = useNukeTuneStore((state) => state.deletionPhase);
  const isPaused = useNukeTuneStore((state) => state.isPaused);
  const pauseDeletion = useNukeTuneStore((state) => state.pauseDeletion);
  const resumeDeletion = useNukeTuneStore((state) => state.resumeDeletion);
  const cancelDeletion = useNukeTuneStore((state) => state.cancelDeletion);
  const closePreview = useNukeTuneStore((state) => state.closePreview);
  const reset = useNukeTuneStore((state) => state.reset);
  const shouldCancel = useNukeTuneStore((state) => state.shouldCancel);
  // Only categories that had objects queued in this run, in deletion order.
  const runCategories = useNukeTuneStore(
    useShallow((state) =>
      sortByDeletionOrder(
        state.categories.filter((cat) => cat.runTotal > 0),
        (cat) => cat.category.id
      )
    )
  );
  const retryableCount = useNukeTuneStore((state) => countRetryableFailures(state.categories));
  const stats = useDeletionStats();
  const { exportLog, retryFailed } = useIntune();

  const isDeleting = deletionPhase === "deleting" || deletionPhase === "confirming";
  const isComplete = deletionPhase === "complete";
  const wasCancelled = isComplete && shouldCancel;

  const overallProgress =
    stats.totalObjects > 0
      ? ((stats.totalDeleted + stats.totalFailed + stats.totalSkipped) / stats.totalObjects) * 100
      : 0;

  const handleClose = () => {
    if (isDeleting && !isPaused) {
      return;
    }
    reset();
    closePreview();
  };

  if (deletionPhase !== "deleting" && deletionPhase !== "confirming" && deletionPhase !== "complete") {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="deletion-progress-title"
        className="console-modal flex max-h-[90vh] w-full max-w-4xl flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--console-border)] p-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className={`status-dot ${isComplete ? "status-dot-active" : "status-dot-danger"}`} />
              <span className="text-xs font-medium uppercase tracking-wider text-[var(--text-dim)]">
                {wasCancelled
                  ? "Operation Cancelled"
                  : isComplete
                    ? "Operation Complete"
                    : isPaused
                      ? "Paused"
                      : "Executing"}
              </span>
            </div>
            <h2 id="deletion-progress-title" className="font-display text-2xl font-bold text-white">
              {wasCancelled ? "Deletion Cancelled" : isComplete ? "Deletion Complete" : "Deleting Objects..."}
            </h2>
          </div>
          {isComplete && (
            <button
              type="button"
              onClick={handleClose}
              className="btn-terminal rounded-lg p-2"
              aria-label="Close"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}
        </div>

        {/* Content: progress and counts, then the log (where errors show) above
            the fold; per-category detail is collapsed below it. */}
        <div className="flex-1 overflow-auto p-4 sm:p-6">
          {/* Overall Progress */}
          <div className="mb-4 sm:mb-6">
            <div className="mb-2 flex justify-between text-xs uppercase tracking-wider">
              <span className="text-[var(--text-dim)]">Overall Progress</span>
              <span className="font-mono font-medium text-white">{Math.round(overallProgress)}%</span>
            </div>
            <div className="progress-bar h-3">
              <div
                className={`progress-bar-fill ${isComplete ? "" : "progress-bar-fill-danger"}`}
                style={{ width: `${overallProgress}%` }}
              />
            </div>
          </div>

          {/* Stats Cards: deleted green, failed red, skipped amber, remaining neutral */}
          <dl className="mb-4 grid grid-cols-2 gap-3 sm:mb-6 sm:grid-cols-4 sm:gap-4">
            {[
              { label: "Deleted", value: stats.totalDeleted, color: "text-[var(--terminal-green)]", border: "" },
              {
                label: "Failed",
                value: stats.totalFailed,
                color: "text-[var(--critical-red)]",
                border: stats.totalFailed > 0 ? "border-[var(--critical-red)]/60" : "",
              },
              { label: "Skipped", value: stats.totalSkipped, color: "text-[var(--warning-amber)]", border: "" },
              { label: "Remaining", value: stats.totalRemaining, color: "text-[var(--text-dim)]", border: "" },
            ].map((tile) => (
              <div
                key={tile.label}
                className={`console-panel flex flex-col-reverse rounded-xl p-3 text-center sm:p-4 ${tile.border}`}
              >
                <dt className="mt-1 text-xs uppercase tracking-wider text-[var(--text-dim)]">
                  {tile.label}
                </dt>
                <dd className={`font-mono text-2xl font-bold sm:text-3xl ${tile.color}`}>
                  {tile.value.toLocaleString()}
                </dd>
              </div>
            ))}
          </dl>

          <DeletionLog className="mb-4 h-60 sm:mb-6 sm:h-64" />

          <CategoryRunProgress categories={runCategories} />
        </div>

        {/* Footer: primary action full-width on mobile, grouped on desktop */}
        <div className="border-t border-[var(--console-border)] p-4 sm:p-6">
          <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center sm:gap-3 [&>button]:min-h-11 [&>button]:whitespace-nowrap">
            {isDeleting && !isComplete && (
              <>
                {isPaused ? (
                  <button
                    type="button"
                    onClick={resumeDeletion}
                    className="btn-success col-span-2 sm:col-span-1"
                  >
                    Resume
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={pauseDeletion}
                    className="btn-warning col-span-2 sm:col-span-1"
                  >
                    Pause
                  </button>
                )}
                <button type="button" onClick={cancelDeletion} className="btn-terminal sm:mr-auto">
                  Cancel
                </button>
              </>
            )}
            {isComplete && (
              <button
                type="button"
                onClick={handleClose}
                className="btn-success col-span-2 sm:order-last sm:col-span-1"
              >
                Done
              </button>
            )}
            <button
              type="button"
              onClick={exportLog}
              className={`btn-terminal ${
                isComplete ? `sm:ml-auto ${retryableCount > 0 ? "" : "col-span-2 sm:col-span-1"}` : ""
              }`}
            >
              <span className="sm:hidden">Export CSV</span>
              <span className="hidden sm:inline">Export Log (CSV)</span>
            </button>
            {isComplete && retryableCount > 0 && (
              <button
                type="button"
                onClick={() => void retryFailed()}
                className="btn-warning"
              >
                <span className="sm:hidden">Retry ({retryableCount})</span>
                <span className="hidden sm:inline">Retry failed ({retryableCount})</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
