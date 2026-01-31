import type { CategoryState } from "~/types/intune";

interface CategoryCardProps {
  categoryState: CategoryState;
  onToggle: () => void;
}

const dangerStyles = {
  low: {
    card: "card-category card-category-low",
    cardSelected: "card-category card-category-low selected",
    badge: "badge badge-low",
    checkbox: "checkbox-terminal",
  },
  medium: {
    card: "card-category card-category-medium",
    cardSelected: "card-category card-category-medium selected",
    badge: "badge badge-medium",
    checkbox: "checkbox-terminal checkbox-warning",
  },
  high: {
    card: "card-category card-category-high",
    cardSelected: "card-category card-category-high selected",
    badge: "badge badge-high",
    checkbox: "checkbox-terminal checkbox-orange",
  },
  critical: {
    card: "card-category card-category-critical",
    cardSelected: "card-category card-category-critical selected",
    badge: "badge badge-critical",
    checkbox: "checkbox-terminal checkbox-danger",
  },
};

export function CategoryCard({ categoryState, onToggle }: CategoryCardProps) {
  const { category, selected, objects, loading, error } = categoryState;
  const styles = dangerStyles[category.dangerLevel];
  const isDisabled = category.requiresAppPermissions;

  return (
    <div
      className={`${selected && !isDisabled ? styles.cardSelected : styles.card} ${
        isDisabled ? "opacity-50 cursor-not-allowed" : ""
      }`}
    >
      <label
        className={`flex items-start gap-3 ${isDisabled ? "cursor-not-allowed" : "cursor-pointer"}`}
      >
        <input
          type="checkbox"
          checked={selected && !isDisabled}
          onChange={onToggle}
          disabled={isDisabled}
          className={`mt-0.5 ${styles.checkbox} ${isDisabled ? "opacity-50" : ""}`}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-display text-sm font-semibold text-white truncate">
              {category.name}
            </h3>
            <span className={styles.badge}>{category.dangerLevel}</span>
          </div>
          <p className="mt-1.5 text-xs leading-relaxed text-[var(--text-dim)]">
            {category.description}
          </p>

          {isDisabled && (
            <p className="mt-3 text-xs text-[var(--warning-amber)]/80">
              Requires app-only permissions (not supported)
            </p>
          )}

          {!isDisabled && loading && (
            <div className="mt-3 flex items-center gap-2">
              <div className="spinner-terminal" />
              <p className="text-xs text-[var(--terminal-green)]">Loading...</p>
            </div>
          )}

          {!isDisabled && error && (
            <p className="mt-3 text-xs text-[var(--danger-red)]">{error}</p>
          )}

          {!isDisabled && !loading && !error && objects.length > 0 && (
            <p className="mt-3 text-xs font-medium text-white">
              <span className="font-mono text-[var(--terminal-green)]">
                {objects.length}
              </span>{" "}
              object{objects.length !== 1 ? "s" : ""} found
            </p>
          )}

          {!isDisabled && !loading && !error && selected && objects.length === 0 && (
            <p className="mt-3 text-xs text-[var(--text-muted)]">
              No objects loaded yet
            </p>
          )}
        </div>
      </label>
    </div>
  );
}
