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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="glass-modal flex max-h-[90vh] w-full max-w-4xl flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 p-6">
          <div>
            <h2 className="text-2xl font-bold text-gradient">
              {isComplete ? "Deletion Complete" : "Deleting Objects..."}
            </h2>
            <p className="mt-1 text-sm text-gray-400">
              {isComplete
                ? `Processed ${stats.totalDeleted + stats.totalFailed} objects`
                : isPaused
                  ? "Deletion paused"
                  : "Please wait while objects are being deleted"}
            </p>
          </div>
          {isComplete && (
            <button
              onClick={handleClose}
              className="rounded-lg p-2 text-gray-400 transition-all duration-200 hover:bg-white/5 hover:text-white"
            >
              <svg
                className="h-6 w-6"
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
            <div className="mb-2 flex justify-between text-sm">
              <span className="text-gray-400">Overall Progress</span>
              <span className="font-medium text-white">{Math.round(overallProgress)}%</span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-white/5 backdrop-blur-sm">
              <div
                className={`h-full transition-all duration-500 ease-out ${
                  isComplete
                    ? "bg-gradient-to-r from-green-500 to-emerald-400"
                    : "bg-gradient-to-r from-blue-500 to-cyan-400"
                }`}
                style={{ width: `${overallProgress}%` }}
              />
            </div>
          </div>

          {/* Stats Cards */}
          <div className="mb-6 grid grid-cols-3 gap-4">
            <div className="glass glass-hover rounded-xl p-4 text-center">
              <div className="text-3xl font-bold text-green-400">
                {stats.totalDeleted}
              </div>
              <div className="text-sm text-gray-400">Deleted</div>
            </div>
            <div className="glass glass-hover rounded-xl p-4 text-center">
              <div className="text-3xl font-bold text-red-400">
                {stats.totalFailed}
              </div>
              <div className="text-sm text-gray-400">Failed</div>
            </div>
            <div className="glass glass-hover rounded-xl p-4 text-center">
              <div className="text-3xl font-bold text-gray-300">
                {stats.totalObjects - stats.totalDeleted - stats.totalFailed}
              </div>
              <div className="text-sm text-gray-400">Remaining</div>
            </div>
          </div>

          {/* Category Progress */}
          <div className="glass mb-6 space-y-3 rounded-xl p-4">
            <h3 className="text-sm font-medium text-gray-300">Category Progress</h3>
            {selectedCategories.map((cat) => {
              const progress =
                cat.objects.length > 0
                  ? ((cat.deletedCount + cat.failedCount) / cat.objects.length) * 100
                  : 0;
              return (
                <div key={cat.category.id}>
                  <div className="mb-1 flex justify-between text-xs">
                    <span className="text-gray-400">{cat.category.name}</span>
                    <span className="text-gray-500">
                      {cat.deletedCount + cat.failedCount}/{cat.objects.length}
                    </span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-white/5">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all duration-300"
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
        <div className="border-t border-white/10 p-6">
          <div className="flex justify-between">
            <div className="flex gap-3">
              {isDeleting && !isComplete && (
                <>
                  {isPaused ? (
                    <button
                      onClick={resumeDeletion}
                      className="rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 px-5 py-2.5 font-medium text-white shadow-lg shadow-blue-500/20 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-blue-500/30"
                    >
                      Resume
                    </button>
                  ) : (
                    <button
                      onClick={pauseDeletion}
                      className="rounded-xl border border-yellow-500/30 bg-yellow-500/10 px-5 py-2.5 font-medium text-yellow-400 backdrop-blur-sm transition-all duration-300 hover:border-yellow-500/50 hover:bg-yellow-500/20"
                    >
                      Pause
                    </button>
                  )}
                  <button
                    onClick={cancelDeletion}
                    className="rounded-xl border border-red-500/30 bg-red-500/10 px-5 py-2.5 font-medium text-red-400 backdrop-blur-sm transition-all duration-300 hover:border-red-500/50 hover:bg-red-500/20"
                  >
                    Cancel
                  </button>
                </>
              )}
            </div>
            <div className="flex gap-3">
              <button
                onClick={exportLog}
                className="glass-button"
              >
                Export Log (CSV)
              </button>
              {isComplete && (
                <button
                  onClick={handleClose}
                  className="rounded-xl bg-gradient-to-r from-gray-600 to-gray-700 px-6 py-2.5 font-medium text-white shadow-lg transition-all duration-300 hover:-translate-y-0.5 hover:from-gray-500 hover:to-gray-600"
                >
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
