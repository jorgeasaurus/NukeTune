import { useId, useState } from "react";
import type { CategoryState } from "~/types/intune";
import { getProcessedCount } from "~/utils/deletionRun";
import { getRunSegments, summarizeRunCategories } from "./runSummary";

/**
 * Per-category progress for a run, collapsed to a one-line summary by default
 * so the activity log (where errors appear) stays above the fold.
 */
export function CategoryRunProgress({ categories }: { categories: CategoryState[] }) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const { total, finished, withFailures } = summarizeRunCategories(categories);

  return (
    <div className="console-panel rounded-xl">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-controls={panelId}
        className="flex w-full items-center gap-2 rounded-xl px-4 py-3 text-left"
      >
        <svg
          className={`h-3.5 w-3.5 shrink-0 text-[var(--text-dim)] transition-transform ${open ? "rotate-90" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
        </svg>
        <span className="text-xs font-medium uppercase tracking-wider text-[var(--text-dim)]">
          Category Progress
        </span>
        <span className="ml-auto text-right font-mono text-xs text-[var(--text-dim)]">
          {finished}/{total} done
          {withFailures > 0 && (
            <span className="text-[var(--critical-red)]"> · {withFailures} with failures</span>
          )}
        </span>
      </button>

      <ul id={panelId} hidden={!open} className="space-y-3 px-4 pb-4">
        {categories.map((cat) => {
          const seg = getRunSegments(cat);
          return (
            <li key={cat.category.id}>
              <div className="mb-1 flex flex-wrap justify-between gap-x-3 text-xs">
                <span className="text-[var(--text-dim)]">{cat.category.name}</span>
                <span className="font-mono text-[var(--text-dim)]">
                  {getProcessedCount(cat)}/{cat.runTotal}
                  {cat.failedCount > 0 && (
                    <span className="text-[var(--critical-red)]"> · {cat.failedCount} failed</span>
                  )}
                  {cat.skippedCount > 0 && (
                    <span className="text-[var(--warning-amber)]"> · {cat.skippedCount} skipped</span>
                  )}
                </span>
              </div>
              <div className="progress-bar flex h-1.5" aria-hidden="true">
                <div className="progress-bar-fill" style={{ width: `${seg.deleted}%` }} />
                <div className="h-full bg-[var(--critical-red)]" style={{ width: `${seg.failed}%` }} />
                <div className="h-full bg-[var(--warning-amber)]" style={{ width: `${seg.skipped}%` }} />
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
