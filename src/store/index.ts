import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { useShallow } from "zustand/react/shallow";
import type {
  CategoryState,
  DeletionLogEntry,
  IntuneObject,
} from "~/types/intune";
import { INTUNE_CATEGORIES } from "~/lib/intune/categories";
import {
  setObjectSelection as updateObjectSelection,
  toggleObjectSelection as toggleSelection,
  selectAllSelectable,
} from "~/utils/objectSelection";
import type { ObjectSelectionTarget } from "~/utils/objectSelection";
import {
  applyDeletionEntry,
  beginRun,
  computeDeletionStats,
  type DeletionPlanEntry,
} from "~/utils/deletionRun";

export type DeletionPhase = "idle" | "preview" | "confirming" | "deleting" | "complete";
export type TenantStatus = "idle" | "loading" | "loaded" | "failed";

interface NukeTuneState {
  // Auth state
  userDisplayName: string | null;
  tenantId: string | null;
  tenantName: string | null;
  tenantDomain: string | null;
  tenantStatus: TenantStatus;

  // Categories state
  categories: CategoryState[];

  // Preview state
  previewOpen: boolean;

  // Deletion state
  deletionPhase: DeletionPhase;
  isPaused: boolean;
  deletionLog: DeletionLogEntry[];
  shouldCancel: boolean;
  /** The current/last run is a simulation: no Graph writes. */
  dryRun: boolean;

  // Actions
  setUser: (name: string | null, tenantId: string | null, tenantName: string | null) => void;
  setTenantInfo: (info: {
    tenantId: string | null;
    tenantName: string | null;
    tenantDomain: string | null;
    tenantStatus: TenantStatus;
  }) => void;
  initializeCategories: () => void;
  toggleCategory: (categoryId: string) => void;
  selectAllCategories: () => void;
  deselectAllCategories: () => void;
  setCategoryObjects: (categoryId: string, objects: IntuneObject[]) => void;
  toggleObjectSelection: (categoryId: string, objectId: string) => void;
  setObjectSelection: (targets: ObjectSelectionTarget[], selected: boolean) => void;
  setCategoryLoading: (categoryId: string, loading: boolean) => void;
  setCategoryError: (categoryId: string, error: string | null) => void;
  beginDeletionRun: (plan: DeletionPlanEntry[], options?: { dryRun?: boolean }) => void;
  /** Leave a finished dry run and return to the unchanged preview. */
  finishDryRun: () => void;
  recordDeletionResult: (entry: DeletionLogEntry) => void;
  openPreview: () => void;
  closePreview: () => void;
  setDeletionPhase: (phase: DeletionPhase) => void;
  pauseDeletion: () => void;
  resumeDeletion: () => void;
  cancelDeletion: () => void;
  addLogEntry: (entry: DeletionLogEntry) => void;
  clearLog: () => void;
  reset: () => void;
}

const initialCategories: CategoryState[] = INTUNE_CATEGORIES.map((category) => ({
  category,
  selected: false,
  objects: [],
  loading: false,
  loaded: false,
  error: null,
  runTotal: 0,
  deletedCount: 0,
  failedCount: 0,
  skippedCount: 0,
  failedObjectIds: [],
}));

export const useNukeTuneStore = create<NukeTuneState>()(
  devtools(
    (set) => ({
      // Initial state
      userDisplayName: null,
      tenantId: null,
      tenantName: null,
      tenantDomain: null,
      tenantStatus: "idle",
      categories: initialCategories,
      previewOpen: false,
      deletionPhase: "idle",
      isPaused: false,
      deletionLog: [],
      shouldCancel: false,
      dryRun: false,

      // Actions
      setUser: (name, tenantId, tenantName) =>
        set({ userDisplayName: name, tenantId, tenantName }),

      setTenantInfo: (info) => set(info),

      initializeCategories: () =>
        set({
          categories: INTUNE_CATEGORIES.map((category) => ({
            category,
            selected: false,
            objects: [],
            loading: false,
            loaded: false,
            error: null,
            runTotal: 0,
            deletedCount: 0,
            failedCount: 0,
            skippedCount: 0,
            failedObjectIds: [],
          })),
        }),

      toggleCategory: (categoryId) =>
        set((state) => ({
          categories: state.categories.map((cat) =>
            cat.category.id === categoryId
              ? { ...cat, selected: !cat.selected }
              : cat
          ),
        })),

      selectAllCategories: () =>
        set((state) => ({
          categories: state.categories.map((cat) => ({
            ...cat,
            selected: true,
          })),
        })),

      deselectAllCategories: () =>
        set((state) => ({
          categories: state.categories.map((cat) => ({
            ...cat,
            selected: false,
          })),
        })),

      setCategoryObjects: (categoryId, objects) =>
        set((state) => ({
          categories: state.categories.map((cat) =>
            cat.category.id === categoryId
              ? { ...cat, objects: selectAllSelectable(objects), loaded: true }
              : cat
          ),
        })),

      toggleObjectSelection: (categoryId, objectId) =>
        set((state) => ({
          categories: state.categories.map((cat) =>
            cat.category.id === categoryId
              ? { ...cat, objects: toggleSelection(cat.objects, objectId) }
              : cat
          ),
        })),

      setObjectSelection: (targets, selected) =>
        set((state) => {
          const objectIdsByCategory = new Map<string, string[]>();

          for (const target of targets) {
            const objectIds = objectIdsByCategory.get(target.categoryId) ?? [];
            objectIds.push(target.objectId);
            objectIdsByCategory.set(target.categoryId, objectIds);
          }

          return {
            categories: state.categories.map((cat) => {
              const objectIds = objectIdsByCategory.get(cat.category.id);
              return objectIds
                ? {
                    ...cat,
                    objects: updateObjectSelection(cat.objects, objectIds, selected),
                  }
                : cat;
            }),
          };
        }),

      setCategoryLoading: (categoryId, loading) =>
        set((state) => ({
          categories: state.categories.map((cat) =>
            cat.category.id === categoryId ? { ...cat, loading } : cat
          ),
        })),

      setCategoryError: (categoryId, error) =>
        set((state) => ({
          categories: state.categories.map((cat) =>
            cat.category.id === categoryId ? { ...cat, error } : cat
          ),
        })),

      beginDeletionRun: (plan, options) =>
        set((state) => ({
          categories: beginRun(state.categories, plan),
          deletionPhase: "deleting",
          isPaused: false,
          shouldCancel: false,
          dryRun: options?.dryRun ?? false,
        })),

      finishDryRun: () =>
        set((state) => ({
          categories: beginRun(state.categories, []),
          previewOpen: true,
          deletionPhase: "preview",
          isPaused: false,
          shouldCancel: false,
          dryRun: false,
          deletionLog: [],
        })),

      recordDeletionResult: (entry) =>
        set((state) => ({
          categories: state.categories.map((cat) => applyDeletionEntry(cat, entry)),
          deletionLog: [...state.deletionLog, entry],
        })),

      openPreview: () => set({ previewOpen: true, deletionPhase: "preview" }),

      closePreview: () =>
        set({ previewOpen: false, deletionPhase: "idle" }),

      setDeletionPhase: (phase) => set({ deletionPhase: phase }),

      pauseDeletion: () => set({ isPaused: true }),

      resumeDeletion: () => set({ isPaused: false }),

      cancelDeletion: () => set({ shouldCancel: true, isPaused: false }),

      addLogEntry: (entry) =>
        set((state) => ({
          deletionLog: [...state.deletionLog, entry],
        })),

      clearLog: () => set({ deletionLog: [] }),

      reset: () =>
        set({
          categories: initialCategories,
          previewOpen: false,
          deletionPhase: "idle",
          isPaused: false,
          deletionLog: [],
          shouldCancel: false,
          dryRun: false,
        }),
    }),
    { name: "NukeTuneStore" }
  )
);

/**
 * Discard everything scoped to the signed-in tenant: selections, fetched
 * objects, deletion state and tenant identity. Used on sign-out and whenever
 * the active account changes so tenant A's data never shows under tenant B.
 */
export function resetTenantSession() {
  const state = useNukeTuneStore.getState();
  state.reset();
  state.setUser(null, null, null);
  state.setTenantInfo({
    tenantId: null,
    tenantName: null,
    tenantDomain: null,
    tenantStatus: "idle",
  });
}

// Selectors - use useShallow for array/object returns to prevent infinite re-renders
export const useSelectedCategories = () =>
  useNukeTuneStore(
    useShallow((state) => state.categories.filter((cat) => cat.selected))
  );

export const useTotalObjectCount = () =>
  useNukeTuneStore((state) =>
    state.categories
      .filter((cat) => cat.selected)
      .reduce((sum, cat) => sum + cat.objects.filter((obj) => obj.selected).length, 0)
  );

export const useDeletionStats = () =>
  useNukeTuneStore(useShallow((state) => computeDeletionStats(state.categories)));
