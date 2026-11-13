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
      // A fetch that outlives its session (sign-out or account switch resets
      // the store) must not write the previous tenant's objects, error or
      // loading state into the new session.
      const sessionEpoch = useNukeTuneStore.getState().sessionEpoch;
      const sessionActive = () =>
        useNukeTuneStore.getState().sessionEpoch === sessionEpoch;

      // The previous error is kept until the request settles: clearing it up
      // front would drop a category being retried out of the preview's
      // failure list (and its unknown-count warning) while it is in flight.
      setCategoryLoading(category.id, true);

      try {
        const objects = await fetchCategoryObjects(category);
        if (sessionActive()) {
          setCategoryObjects(category.id, objects);
          setCategoryError(category.id, null);
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to fetch objects";
        if (sessionActive()) setCategoryError(category.id, message);
      } finally {
        if (sessionActive()) setCategoryLoading(category.id, false);
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
    // The store is reset when the account changes or signs out. A run that
    // outlives its session must stop issuing deletes and must not write its
    // progress or completion into the next session's state.
    const sessionEpoch = getState().sessionEpoch;
    const sessionActive = () => getState().sessionEpoch === sessionEpoch;
    const selected = getState().categories.filter((cat) => cat.selected && cat.objects.some((obj) => obj.selected));

    for (const catState of selected) {
      if (!sessionActive() || getState().shouldCancel) break;

      // Only delete selected objects within the category
      const objectsToDelete = catState.objects.filter((obj) => obj.selected);
      await deleteCategoryObjects(catState.category, objectsToDelete, {
        onProgress: (categoryId, completed, total) => {
          if (!sessionActive()) return;
          const progress = total > 0 ? (completed / total) * 100 : 0;
          const existing = getState().categories.find((c) => c.category.id === categoryId);
          updateCategoryProgress(
            categoryId,
            progress,
            existing?.deletedCount ?? 0,
            existing?.failedCount ?? 0,
            existing?.skippedCount ?? 0
          );
        },
        onItemComplete: (entry) => {
          if (!sessionActive()) return;
          addLogEntry(entry);
          const currentCatState = getState().categories.find(
            (c) => c.category.id === entry.categoryId
          );
          if (currentCatState) {
            const newDeleted = entry.status === "success" ? currentCatState.deletedCount + 1 : currentCatState.deletedCount;
            const newFailed = entry.status === "error" ? currentCatState.failedCount + 1 : currentCatState.failedCount;
            const newSkipped = entry.status === "skipped" ? currentCatState.skippedCount + 1 : currentCatState.skippedCount;
            updateCategoryProgress(
              entry.categoryId,
              currentCatState.deletionProgress,
              newDeleted,
              newFailed,
              newSkipped
            );
          }
        },
        shouldContinue: () => sessionActive() && !getState().shouldCancel,
        isPaused: () => getState().isPaused,
      });
    }

    if (sessionActive()) setDeletionPhase("complete");
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
