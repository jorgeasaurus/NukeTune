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
  const { category, selected, objects, loading, loaded, error } = categoryState;
  const protectedCount = objects.filter((obj) => obj._protectedReason).length;
  const styles = dangerStyles[category.dangerLevel];
  const isDisabled = category.requiresAppPermissions;

  const headingId = `category-${category.id}-name`;
  const descriptionId = `category-${category.id}-desc`;
  const statusId = `category-${category.id}-status`;

  // The whole card is the checkbox's <label>, so clicking anywhere on it
  // toggles the category; the checkbox's name is just the category name.
  return (
    <label
      className={`block ${selected && !isDisabled ? styles.cardSelected : styles.card} ${
        isDisabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"
      }`}
    >
      <div className="flex items-start gap-3">
        <input
          type="checkbox"
          checked={selected && !isDisabled}
          onChange={onToggle}
          disabled={isDisabled}
          aria-labelledby={headingId}
          aria-describedby={`${descriptionId} ${statusId}`}
          className={`mt-0.5 shrink-0 ${styles.checkbox} ${isDisabled ? "opacity-50" : ""}`}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 id={headingId} className="font-display text-sm font-semibold text-white">
              {category.name}
            </h3>
            <span className={styles.badge}>{category.dangerLevel}</span>
          </div>
          <p id={descriptionId} className="mt-1.5 text-xs leading-relaxed text-[var(--text-dim)]">
            {category.description}
          </p>

          <div id={statusId}>
            {isDisabled && (
              <p className="mt-3 text-xs text-[var(--warning-amber)]/80">
                Requires app-only permissions (not supported)
              </p>
            )}

            {!isDisabled && loading && (
              <div className="mt-3 flex items-center gap-2">
                <div className="spinner-terminal" aria-hidden="true" />
                <p className="text-xs text-[var(--terminal-green)]">Loading...</p>
              </div>
            )}

            {!isDisabled && error && (
              <p className="mt-3 break-words text-xs text-[var(--critical-red)]">{error}</p>
            )}

            {!isDisabled && !loading && !error && loaded && (
              <p className="mt-3 text-xs font-medium text-white">
                <span className="font-mono text-[var(--terminal-green)]">
                  {objects.length}
                </span>{" "}
                object{objects.length !== 1 ? "s" : ""} found
                {protectedCount > 0 && (
                  <span className="ml-1 text-[var(--warning-amber)]">
                    ({protectedCount} protected)
                  </span>
                )}
              </p>
            )}

            {!isDisabled && !loading && !error && selected && !loaded && (
              <p className="mt-3 text-xs text-[var(--text-muted)]">
                No objects loaded yet
              </p>
            )}
          </div>
        </div>
      </div>
    </label>
  );
}
