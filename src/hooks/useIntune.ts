import { useCallback } from "react";
import { useMsal } from "@azure/msal-react";
import { useNukeTuneStore } from "~/store";
import {
  fetchCategoryObjects,
  deleteCategoryObjects,
  exportLogToCsv,
  downloadCsv,
  downloadJson,
} from "~/lib/intune/service";
import type { IntuneCategory } from "~/types/intune";
import { buildDeletionPlan, type DeletionPlanMode } from "~/utils/deletionRun";
import {
  buildExportFilename,
  buildInventory,
  inventoryToCsv,
  inventoryToJson,
  type InventoryTenant,
} from "~/utils/inventory";

export function useIntune() {
  const { accounts } = useMsal();

  // Get stable action references from the store
  const setCategoryLoading = useNukeTuneStore((s) => s.setCategoryLoading);
  const setCategoryError = useNukeTuneStore((s) => s.setCategoryError);
  const setCategoryObjects = useNukeTuneStore((s) => s.setCategoryObjects);
  const setDeletionPhase = useNukeTuneStore((s) => s.setDeletionPhase);
  const clearLog = useNukeTuneStore((s) => s.clearLog);
  const beginDeletionRun = useNukeTuneStore((s) => s.beginDeletionRun);
  const recordDeletionResult = useNukeTuneStore((s) => s.recordDeletionResult);

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

  const runDeletion = useCallback(
    async (mode: DeletionPlanMode, dryRun: boolean) => {
      const getState = () => useNukeTuneStore.getState();
      const plan = buildDeletionPlan(getState().categories, mode);

      // Single source of truth: the store derives all counts from
      // recordDeletionResult; nothing here does read-modify-write.
      beginDeletionRun(plan, { dryRun });

      for (const { categoryId, objectIds } of plan) {
        if (getState().shouldCancel) break;

        const catState = getState().categories.find((c) => c.category.id === categoryId);
        if (!catState) continue;

        const ids = new Set(objectIds);
        const objectsToDelete = catState.objects.filter((obj) => ids.has(obj.id));
        await deleteCategoryObjects(catState.category, objectsToDelete, {
          onItemComplete: recordDeletionResult,
          shouldContinue: () => !getState().shouldCancel,
          isPaused: () => getState().isPaused,
          dryRun,
        });
      }

      setDeletionPhase("complete");
    },
    [beginDeletionRun, recordDeletionResult, setDeletionPhase]
  );

  /**
   * Runs the selected objects through the deletion pipeline. With
   * `dryRun`, every step runs except the Graph delete itself.
   */
  const startDeletion = useCallback(
    async (options: { dryRun?: boolean } = {}) => {
      clearLog();
      await runDeletion("selected", options.dryRun ?? false);
    },
    [clearLog, runDeletion]
  );

  /** Re-runs deletion for only the objects that failed in the last run. */
  const retryFailed = useCallback(async () => {
    await runDeletion("failed", useNukeTuneStore.getState().dryRun);
  }, [runDeletion]);

  const exportLog = useCallback(() => {
    const { deletionLog, dryRun } = useNukeTuneStore.getState();
    const csv = exportLogToCsv(deletionLog);
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    downloadCsv(csv, `nuketune-${dryRun ? "dry-run" : "deletion"}-log-${timestamp}.csv`);
  }, []);

  /**
   * Downloads the loaded objects of the selected categories. This is an
   * inventory of list properties, not a restorable backup.
   */
  const exportInventory = useCallback((format: "json" | "csv", tenant: InventoryTenant) => {
    const categories = useNukeTuneStore.getState().categories.filter((cat) => cat.selected);
    const now = new Date();
    const filename = buildExportFilename("inventory", tenant, now, format);
    if (format === "json") {
      downloadJson(inventoryToJson(buildInventory({ categories, tenant, exportedAt: now })), filename);
    } else {
      downloadCsv(inventoryToCsv(categories), filename);
    }
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
    retryFailed,
    exportLog,
    exportInventory,
    getUserInfo,
  };
}
