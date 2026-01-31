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
      void loadCategoryObjects(cat.category);
    }
    toggleCategory(categoryId);
  };

  const handleSelectAll = () => {
    selectAll();
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
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
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
          <button onClick={handleSelectAll} className="btn-terminal text-xs">
            Select All
          </button>
          <button onClick={deselectAll} className="btn-terminal text-xs">
            Deselect All
          </button>
        </div>
      </div>

      {/* Critical Level */}
      {criticalCategories.length > 0 && (
        <div>
          <div className="mb-4 flex items-center gap-3">
            <span className="h-2 w-2 rounded-full bg-[var(--critical-red)] shadow-[0_0_8px_var(--critical-red-glow)]" />
            <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-[var(--critical-red)]">
              Critical
            </h3>
            <div className="h-px flex-1 bg-[var(--critical-red)]/20" />
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
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

      {/* High Level */}
      {highCategories.length > 0 && (
        <div>
          <div className="mb-4 flex items-center gap-3">
            <span className="h-2 w-2 rounded-full bg-[var(--high-orange)] shadow-[0_0_8px_var(--high-orange-glow)]" />
            <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-[var(--high-orange)]">
              High
            </h3>
            <div className="h-px flex-1 bg-[var(--high-orange)]/20" />
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
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

      {/* Medium Level */}
      {mediumCategories.length > 0 && (
        <div>
          <div className="mb-4 flex items-center gap-3">
            <span className="h-2 w-2 rounded-full bg-[var(--medium-amber)] shadow-[0_0_8px_var(--medium-amber-glow)]" />
            <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-[var(--medium-amber)]">
              Medium
            </h3>
            <div className="h-px flex-1 bg-[var(--medium-amber)]/20" />
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
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

      {/* Low Level */}
      {lowCategories.length > 0 && (
        <div>
          <div className="mb-4 flex items-center gap-3">
            <span className="h-2 w-2 rounded-full bg-[var(--low-green)] shadow-[0_0_8px_var(--low-green-glow)]" />
            <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-[var(--low-green)]">
              Low
            </h3>
            <div className="h-px flex-1 bg-[var(--low-green)]/20" />
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
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
