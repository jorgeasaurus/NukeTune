import { useNukeTuneStore, useSelectedCategories, useDeletionStats } from "~/store";
import { useIntune } from "~/hooks/useIntune";
import { DeletionLog } from "./DeletionLog";

export function DeletionProgress() {
  const deletionPhase = useNukeTuneStore((state) => state.deletionPhase);
  const isPaused = useNukeTuneStore((state) => state.isPaused);
  const pauseDeletion = useNukeTuneStore((state) => state.pauseDeletion);
  const resumeDeletion = useNukeTuneStore((state) => state.resumeDeletion);
  const cancelDeletion = useNukeTuneStore((state) => state.cancelDeletion);
  const closePreview = useNukeTuneStore((state) => state.closePreview);
  const reset = useNukeTuneStore((state) => state.reset);
  const selectedCategories = useSelectedCategories();
  const stats = useDeletionStats();
  const { exportLog } = useIntune();

  const isDeleting = deletionPhase === "deleting" || deletionPhase === "confirming";
  const isComplete = deletionPhase === "complete";

  const overallProgress =
    stats.totalObjects > 0
      ? ((stats.totalDeleted + stats.totalFailed) / stats.totalObjects) * 100
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
      <div className="console-modal flex max-h-[90vh] w-full max-w-4xl flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--console-border)] p-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className={`status-dot ${isComplete ? "status-dot-active" : "status-dot-danger"}`} />
              <span className="text-xs font-medium uppercase tracking-wider text-[var(--text-dim)]">
                {isComplete ? "Operation Complete" : isPaused ? "Paused" : "Executing"}
              </span>
            </div>
            <h2 className="font-display text-2xl font-bold text-white">
              {isComplete ? "Deletion Complete" : "Deleting Objects..."}
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

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {/* Overall Progress */}
          <div className="mb-6">
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

          {/* Stats Cards */}
          <div className="mb-6 grid grid-cols-3 gap-4">
            <div className="console-panel rounded-xl p-4 text-center">
              <div className="font-mono text-3xl font-bold text-[var(--terminal-green)]">
                {stats.totalDeleted}
              </div>
              <div className="mt-1 text-xs uppercase tracking-wider text-[var(--text-dim)]">Deleted</div>
            </div>
            <div className="console-panel rounded-xl p-4 text-center">
              <div className="font-mono text-3xl font-bold text-[var(--danger-red)]">
                {stats.totalFailed}
              </div>
              <div className="mt-1 text-xs uppercase tracking-wider text-[var(--text-dim)]">Failed</div>
            </div>
            <div className="console-panel rounded-xl p-4 text-center">
              <div className="font-mono text-3xl font-bold text-[var(--text-dim)]">
                {stats.totalObjects - stats.totalDeleted - stats.totalFailed}
              </div>
              <div className="mt-1 text-xs uppercase tracking-wider text-[var(--text-dim)]">Remaining</div>
            </div>
          </div>

          {/* Category Progress */}
          <div className="console-panel mb-6 space-y-3 rounded-xl p-4">
            <h3 className="text-xs font-medium uppercase tracking-wider text-[var(--text-dim)]">
              Category Progress
            </h3>
            {selectedCategories.map((cat) => {
              const progress =
                cat.objects.length > 0
                  ? ((cat.deletedCount + cat.failedCount) / cat.objects.length) * 100
                  : 0;
              return (
                <div key={cat.category.id}>
                  <div className="mb-1 flex justify-between text-xs">
                    <span className="text-[var(--text-dim)]">{cat.category.name}</span>
                    <span className="font-mono text-[var(--text-muted)]">
                      {cat.deletedCount + cat.failedCount}/{cat.objects.length}
                    </span>
                  </div>
                  <div className="progress-bar h-1.5">
                    <div
                      className="progress-bar-fill"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <DeletionLog />
        </div>

        {/* Footer */}
        <div className="border-t border-[var(--console-border)] p-6">
          <div className="flex justify-between">
            <div className="flex gap-3">
              {isDeleting && !isComplete && (
                <>
                  {isPaused ? (
                    <button type="button" onClick={resumeDeletion} className="btn-success">
                      Resume
                    </button>
                  ) : (
                    <button type="button" onClick={pauseDeletion} className="btn-warning">
                      Pause
                    </button>
                  )}
                  <button type="button" onClick={cancelDeletion} className="btn-terminal">
                    Cancel
                  </button>
                </>
              )}
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={exportLog} className="btn-terminal">
                Export Log (CSV)
              </button>
              {isComplete && (
                <button type="button" onClick={handleClose} className="btn-success">
                  Done
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
