import { useId, useState } from "react";
import { useNukeTuneStore } from "~/store";
import { useIntune } from "~/hooks/useIntune";
import type { CategoryState, DangerLevel } from "~/types/intune";
import { CategoryCard } from "./CategoryCard";
import {
  getBulkToggleIds,
  groupBySeverity,
  isSelectableCategory,
  matchesCategoryQuery,
} from "./categoryFilter";

const severityStyles: Record<
  DangerLevel,
  { label: string; text: string; dot: string; rule: string }
> = {
  critical: {
    label: "Critical",
    text: "text-[var(--critical-red)]",
    dot: "bg-[var(--critical-red)] shadow-[0_0_8px_var(--critical-red-glow)]",
    rule: "bg-[var(--critical-red)]/20",
  },
  high: {
    label: "High",
    text: "text-[var(--high-orange)]",
    dot: "bg-[var(--high-orange)] shadow-[0_0_8px_var(--high-orange-glow)]",
    rule: "bg-[var(--high-orange)]/20",
  },
  medium: {
    label: "Medium",
    text: "text-[var(--medium-amber)]",
    dot: "bg-[var(--medium-amber)] shadow-[0_0_8px_var(--medium-amber-glow)]",
    rule: "bg-[var(--medium-amber)]/20",
  },
  low: {
    label: "Low",
    text: "text-[var(--low-green)]",
    dot: "bg-[var(--low-green)] shadow-[0_0_8px_var(--low-green-glow)]",
    rule: "bg-[var(--low-green)]/20",
  },
};

const sectionActionClass =
  "rounded px-2 py-1 text-xs font-medium uppercase tracking-wider text-[var(--text-dim)] transition-colors hover:bg-white/5 hover:text-white disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent";

export function CategorySelector() {
  const categories = useNukeTuneStore((state) => state.categories);
  const toggleCategory = useNukeTuneStore((state) => state.toggleCategory);
  const selectAll = useNukeTuneStore((state) => state.selectAllCategories);
  const deselectAll = useNukeTuneStore((state) => state.deselectAllCategories);
  const { loadCategoryObjects } = useIntune();
  const [query, setQuery] = useState("");
  const [collapsed, setCollapsed] = useState<Partial<Record<DangerLevel, boolean>>>({});
  const idPrefix = useId();

  const selectedCount = categories.filter((c) => c.selected).length;
  const searching = query.trim().length > 0;
  const visible = categories.filter((cat) => matchesCategoryQuery(cat, query));
  const sections = groupBySeverity(visible).filter((section) => section.items.length > 0);

  const loadIfNeeded = (cat: CategoryState) => {
    if (isSelectableCategory(cat) && !cat.loaded && !cat.loading) {
      void loadCategoryObjects(cat.category);
    }
  };

  const handleToggle = (categoryId: string) => {
    const cat = categories.find((c) => c.category.id === categoryId);
    if (!cat || !isSelectableCategory(cat)) return;
    if (!cat.selected) loadIfNeeded(cat);
    toggleCategory(categoryId);
  };

  const handleSetSection = (items: CategoryState[], selected: boolean) => {
    for (const id of getBulkToggleIds(items, selected)) handleToggle(id);
  };

  const handleSelectAll = () => {
    selectAll();
    categories.forEach(loadIfNeeded);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span className="text-xs font-medium uppercase tracking-wider text-[var(--danger-red)]">
            {"//"} TARGET SELECTION
          </span>
          <h2 className="font-display mt-1 text-xl font-bold text-white">
            Select Categories to Delete
          </h2>
          <p className="mt-1 text-sm text-[var(--text-dim)]">
            {selectedCount} of {categories.length} categories selected
          </p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={handleSelectAll} className="btn-terminal flex-1 text-xs sm:flex-none">
            Select All
          </button>
          <button type="button" onClick={deselectAll} className="btn-terminal flex-1 text-xs sm:flex-none">
            Deselect All
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <label htmlFor={`${idPrefix}-search`} className="sr-only">
          Filter categories
        </label>
        <svg
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11a6 6 0 11-12 0 6 6 0 0112 0z" />
        </svg>
        <input
          id={`${idPrefix}-search`}
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Filter categories (e.g. scripts)"
          className="input-terminal pl-9"
          autoComplete="off"
        />
        {searching && (
          <p className="mt-2 text-xs text-[var(--text-dim)]" aria-live="polite">
            {visible.length} of {categories.length} categories match
          </p>
        )}
      </div>

      {sections.length === 0 && (
        <div className="console-panel p-6 text-center text-sm text-[var(--text-dim)]">
          No categories match &ldquo;{query.trim()}&rdquo;.{" "}
          <button
            type="button"
            onClick={() => setQuery("")}
            className="text-[var(--warning-amber)] underline underline-offset-2 hover:text-white"
          >
            Clear filter
          </button>
        </div>
      )}

      {sections.map(({ level, items }) => {
        const styles = severityStyles[level];
        const isOpen = searching || !collapsed[level];
        const panelId = `${idPrefix}-${level}`;
        const selectedHere = items.filter((c) => c.selected).length;
        const selectable = items.filter(isSelectableCategory);
        const allSelected = selectable.every((c) => c.selected);
        const noneSelected = selectable.every((c) => !c.selected);

        return (
          <section key={level} aria-labelledby={`${panelId}-heading`}>
            <div className="mb-3 flex items-center gap-2">
              {/* Disclosure pattern: the heading wraps the button. A button may
                  only contain phrasing content, so the heading cannot go inside it. */}
              <h3 className="m-0 flex min-w-0">
              <button
                type="button"
                onClick={() => setCollapsed((prev) => ({ ...prev, [level]: !prev[level] }))}
                aria-expanded={isOpen}
                aria-controls={panelId}
                disabled={searching}
                className="-ml-1 flex min-w-0 items-center gap-2 rounded px-1 py-1 text-left disabled:cursor-default"
              >
                <svg
                  className={`h-3.5 w-3.5 shrink-0 text-[var(--text-dim)] transition-transform ${isOpen ? "rotate-90" : ""}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                </svg>
                <span className={`h-2 w-2 shrink-0 rounded-full ${styles.dot}`} />
                <span
                  id={`${panelId}-heading`}
                  className={`font-display text-sm font-semibold uppercase tracking-wider ${styles.text}`}
                >
                  {styles.label}
                </span>
                <span className="font-mono text-xs font-normal text-[var(--text-dim)]">
                  {selectedHere}/{items.length}
                </span>
              </button>
              </h3>
              <div className={`h-px min-w-4 flex-1 ${styles.rule}`} />
              <div className="flex shrink-0 items-center">
                <button
                  type="button"
                  onClick={() => handleSetSection(items, true)}
                  disabled={allSelected}
                  className={sectionActionClass}
                  aria-label={`Select all ${searching ? "matching " : ""}${styles.label.toLowerCase()} categories`}
                >
                  All
                </button>
                <span className="text-[var(--text-muted)]" aria-hidden="true">/</span>
                <button
                  type="button"
                  onClick={() => handleSetSection(items, false)}
                  disabled={noneSelected}
                  className={sectionActionClass}
                  aria-label={`Deselect all ${searching ? "matching " : ""}${styles.label.toLowerCase()} categories`}
                >
                  None
                </button>
              </div>
            </div>
            <div id={panelId} hidden={!isOpen} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((cat) => (
                <CategoryCard
                  key={cat.category.id}
                  categoryState={cat}
                  onToggle={() => handleToggle(cat.category.id)}
                />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
