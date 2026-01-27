import { useState, useMemo } from "react";
import type { CategoryState } from "~/types/intune";
import { useNukeTuneStore } from "~/store";

interface PreviewTableProps {
  categories: CategoryState[];
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
        (obj.displayName ?? obj.name ?? obj.id)
          .toLowerCase()
          .includes(searchQuery.toLowerCase());

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
    low: "text-green-400",
    medium: "text-yellow-400",
    high: "text-orange-400",
    critical: "text-red-400",
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          type="text"
          placeholder="Search objects..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="glass-input flex-1"
        />
        <select
          value={selectedCategoryFilter}
          onChange={(e) => setSelectedCategoryFilter(e.target.value)}
          className="glass-input sm:w-auto"
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
        <div className="text-sm text-gray-400">
          Showing {filteredObjects.length} of {allObjects.length} objects
          <span className="ml-2 text-white">({selectedCount} selected for deletion)</span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleSelectAllVisible}
            className="glass-button px-3 py-1.5 text-xs"
          >
            Select All
          </button>
          <button
            onClick={handleDeselectAllVisible}
            className="glass-button px-3 py-1.5 text-xs"
          >
            Deselect All
          </button>
        </div>
      </div>

      <div className="glass max-h-96 overflow-auto rounded-xl">
        <table className="w-full text-left text-sm">
          <thead className="sticky top-0 border-b border-white/10 bg-gray-900/95 text-gray-300 backdrop-blur-md">
            <tr>
              <th className="w-10 px-4 py-3.5">
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
                  className="h-4 w-4 rounded accent-red-500"
                />
              </th>
              <th className="px-4 py-3.5 font-medium">Name</th>
              <th className="px-4 py-3.5 font-medium">Category</th>
              <th className="px-4 py-3.5 font-medium">Type</th>
              <th className="hidden px-4 py-3.5 font-medium sm:table-cell">ID</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {filteredObjects.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                  No objects found
                </td>
              </tr>
            ) : (
              filteredObjects.map((obj) => (
                <tr
                  key={`${obj.categoryId}-${obj.id}`}
                  className={`transition-colors duration-150 hover:bg-white/5 ${
                    obj.selected ? "" : "opacity-50"
                  }`}
                >
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={obj.selected ?? false}
                      onChange={() => toggleObjectSelection(obj.categoryId, obj.id)}
                      className="h-4 w-4 rounded accent-red-500"
                    />
                  </td>
                  <td className="px-4 py-3 text-white">
                    {obj.displayName ?? obj.name ?? "(unnamed)"}
                  </td>
                  <td className={`px-4 py-3 ${dangerColors[obj.dangerLevel]}`}>
                    {obj.categoryName}
                  </td>
                  <td className="px-4 py-3 text-gray-400">
                    {obj["@odata.type"]?.replace("#microsoft.graph.", "") ?? "-"}
                  </td>
                  <td className="hidden px-4 py-3 font-mono text-xs text-gray-500 sm:table-cell">
                    {obj.id.substring(0, 8)}...
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
