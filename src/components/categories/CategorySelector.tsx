import { useNukeTuneStore } from "~/store";
import { useIntune } from "~/hooks/useIntune";
import { CategoryCard } from "./CategoryCard";

export function CategorySelector() {
  const categories = useNukeTuneStore((state) => state.categories);
  const toggleCategory = useNukeTuneStore((state) => state.toggleCategory);
  const selectAll = useNukeTuneStore((state) => state.selectAllCategories);
  const deselectAll = useNukeTuneStore((state) => state.deselectAllCategories);
  const { loadCategoryObjects } = useIntune();

  const selectedCount = categories.filter((c) => c.selected).length;

  const handleToggle = (categoryId: string) => {
    const cat = categories.find((c) => c.category.id === categoryId);
    if (!cat || cat.category.requiresAppPermissions) return;

    if (!cat.selected && cat.objects.length === 0 && !cat.loading) {
      // Load data when selecting a category that hasn't been loaded
      void loadCategoryObjects(cat.category);
    }
    toggleCategory(categoryId);
  };

  const handleSelectAll = () => {
    selectAll();
    // Load data for all categories that haven't been loaded (skip app-only permissions)
    categories.forEach((cat) => {
      if (!cat.category.requiresAppPermissions && cat.objects.length === 0 && !cat.loading) {
        void loadCategoryObjects(cat.category);
      }
    });
  };

  const criticalCategories = categories.filter(
    (c) => c.category.dangerLevel === "critical"
  );
  const highCategories = categories.filter(
    (c) => c.category.dangerLevel === "high"
  );
  const mediumCategories = categories.filter(
    (c) => c.category.dangerLevel === "medium"
  );
  const lowCategories = categories.filter(
    (c) => c.category.dangerLevel === "low"
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-gradient">
            Select Categories to Delete
          </h2>
          <p className="mt-1 text-sm text-gray-400">
            {selectedCount} of {categories.length} categories selected
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleSelectAll}
            className="glass-button px-4 py-2 text-sm"
          >
            Select All
          </button>
          <button
            onClick={deselectAll}
            className="glass-button px-4 py-2 text-sm"
          >
            Deselect All
          </button>
        </div>
      </div>

      {criticalCategories.length > 0 && (
        <div>
          <h3 className="mb-4 flex items-center gap-2.5 text-lg font-semibold text-red-400">
            <span className="h-3 w-3 rounded-full bg-red-500 shadow-lg shadow-red-500/50" />
            Critical
          </h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {criticalCategories.map((cat) => (
              <CategoryCard
                key={cat.category.id}
                categoryState={cat}
                onToggle={() => handleToggle(cat.category.id)}
              />
            ))}
          </div>
        </div>
      )}

      {highCategories.length > 0 && (
        <div>
          <h3 className="mb-4 flex items-center gap-2.5 text-lg font-semibold text-orange-400">
            <span className="h-3 w-3 rounded-full bg-orange-500 shadow-lg shadow-orange-500/50" />
            High
          </h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {highCategories.map((cat) => (
              <CategoryCard
                key={cat.category.id}
                categoryState={cat}
                onToggle={() => handleToggle(cat.category.id)}
              />
            ))}
          </div>
        </div>
      )}

      {mediumCategories.length > 0 && (
        <div>
          <h3 className="mb-4 flex items-center gap-2.5 text-lg font-semibold text-yellow-400">
            <span className="h-3 w-3 rounded-full bg-yellow-500 shadow-lg shadow-yellow-500/50" />
            Medium
          </h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {mediumCategories.map((cat) => (
              <CategoryCard
                key={cat.category.id}
                categoryState={cat}
                onToggle={() => handleToggle(cat.category.id)}
              />
            ))}
          </div>
        </div>
      )}

      {lowCategories.length > 0 && (
        <div>
          <h3 className="mb-4 flex items-center gap-2.5 text-lg font-semibold text-green-400">
            <span className="h-3 w-3 rounded-full bg-green-500 shadow-lg shadow-green-500/50" />
            Low
          </h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {lowCategories.map((cat) => (
              <CategoryCard
                key={cat.category.id}
                categoryState={cat}
                onToggle={() => handleToggle(cat.category.id)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
