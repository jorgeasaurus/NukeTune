import type { CategoryState } from "~/types/intune";

interface CategoryCardProps {
  categoryState: CategoryState;
  onToggle: () => void;
}

const dangerColors = {
  low: {
    bg: "bg-green-500/5",
    border: "border-green-500/20",
    hoverBorder: "hover:border-green-500/40",
    badge: "bg-green-500/20 text-green-300 border border-green-500/30",
    checkbox: "accent-green-500",
    glow: "shadow-green-500/10",
    selectedGlow: "shadow-green-500/20",
  },
  medium: {
    bg: "bg-yellow-500/5",
    border: "border-yellow-500/20",
    hoverBorder: "hover:border-yellow-500/40",
    badge: "bg-yellow-500/20 text-yellow-300 border border-yellow-500/30",
    checkbox: "accent-yellow-500",
    glow: "shadow-yellow-500/10",
    selectedGlow: "shadow-yellow-500/20",
  },
  high: {
    bg: "bg-orange-500/5",
    border: "border-orange-500/20",
    hoverBorder: "hover:border-orange-500/40",
    badge: "bg-orange-500/20 text-orange-300 border border-orange-500/30",
    checkbox: "accent-orange-500",
    glow: "shadow-orange-500/10",
    selectedGlow: "shadow-orange-500/20",
  },
  critical: {
    bg: "bg-red-500/5",
    border: "border-red-500/20",
    hoverBorder: "hover:border-red-500/40",
    badge: "bg-red-500/20 text-red-300 border border-red-500/30",
    checkbox: "accent-red-500",
    glow: "shadow-red-500/10",
    selectedGlow: "shadow-red-500/20",
  },
};

export function CategoryCard({ categoryState, onToggle }: CategoryCardProps) {
  const { category, selected, objects, loading, error } = categoryState;
  const colors = dangerColors[category.dangerLevel];

  return (
    <div
      className={`group relative overflow-hidden rounded-xl border p-4 backdrop-blur-md transition-all duration-300 ${colors.border} ${colors.bg} ${colors.hoverBorder} hover:-translate-y-0.5 ${
        selected
          ? `ring-2 ring-white/20 shadow-lg ${colors.selectedGlow}`
          : `shadow-md ${colors.glow}`
      }`}
    >
      <label className="flex cursor-pointer items-start gap-3">
        <input
          type="checkbox"
          checked={selected}
          onChange={onToggle}
          className={`mt-1 h-5 w-5 rounded transition-transform duration-200 hover:scale-110 ${colors.checkbox}`}
        />
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-white">{category.name}</h3>
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-medium backdrop-blur-sm ${colors.badge}`}
            >
              {category.dangerLevel}
            </span>
          </div>
          <p className="mt-1.5 text-sm leading-relaxed text-gray-400">
            {category.description}
          </p>

          {loading && (
            <div className="mt-3 flex items-center gap-2">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-500/30 border-t-blue-500" />
              <p className="text-sm text-blue-400">Loading...</p>
            </div>
          )}

          {error && <p className="mt-3 text-sm text-red-400">{error}</p>}

          {!loading && !error && objects.length > 0 && (
            <p className="mt-3 text-sm font-medium text-gray-300">
              {objects.length} object{objects.length !== 1 ? "s" : ""} found
            </p>
          )}

          {!loading && !error && selected && objects.length === 0 && (
            <p className="mt-3 text-sm text-gray-500">No objects loaded yet</p>
          )}
        </div>
      </label>
    </div>
  );
}
