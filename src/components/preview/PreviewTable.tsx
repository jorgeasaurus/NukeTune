import { useState, useMemo } from "react";
import type { CategoryState, IntuneObject } from "~/types/intune";
import { useNukeTuneStore } from "~/store";
import {
  filterVisibleObjects,
  getObjectSelectionTargets,
  isSelectableObject,
} from "~/utils/objectSelection";
import { getObjectDisplayName, getObjectType } from "~/utils/objectDisplay";
import {
  applyQuickFilters,
  EMPTY_QUICK_FILTERS,
  hasActiveQuickFilter,
  isHydrationKitObject,
  type NameMatchMode,
  type QuickFilters,
} from "~/utils/quickFilters";
import { DEFAULT_PAGE_SIZE, paginate } from "~/utils/pagination";

interface PreviewTableProps {
  categories: CategoryState[];
}

// Helper to get additional info/subtitle for an object
function getObjectSubtitle(obj: IntuneObject, categoryId: string): string | null {
  if (categoryId === "managed-devices") {
    const parts: string[] = [];
    const operatingSystem = obj.operatingSystem as string | undefined;
    const osVersion = obj.osVersion as string | undefined;
    const userPrincipalName = obj.userPrincipalName as string | undefined;

    if (operatingSystem) parts.push(operatingSystem);
    if (osVersion) parts.push(osVersion);
    if (userPrincipalName && !obj.deviceName) parts.push(userPrincipalName);

    return parts.length > 0 ? parts.join(" | ") : null;
  }

  if (categoryId === "autopilot-devices") {
    const manufacturer = obj.manufacturer as string | undefined;
    const model = obj.model as string | undefined;
    const enrollmentState = obj.enrollmentState as string | undefined;

    const parts: string[] = [];
    if (manufacturer && model && !obj.serialNumber) {
      parts.push(`${manufacturer} ${model}`);
    } else if (manufacturer && !model) {
      parts.push(manufacturer);
    }
    if (enrollmentState) parts.push(enrollmentState);

    return parts.length > 0 ? parts.join(" | ") : null;
  }

  // For other objects, show description if available
  if (obj.description && typeof obj.description === "string" && obj.description.trim()) {
    return obj.description.length > 60
      ? obj.description.substring(0, 60) + "..."
      : obj.description;
  }

  return null;
}

const dangerColors = {
  low: "text-[var(--low-green)]",
  medium: "text-[var(--medium-amber)]",
  high: "text-[var(--high-orange)]",
  critical: "text-[var(--critical-red)]",
} as const;

// Selected rows get a danger accent bar; deselected rows drop it and dim the
// name to --text-dim, which stays readable (unlike the old opacity-40).
const SELECTED_ROW = "bg-[var(--danger-red)]/[0.04] shadow-[inset_3px_0_0_var(--danger-red)]";

type PreviewObject = IntuneObject & {
  categoryId: string;
  categoryName: string;
  dangerLevel: CategoryState["category"]["dangerLevel"];
};

function RowBadges({ protectedReason, isSelected }: { protectedReason?: string; isSelected: boolean }) {
  if (protectedReason) {
    return (
      <span
        className="max-w-full truncate rounded border border-[var(--warning-amber-dim)] px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-[var(--warning-amber)]"
        title={protectedReason}
      >
        protected: {protectedReason}
      </span>
    );
  }
  if (!isSelected) {
    return (
      <span className="rounded border border-[var(--console-border)] px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-[var(--text-dim)]">
        kept
      </span>
    );
  }
  return null;
}

export function PreviewTable({ categories }: PreviewTableProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>("all");
  const [quickFilters, setQuickFilters] = useState<QuickFilters>(EMPTY_QUICK_FILTERS);
  const [page, setPage] = useState(0);

  const toggleObjectSelection = useNukeTuneStore((s) => s.toggleObjectSelection);
  const setObjectSelection = useNukeTuneStore((s) => s.setObjectSelection);
  const selectOnlyObjects = useNukeTuneStore((s) => s.selectOnlyObjects);

  const allObjects = useMemo<PreviewObject[]>(() => {
    return categories.flatMap((cat) =>
      cat.objects.map((obj) => ({
        ...obj,
        categoryId: cat.category.id,
        categoryName: cat.category.name,
        dangerLevel: cat.category.dangerLevel,
      }))
    );
  }, [categories]);

  const filteredObjects = useMemo(() => {
    return applyQuickFilters(
      filterVisibleObjects(allObjects, searchQuery, selectedCategoryFilter),
      quickFilters,
      (obj) => getObjectDisplayName(obj, obj.categoryId),
    );
  }, [allObjects, searchQuery, selectedCategoryFilter, quickFilters]);

  const hydrationKitCount = useMemo(
    () => allObjects.filter(isHydrationKitObject).length,
    [allObjects],
  );
  const anyFilterActive =
    searchQuery.trim().length > 0 ||
    selectedCategoryFilter !== "all" ||
    hasActiveQuickFilter(quickFilters);

  // Any filter change goes back to the first page.
  const updateSearch = (value: string) => {
    setSearchQuery(value);
    setPage(0);
  };
  const updateCategoryFilter = (value: string) => {
    setSelectedCategoryFilter(value);
    setPage(0);
  };
  const updateQuickFilters = (update: (filters: QuickFilters) => QuickFilters) => {
    setQuickFilters(update);
    setPage(0);
  };

  // Protected objects are shown as locked rows and never count as selected.
  const selectedCount = allObjects.filter((obj) => obj.selected && isSelectableObject(obj)).length;
  const protectedCount = allObjects.filter((obj) => !isSelectableObject(obj)).length;
  const filteredSelectable = filteredObjects.filter(isSelectableObject);
  const filteredSelectedCount = filteredSelectable.filter((obj) => obj.selected).length;
  const allMatchingSelected =
    filteredSelectable.length > 0 && filteredSelectedCount === filteredSelectable.length;

  // These act on every filtered row across all pages, not just the current page.
  const setMatchingSelection = (selected: boolean) => {
    setObjectSelection(getObjectSelectionTargets(filteredSelectable), selected);
  };

  // Matching selectable objects become the whole deletion set; everything
  // else in the previewed categories is deselected.
  const selectMatchingOnly = () => {
    selectOnlyObjects(
      categories.map((cat) => cat.category.id),
      getObjectSelectionTargets(filteredSelectable),
    );
  };

  const current = paginate(filteredObjects, page, DEFAULT_PAGE_SIZE);
  const matchingLabel = filteredSelectable.length.toLocaleString();

  const rowView = (obj: PreviewObject) => {
    const displayName = getObjectDisplayName(obj, obj.categoryId);
    const protectedReason = obj._protectedReason;
    const isSelected = !protectedReason && (obj.selected ?? false);
    return {
      key: `${obj.categoryId}-${obj.id}`,
      displayName,
      subtitle: getObjectSubtitle(obj, obj.categoryId),
      type: getObjectType(obj),
      protectedReason,
      isSelected,
      checkbox: (
        <input
          type="checkbox"
          checked={isSelected}
          disabled={!!protectedReason}
          onChange={() => toggleObjectSelection(obj.categoryId, obj.id)}
          className={`checkbox-terminal checkbox-danger flex-shrink-0 ${
            protectedReason ? "cursor-not-allowed" : ""
          }`}
          aria-label={
            protectedReason
              ? `${displayName} is protected: ${protectedReason}`
              : `Select ${displayName}`
          }
        />
      ),
    };
  };

  return (
    <div className="space-y-3">
      {/* Search + category */}
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          type="text"
          placeholder="Search by name, serial number, ID..."
          value={searchQuery}
          onChange={(e) => updateSearch(e.target.value)}
          className="input-terminal flex-1"
          aria-label="Search objects"
        />
        <select
          value={selectedCategoryFilter}
          onChange={(e) => updateCategoryFilter(e.target.value)}
          className="input-terminal sm:w-auto"
          aria-label="Filter by category"
        >
          <option value="all">All Categories</option>
          {categories.map((cat) => (
            <option key={cat.category.id} value={cat.category.id}>
              {cat.category.name} ({cat.objects.filter((o) => o.selected && isSelectableObject(o)).length}/{cat.objects.length})
            </option>
          ))}
        </select>
      </div>

      {/* Quick filters */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="flex min-w-0 flex-1 gap-2">
          <select
            value={quickFilters.nameMode}
            onChange={(e) =>
              updateQuickFilters((f) => ({ ...f, nameMode: e.target.value as NameMatchMode }))
            }
            className="input-terminal w-auto px-2 py-2 text-xs"
            aria-label="Name match mode"
          >
            <option value="prefix">Name starts with</option>
            <option value="contains">Name contains</option>
          </select>
          <input
            type="text"
            placeholder="e.g. Test-"
            value={quickFilters.nameQuery}
            onChange={(e) => updateQuickFilters((f) => ({ ...f, nameQuery: e.target.value }))}
            className="input-terminal min-w-0 flex-1 px-3 py-2 text-xs"
            aria-label="Name filter"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            aria-pressed={quickFilters.hydrationOnly}
            onClick={() => updateQuickFilters((f) => ({ ...f, hydrationOnly: !f.hydrationOnly }))}
            className={`btn-terminal min-w-fit flex-auto px-3 text-xs whitespace-nowrap sm:flex-none ${
              quickFilters.hydrationOnly
                ? "!border-[var(--terminal-green-dim)] !text-[var(--terminal-green)]"
                : ""
            }`}
            title='Objects whose description or notes contain "Imported by Intune Hydration Kit"'
          >
            Hydration Kit ({hydrationKitCount})
          </button>
          <button
            type="button"
            onClick={selectMatchingOnly}
            disabled={!anyFilterActive}
            className="btn-terminal min-w-fit flex-auto px-3 text-xs whitespace-nowrap disabled:cursor-not-allowed disabled:opacity-60 sm:flex-none"
            title="Select the matching objects and deselect everything else"
          >
            Select matching only
          </button>
        </div>
      </div>

      {/* Counts + bulk selection */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-xs text-[var(--text-dim)]" aria-live="polite">
          <span className="font-mono text-white">{filteredObjects.length.toLocaleString()}</span> of{" "}
          <span className="font-mono text-white">{allObjects.length.toLocaleString()}</span> match
          <span className="ml-2 text-[var(--danger-red)]">
            {selectedCount.toLocaleString()} selected for deletion
          </span>
          {protectedCount > 0 && (
            <span className="ml-2 text-[var(--warning-amber)]">
              {protectedCount.toLocaleString()} protected
            </span>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setMatchingSelection(true)}
            disabled={filteredSelectable.length === 0}
            className="btn-terminal min-w-fit flex-auto px-3 text-xs whitespace-nowrap disabled:cursor-not-allowed disabled:opacity-60 sm:flex-none"
          >
            Select all {matchingLabel} matching
          </button>
          <button
            type="button"
            onClick={() => setMatchingSelection(false)}
            disabled={filteredSelectable.length === 0}
            className="btn-terminal min-w-fit flex-auto px-3 text-xs whitespace-nowrap disabled:cursor-not-allowed disabled:opacity-60 sm:flex-none"
          >
            Deselect all {matchingLabel}
          </button>
        </div>
      </div>

      {current.items.length === 0 ? (
        <div className="console-panel px-4 py-8 text-center text-xs text-[var(--text-dim)]">
          No objects found
        </div>
      ) : (
        <>
          {/* Phone: stacked cards */}
          <ul className="console-panel divide-y divide-[var(--console-border)] sm:hidden">
            {current.items.map((obj) => {
              const row = rowView(obj);
              return (
                <li
                  key={row.key}
                  className={`flex gap-3 p-3 text-xs ${row.isSelected ? SELECTED_ROW : ""}`}
                >
                  <div className="pt-0.5">{row.checkbox}</div>
                  <div className="min-w-0 flex-1">
                    <div
                      className={`break-words font-medium ${row.isSelected ? "text-white" : "text-[var(--text-dim)]"}`}
                    >
                      {row.displayName}
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span className={row.isSelected ? dangerColors[obj.dangerLevel] : "text-[var(--text-dim)]"}>
                        {obj.categoryName}
                      </span>
                      {row.type && (
                        <span className="min-w-0 truncate text-[var(--text-dim)]" title={row.type}>
                          · {row.type}
                        </span>
                      )}
                      <RowBadges protectedReason={row.protectedReason} isSelected={row.isSelected} />
                    </div>
                    {row.subtitle && (
                      <div className="mt-1 break-words text-[10px] text-[var(--text-dim)]">
                        {row.subtitle}
                      </div>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>

          {/* Tablet/desktop: table */}
          {/* No inner scroller: the modal body scrolls, and the header sticks to it. */}
          <div className="console-panel hidden overflow-visible sm:block">
            <table className="w-full table-fixed text-left text-xs">
              <thead className="sticky -top-6 z-10 border-b border-[var(--console-border)] bg-[var(--console-dark)] text-[var(--text-dim)]">
                <tr>
                  <th className="w-12 px-4 py-3">
                    <input
                      type="checkbox"
                      checked={allMatchingSelected}
                      disabled={filteredSelectable.length === 0}
                      onChange={() => setMatchingSelection(!allMatchingSelected)}
                      className="checkbox-terminal checkbox-danger"
                      aria-label={`Select all ${matchingLabel} matching objects`}
                      title={`Select all ${matchingLabel} matching objects (all pages)`}
                    />
                  </th>
                  <th className="px-3 py-3 font-medium uppercase tracking-wider">Name</th>
                  <th className="w-44 px-3 py-3 font-medium uppercase tracking-wider">Category</th>
                  <th className="hidden w-44 px-3 py-3 font-medium uppercase tracking-wider md:table-cell">
                    Type
                  </th>
                  <th className="hidden w-28 px-3 py-3 font-medium uppercase tracking-wider lg:table-cell">
                    ID
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--console-border)]">
                {current.items.map((obj) => {
                  const row = rowView(obj);
                  return (
                    <tr
                      key={row.key}
                      className={`align-top transition-colors hover:bg-white/[0.03] ${
                        row.isSelected ? SELECTED_ROW : ""
                      }`}
                    >
                      <td className="px-4 py-3">{row.checkbox}</td>
                      <td className="px-3 py-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`min-w-0 break-words ${row.isSelected ? "text-white" : "text-[var(--text-dim)]"}`}
                          >
                            {row.displayName}
                          </span>
                          <RowBadges protectedReason={row.protectedReason} isSelected={row.isSelected} />
                        </div>
                        {row.subtitle && (
                          <div className="mt-0.5 truncate text-[10px] text-[var(--text-dim)]" title={row.subtitle}>
                            {row.subtitle}
                          </div>
                        )}
                      </td>
                      <td
                        className={`truncate px-3 py-3 ${
                          row.isSelected ? dangerColors[obj.dangerLevel] : "text-[var(--text-dim)]"
                        }`}
                        title={obj.categoryName}
                      >
                        {obj.categoryName}
                      </td>
                      <td
                        className="hidden truncate px-3 py-3 text-[var(--text-dim)] md:table-cell"
                        title={row.type || undefined}
                      >
                        {row.type || "-"}
                      </td>
                      <td
                        className="hidden truncate px-3 py-3 font-mono text-[var(--text-dim)] lg:table-cell"
                        title={obj.id}
                      >
                        {obj.id.substring(0, 8)}…
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Pagination */}
      {current.pageCount > 1 && (
        <nav
          className="flex items-center justify-between gap-2 text-xs text-[var(--text-dim)]"
          aria-label="Table pages"
        >
          <span>
            Rows <span className="font-mono text-white">{current.firstIndex.toLocaleString()}</span>–
            <span className="font-mono text-white">{current.lastIndex.toLocaleString()}</span> of{" "}
            <span className="font-mono text-white">{current.total.toLocaleString()}</span>
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPage(current.page - 1)}
              disabled={current.page === 0}
              className="btn-terminal px-3 py-1.5 text-xs disabled:cursor-not-allowed disabled:opacity-60"
              aria-label="Previous page"
            >
              Prev
            </button>
            <span className="font-mono whitespace-nowrap">
              {current.page + 1}/{current.pageCount}
            </span>
            <button
              type="button"
              onClick={() => setPage(current.page + 1)}
              disabled={current.page >= current.pageCount - 1}
              className="btn-terminal px-3 py-1.5 text-xs disabled:cursor-not-allowed disabled:opacity-60"
              aria-label="Next page"
            >
              Next
            </button>
          </div>
        </nav>
      )}
    </div>
  );
}
