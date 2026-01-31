import { useState, useMemo } from "react";
import type { CategoryState, IntuneObject } from "~/types/intune";
import { useNukeTuneStore } from "~/store";

interface PreviewTableProps {
  categories: CategoryState[];
}

// Helper to get the best display name for an object based on its type
function getObjectDisplayName(obj: IntuneObject, categoryId: string): string {
  // Check common name properties first
  if (obj.displayName && typeof obj.displayName === "string" && obj.displayName.trim()) {
    return obj.displayName;
  }
  if (obj.name && typeof obj.name === "string" && obj.name.trim()) {
    return obj.name;
  }

  // For managed devices, check deviceName
  if (categoryId === "managed-devices") {
    const deviceName = typeof obj.deviceName === "string" ? obj.deviceName : undefined;
    if (deviceName?.trim()) return deviceName;

    const serialNumber = typeof obj.serialNumber === "string" ? obj.serialNumber : undefined;
    const userPrincipalName = typeof obj.userPrincipalName === "string" ? obj.userPrincipalName : undefined;
    if (serialNumber && userPrincipalName) {
      return `${serialNumber} (${userPrincipalName})`;
    }
    if (serialNumber) return `SN: ${serialNumber}`;
    if (userPrincipalName) return userPrincipalName;
  }

  // For autopilot devices, use serial number and model
  if (categoryId === "autopilot-devices") {
    const serialNumber = typeof obj.serialNumber === "string" ? obj.serialNumber : undefined;
    const model = typeof obj.model === "string" ? obj.model : undefined;
    const manufacturer = typeof obj.manufacturer === "string" ? obj.manufacturer : undefined;

    if (serialNumber && model) {
      return `${serialNumber} (${model})`;
    }
    if (serialNumber && manufacturer) {
      return `${serialNumber} (${manufacturer})`;
    }
    if (serialNumber) return `SN: ${serialNumber}`;
    if (model) return model;
  }

  // Fallback: show truncated ID
  return `ID: ${obj.id.substring(0, 12)}...`;
}

// Helper to get searchable text from an object
function getSearchableText(obj: IntuneObject): string {
  const parts: string[] = [];

  if (typeof obj.displayName === "string") parts.push(obj.displayName);
  if (typeof obj.name === "string") parts.push(obj.name);
  if (typeof obj.deviceName === "string") parts.push(obj.deviceName);
  if (typeof obj.serialNumber === "string") parts.push(obj.serialNumber);
  if (typeof obj.userPrincipalName === "string") parts.push(obj.userPrincipalName);
  if (typeof obj.model === "string") parts.push(obj.model);
  if (typeof obj.manufacturer === "string") parts.push(obj.manufacturer);
  parts.push(obj.id);

  return parts.join(" ").toLowerCase();
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
  const selectAllObjects = useNukeTuneStore((s) => s.selectAllObjects);
  const deselectAllObjects = useNukeTuneStore((s) => s.deselectAllObjects);

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
    return allObjects.filter((obj) => {
      const matchesSearch =
        searchQuery === "" ||
        getSearchableText(obj).includes(searchQuery.toLowerCase());

      const matchesCategory =
        selectedCategoryFilter === "all" ||
        obj.categoryId === selectedCategoryFilter;

      return matchesSearch && matchesCategory;
    });
  }, [allObjects, searchQuery, selectedCategoryFilter]);

  const selectedCount = allObjects.filter((obj) => obj.selected).length;
  const filteredSelectedCount = filteredObjects.filter((obj) => obj.selected).length;

  const handleSelectAllVisible = () => {
    if (selectedCategoryFilter === "all") {
      categories.forEach((cat) => selectAllObjects(cat.category.id));
    } else {
      selectAllObjects(selectedCategoryFilter);
    }
  };

  const handleDeselectAllVisible = () => {
    if (selectedCategoryFilter === "all") {
      categories.forEach((cat) => deselectAllObjects(cat.category.id));
    } else {
      deselectAllObjects(selectedCategoryFilter);
    }
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
        >
          <option value="all">All Categories</option>
          {categories.map((cat) => (
            <option key={cat.category.id} value={cat.category.id}>
              {cat.category.name} ({cat.objects.filter((o) => o.selected).length}/{cat.objects.length})
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-xs text-[var(--text-dim)]">
          Showing <span className="font-mono text-white">{filteredObjects.length}</span> of{" "}
          <span className="font-mono text-white">{allObjects.length}</span> objects
          <span className="ml-2 text-[var(--danger-red)]">
            ({selectedCount} selected for deletion)
          </span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleSelectAllVisible}
            className="btn-terminal text-xs"
          >
            Select All
          </button>
          <button
            onClick={handleDeselectAllVisible}
            className="btn-terminal text-xs"
          >
            Deselect All
          </button>
        </div>
      </div>

      <div className="console-panel max-h-96 overflow-auto">
        <table className="w-full text-left text-xs">
          <thead className="sticky top-0 border-b border-[var(--console-border)] bg-[var(--console-dark)]/95 text-[var(--text-dim)] backdrop-blur-md">
            <tr>
              <th className="w-10 px-4 py-3">
                <input
                  type="checkbox"
                  checked={filteredSelectedCount === filteredObjects.length && filteredObjects.length > 0}
                  onChange={() => {
                    if (filteredSelectedCount === filteredObjects.length) {
                      handleDeselectAllVisible();
                    } else {
                      handleSelectAllVisible();
                    }
                  }}
                  className="checkbox-terminal checkbox-danger"
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

                return (
                  <tr
                    key={`${obj.categoryId}-${obj.id}`}
                    className={`transition-colors hover:bg-white/[0.02] ${
                      obj.selected ? "" : "opacity-40"
                    }`}
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={obj.selected ?? false}
                        onChange={() => toggleObjectSelection(obj.categoryId, obj.id)}
                        className="checkbox-terminal checkbox-danger"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-white">{displayName}</div>
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
                      {obj["@odata.type"]?.replace("#microsoft.graph.", "") ?? "-"}
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
