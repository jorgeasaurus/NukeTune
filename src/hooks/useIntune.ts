import { useCallback } from "react";
import { useMsal } from "@azure/msal-react";
import { useNukeTuneStore } from "~/store";
import {
  fetchCategoryObjects,
  deleteCategoryObjects,
  exportLogToCsv,
  downloadCsv,
} from "~/lib/intune/service";
import type { IntuneCategory } from "~/types/intune";

export function useIntune() {
  const { accounts } = useMsal();

  // Get stable action references from the store
  const setCategoryLoading = useNukeTuneStore((s) => s.setCategoryLoading);
  const setCategoryError = useNukeTuneStore((s) => s.setCategoryError);
  const setCategoryObjects = useNukeTuneStore((s) => s.setCategoryObjects);
  const setDeletionPhase = useNukeTuneStore((s) => s.setDeletionPhase);
  const clearLog = useNukeTuneStore((s) => s.clearLog);
  const updateCategoryProgress = useNukeTuneStore((s) => s.updateCategoryProgress);
  const addLogEntry = useNukeTuneStore((s) => s.addLogEntry);

  const loadCategoryObjects = useCallback(
    async (category: IntuneCategory) => {
      setCategoryLoading(category.id, true);
      setCategoryError(category.id, null);

      try {
        const objects = await fetchCategoryObjects(category);
        setCategoryObjects(category.id, objects);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to fetch objects";
        setCategoryError(category.id, message);
      } finally {
        setCategoryLoading(category.id, false);
      }
    },
    [setCategoryLoading, setCategoryError, setCategoryObjects]
  );

  const loadSelectedCategories = useCallback(async () => {
    // Get fresh state when called
    const { categories } = useNukeTuneStore.getState();
    const selected = categories.filter((cat) => cat.selected);
    await Promise.all(selected.map((cat) => loadCategoryObjects(cat.category)));
  }, [loadCategoryObjects]);

  const startDeletion = useCallback(async () => {
    setDeletionPhase("deleting");
    clearLog();

    // Get fresh state when called
    const getState = () => useNukeTuneStore.getState();
    const selected = getState().categories.filter((cat) => cat.selected && cat.objects.length > 0);

    for (const catState of selected) {
      if (getState().shouldCancel) break;

      await deleteCategoryObjects(catState.category, catState.objects, {
        onProgress: (categoryId, completed, total) => {
          const progress = total > 0 ? (completed / total) * 100 : 0;
          const existing = getState().categories.find((c) => c.category.id === categoryId);
          updateCategoryProgress(
            categoryId,
            progress,
            existing?.deletedCount ?? 0,
            existing?.failedCount ?? 0
          );
        },
        onItemComplete: (entry) => {
          addLogEntry(entry);
          const currentCatState = getState().categories.find(
            (c) => c.category.id === entry.categoryId
          );
          if (currentCatState) {
            const newDeleted = entry.status === "success" ? currentCatState.deletedCount + 1 : currentCatState.deletedCount;
            const newFailed = entry.status === "error" ? currentCatState.failedCount + 1 : currentCatState.failedCount;
            updateCategoryProgress(
              entry.categoryId,
              currentCatState.deletionProgress,
              newDeleted,
              newFailed
            );
          }
        },
        shouldContinue: () => !getState().shouldCancel,
        isPaused: () => getState().isPaused,
      });
    }

    setDeletionPhase("complete");
  }, [setDeletionPhase, clearLog, updateCategoryProgress, addLogEntry]);

  const exportLog = useCallback(() => {
    const { deletionLog } = useNukeTuneStore.getState();
    const csv = exportLogToCsv(deletionLog);
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    downloadCsv(csv, `nuketune-deletion-log-${timestamp}.csv`);
  }, []);

  const getUserInfo = useCallback(() => {
    const account = accounts[0];
    if (account) {
      return {
        name: account.name ?? account.username,
        tenantId: account.tenantId,
        username: account.username,
      };
    }
    return null;
  }, [accounts]);

  return {
    loadCategoryObjects,
    loadSelectedCategories,
    startDeletion,
    exportLog,
    getUserInfo,
  };
}
