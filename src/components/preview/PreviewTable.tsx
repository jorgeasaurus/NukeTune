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

export function PreviewTable({ categories }: PreviewTableProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>("all");

  const toggleObjectSelection = useNukeTuneStore((s) => s.toggleObjectSelection);
  const setObjectSelection = useNukeTuneStore((s) => s.setObjectSelection);
  const selectOnlyObjects = useNukeTuneStore((s) => s.selectOnlyObjects);
  const [quickFilters, setQuickFilters] = useState<QuickFilters>(EMPTY_QUICK_FILTERS);

  const allObjects = useMemo(() => {
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

  // Protected objects are shown as locked rows and never count as selected.
  const selectedCount = allObjects.filter((obj) => obj.selected && isSelectableObject(obj)).length;
  const protectedCount = allObjects.filter((obj) => !isSelectableObject(obj)).length;
  const filteredSelectable = filteredObjects.filter(isSelectableObject);
  const filteredSelectedCount = filteredSelectable.filter((obj) => obj.selected).length;
  const allVisibleSelected =
    filteredSelectable.length > 0 && filteredSelectedCount === filteredSelectable.length;

  const setVisibleObjectSelection = (selected: boolean) => {
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

  const dangerColors = {
    low: "text-[var(--low-green)]",
    medium: "text-[var(--medium-amber)]",
    high: "text-[var(--high-orange)]",
    critical: "text-[var(--critical-red)]",
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          type="text"
          placeholder="Search by name, serial number, ID..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="input-terminal flex-1"
        />
        <select
          value={selectedCategoryFilter}
          onChange={(e) => setSelectedCategoryFilter(e.target.value)}
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

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex flex-1 gap-2">
          <select
            value={quickFilters.nameMode}
            onChange={(e) =>
              setQuickFilters((f) => ({ ...f, nameMode: e.target.value as NameMatchMode }))
            }
            className="input-terminal w-auto text-xs"
            aria-label="Name match mode"
          >
            <option value="prefix">Name starts with</option>
            <option value="contains">Name contains</option>
          </select>
          <input
            type="text"
            placeholder="e.g. Test-"
            value={quickFilters.nameQuery}
            onChange={(e) => setQuickFilters((f) => ({ ...f, nameQuery: e.target.value }))}
            className="input-terminal min-w-0 flex-1 text-xs"
            aria-label="Name filter"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            aria-pressed={quickFilters.hydrationOnly}
            onClick={() => setQuickFilters((f) => ({ ...f, hydrationOnly: !f.hydrationOnly }))}
            className={`btn-terminal text-xs ${
              quickFilters.hydrationOnly ? "border-[var(--terminal-green)] text-[var(--terminal-green)]" : ""
            }`}
            title='Objects whose description or notes contain "Imported by Intune Hydration Kit"'
          >
            Hydration Kit ({hydrationKitCount})
          </button>
          <button
            type="button"
            onClick={selectMatchingOnly}
            disabled={!anyFilterActive}
            className="btn-terminal text-xs"
            title="Select the matching objects and deselect everything else"
          >
            Select matching only
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-xs text-[var(--text-dim)]">
          Showing <span className="font-mono text-white">{filteredObjects.length}</span> of{" "}
          <span className="font-mono text-white">{allObjects.length}</span> objects
          <span className="ml-2 text-[var(--danger-red)]">
            ({selectedCount} selected for deletion)
          </span>
          {protectedCount > 0 && (
            <span className="ml-2 text-[var(--warning-amber)]">
              {protectedCount} protected
            </span>
          )}
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setVisibleObjectSelection(true)}
            className="btn-terminal text-xs"
          >
            Select Visible
          </button>
          <button
            type="button"
            onClick={() => setVisibleObjectSelection(false)}
            className="btn-terminal text-xs"
          >
            Deselect Visible
          </button>
        </div>
      </div>

      <div className="console-panel max-h-96 overflow-auto">
        <table className="w-full text-left text-xs">
          <thead className="sticky top-0 border-b border-[var(--console-border)] bg-[var(--console-dark)]/95 text-[var(--text-dim)] backdrop-blur-md">
            <tr>
              <th className="w-10 px-4 py-3">
                <span className="sr-only">Select</span>
                <input
                  type="checkbox"
                  checked={allVisibleSelected}
                  disabled={filteredSelectable.length === 0}
                  onChange={() => {
                    if (allVisibleSelected) {
                      setVisibleObjectSelection(false);
                    } else {
                      setVisibleObjectSelection(true);
                    }
                  }}
                  className="checkbox-terminal checkbox-danger"
                  aria-label="Select all visible objects"
                />
              </th>
              <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider">Name</th>
              <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider">Category</th>
              <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider">Type</th>
              <th className="hidden px-4 py-3 text-xs font-medium uppercase tracking-wider sm:table-cell">ID</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--console-border)]">
            {filteredObjects.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-[var(--text-muted)]">
                  No objects found
                </td>
              </tr>
            ) : (
              filteredObjects.map((obj) => {
                const displayName = getObjectDisplayName(obj, obj.categoryId);
                const subtitle = getObjectSubtitle(obj, obj.categoryId);
                const protectedReason = obj._protectedReason;
                const isSelected = !protectedReason && (obj.selected ?? false);

                return (
                  <tr
                    key={`${obj.categoryId}-${obj.id}`}
                    className={`transition-colors hover:bg-white/[0.02] ${
                      isSelected ? "" : "opacity-40"
                    }`}
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        disabled={!!protectedReason}
                        onChange={() => toggleObjectSelection(obj.categoryId, obj.id)}
                        className={`checkbox-terminal checkbox-danger ${
                          protectedReason ? "cursor-not-allowed" : ""
                        }`}
                        aria-label={
                          protectedReason
                            ? `${displayName} is protected: ${protectedReason}`
                            : `Select ${displayName}`
                        }
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap items-center gap-2 text-white">
                        <span>{displayName}</span>
                        {protectedReason && (
                          <span
                            className="rounded border border-[var(--warning-amber-dim)] px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-[var(--warning-amber)]"
                            title={protectedReason}
                          >
                            protected: {protectedReason}
                          </span>
                        )}
                      </div>
                      {subtitle && (
                        <div className="mt-0.5 text-[10px] text-[var(--text-muted)]">
                          {subtitle}
                        </div>
                      )}
                    </td>
                    <td className={`px-4 py-3 ${dangerColors[obj.dangerLevel]}`}>
                      {obj.categoryName}
                    </td>
                    <td className="px-4 py-3 text-[var(--text-dim)]">
                      {getObjectType(obj) || "-"}
                    </td>
                    <td className="hidden px-4 py-3 font-mono text-[var(--text-muted)] sm:table-cell">
                      {obj.id.substring(0, 8)}...
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
