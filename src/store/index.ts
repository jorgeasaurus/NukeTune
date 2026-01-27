import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { useShallow } from "zustand/react/shallow";
import type {
  CategoryState,
  DeletionLogEntry,
  IntuneObject,
} from "~/types/intune";
import { INTUNE_CATEGORIES } from "~/lib/intune/categories";

export type DeletionPhase = "idle" | "preview" | "confirming" | "deleting" | "complete";

interface NukeTuneState {
  // Auth state
  userDisplayName: string | null;
  tenantId: string | null;
  tenantName: string | null;

  // Categories state
  categories: CategoryState[];

  // Preview state
  previewOpen: boolean;

  // Deletion state
  deletionPhase: DeletionPhase;
  isPaused: boolean;
  deletionLog: DeletionLogEntry[];
  shouldCancel: boolean;

  // Actions
  setUser: (name: string | null, tenantId: string | null, tenantName: string | null) => void;
  initializeCategories: () => void;
  toggleCategory: (categoryId: string) => void;
  selectAllCategories: () => void;
  deselectAllCategories: () => void;
  setCategoryObjects: (categoryId: string, objects: IntuneObject[]) => void;
  toggleObjectSelection: (categoryId: string, objectId: string) => void;
  selectAllObjects: (categoryId: string) => void;
  deselectAllObjects: (categoryId: string) => void;
  setCategoryLoading: (categoryId: string, loading: boolean) => void;
  setCategoryError: (categoryId: string, error: string | null) => void;
  updateCategoryProgress: (
    categoryId: string,
    progress: number,
    deletedCount: number,
    failedCount: number
  ) => void;
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
  error: null,
  deletionProgress: 0,
  deletedCount: 0,
  failedCount: 0,
}));

export const useNukeTuneStore = create<NukeTuneState>()(
  devtools(
    (set) => ({
      // Initial state
      userDisplayName: null,
      tenantId: null,
      tenantName: null,
      categories: initialCategories,
      previewOpen: false,
      deletionPhase: "idle",
      isPaused: false,
      deletionLog: [],
      shouldCancel: false,

      // Actions
      setUser: (name, tenantId, tenantName) =>
        set({ userDisplayName: name, tenantId, tenantName }),

      initializeCategories: () =>
        set({
          categories: INTUNE_CATEGORIES.map((category) => ({
            category,
            selected: false,
            objects: [],
            loading: false,
            error: null,
            deletionProgress: 0,
            deletedCount: 0,
            failedCount: 0,
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
              ? { ...cat, objects: objects.map((obj) => ({ ...obj, selected: true })) }
              : cat
          ),
        })),

      toggleObjectSelection: (categoryId, objectId) =>
        set((state) => ({
          categories: state.categories.map((cat) =>
            cat.category.id === categoryId
              ? {
                  ...cat,
                  objects: cat.objects.map((obj) =>
                    obj.id === objectId ? { ...obj, selected: !obj.selected } : obj
                  ),
                }
              : cat
          ),
        })),

      selectAllObjects: (categoryId) =>
        set((state) => ({
          categories: state.categories.map((cat) =>
            cat.category.id === categoryId
              ? { ...cat, objects: cat.objects.map((obj) => ({ ...obj, selected: true })) }
              : cat
          ),
        })),

      deselectAllObjects: (categoryId) =>
        set((state) => ({
          categories: state.categories.map((cat) =>
            cat.category.id === categoryId
              ? { ...cat, objects: cat.objects.map((obj) => ({ ...obj, selected: false })) }
              : cat
          ),
        })),

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

      updateCategoryProgress: (categoryId, progress, deletedCount, failedCount) =>
        set((state) => ({
          categories: state.categories.map((cat) =>
            cat.category.id === categoryId
              ? { ...cat, deletionProgress: progress, deletedCount, failedCount }
              : cat
          ),
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
        }),
    }),
    { name: "NukeTuneStore" }
  )
);

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
  useNukeTuneStore(
    useShallow((state) => {
      const selected = state.categories.filter((cat) => cat.selected);
      return {
        totalDeleted: selected.reduce((sum, cat) => sum + cat.deletedCount, 0),
        totalFailed: selected.reduce((sum, cat) => sum + cat.failedCount, 0),
        totalObjects: selected.reduce((sum, cat) => sum + cat.objects.filter((obj) => obj.selected).length, 0),
      };
    })
  );
