import { useShallow } from "zustand/react/shallow";
import { useNukeTuneStore } from "~/store";
import { summarizeSelection } from "./categoryFilter";

/**
 * Fixed bar at the bottom of the dashboard that keeps the selection summary
 * and the "Preview Deletion" action in reach however far the category list
 * is scrolled. The page must reserve bottom padding so it never covers the
 * last cards.
 */
export function SelectionActionBar() {
  const openPreview = useNukeTuneStore((state) => state.openPreview);
  const { selectedCount, criticalCount, objectCount, loadingCount } = useNukeTuneStore(
    useShallow((state) => summarizeSelection(state.categories)),
  );
  const hasSelection = selectedCount > 0;

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-30 border-t border-[var(--console-border)] bg-[var(--console-dark)]/95 backdrop-blur-xl"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3">
        <div className="min-w-0 flex-1 text-xs" aria-live="polite">
          {hasSelection ? (
            <>
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <span className="font-medium text-white">
                  <span className="font-mono">{selectedCount}</span>{" "}
                  {selectedCount === 1 ? "category" : "categories"}
                </span>
                {criticalCount > 0 && (
                  <span className="badge badge-critical px-1.5 py-0.5">
                    {criticalCount} critical
                  </span>
                )}
              </div>
              <div className="mt-0.5 text-[var(--text-dim)]">
                <span className="font-mono text-[var(--terminal-green)]">
                  {objectCount.toLocaleString()}
                </span>{" "}
                object{objectCount !== 1 ? "s" : ""} loaded
                {loadingCount > 0 && (
                  <span className="text-[var(--text-muted)]"> · {loadingCount} loading…</span>
                )}
              </div>
            </>
          ) : (
            <span className="text-[var(--text-dim)]">
              Select at least one category to preview a deletion.
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={openPreview}
          disabled={!hasSelection}
          className="btn-danger shrink-0 rounded-lg px-4 py-3 sm:px-8"
        >
          <span className="flex items-center gap-2">
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
              />
            </svg>
            Preview
            <span className="hidden sm:inline">Deletion</span>
          </span>
        </button>
      </div>
    </div>
  );
}
