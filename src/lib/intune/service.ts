import { graphGetAllPages, graphDelete, parseGraphError } from "../graph/graphClient";
import { isProtectedObject } from "./categories";
import type { IntuneObject, IntuneCategory, DeletionLogEntry } from "~/types/intune";
import { processBatch } from "~/utils/batchProcessor";

export async function fetchCategoryObjects(
  category: IntuneCategory
): Promise<IntuneObject[]> {
  const objects = await graphGetAllPages<IntuneObject>(
    category.listEndpoint,
    category.useBeta
  );

  return objects.map((obj) => ({
    ...obj,
    _categoryId: category.id,
    _categoryName: category.name,
  }));
}

export async function deleteObject(
  category: IntuneCategory,
  objectId: string
): Promise<void> {
  await graphDelete(`${category.deleteEndpoint}/${objectId}`, category.useBeta);
}

export interface DeletionOptions {
  onProgress?: (categoryId: string, completed: number, total: number) => void;
  onItemComplete?: (entry: DeletionLogEntry) => void;
  shouldContinue?: () => boolean;
  isPaused?: () => boolean;
}

export async function deleteCategoryObjects(
  category: IntuneCategory,
  objects: IntuneObject[],
  options: DeletionOptions = {}
): Promise<{ deleted: number; failed: number; skipped: number }> {
  const { onProgress, onItemComplete, shouldContinue = () => true, isPaused = () => false } = options;

  let deleted = 0;
  let failed = 0;
  let skipped = 0;

  const filteredObjects = objects.filter((obj) => {
    const name = obj.displayName ?? obj.name ?? "";

    if (isProtectedObject(name)) {
      skipped++;
      onItemComplete?.({
        timestamp: new Date(),
        categoryId: category.id,
        categoryName: category.name,
        objectId: obj.id,
        objectName: name,
        status: "skipped",
        message: "Protected object (built-in or system managed)",
      });
      return false;
    }

    if (category.cannotDelete?.some((pattern) => name.includes(pattern))) {
      skipped++;
      onItemComplete?.({
        timestamp: new Date(),
        categoryId: category.id,
        categoryName: category.name,
        objectId: obj.id,
        objectName: name,
        status: "skipped",
        message: "Cannot be deleted (system default)",
      });
      return false;
    }

    if ((obj as Record<string, unknown>).isBuiltIn === true) {
      skipped++;
      onItemComplete?.({
        timestamp: new Date(),
        categoryId: category.id,
        categoryName: category.name,
        objectId: obj.id,
        objectName: name,
        status: "skipped",
        message: "Built-in object",
      });
      return false;
    }

    return true;
  });

  await processBatch(
    filteredObjects,
    async (obj) => {
      while (isPaused()) {
        await new Promise((resolve) => setTimeout(resolve, 500));
        if (!shouldContinue()) throw new Error("Cancelled");
      }

      if (!shouldContinue()) throw new Error("Cancelled");

      await deleteObject(category, obj.id);
    },
    {
      batchSize: 3,
      delayBetweenItems: 300,
      shouldContinue,
      onProgress: (completed, _total) => {
        onProgress?.(category.id, completed + skipped, objects.length);
      },
      onItemComplete: (obj, success, error) => {
        const name = obj.displayName ?? obj.name ?? obj.id;
        if (success) {
          deleted++;
          onItemComplete?.({
            timestamp: new Date(),
            categoryId: category.id,
            categoryName: category.name,
            objectId: obj.id,
            objectName: name,
            status: "success",
          });
        } else {
          failed++;
          const graphError = parseGraphError(new Error(error));
          onItemComplete?.({
            timestamp: new Date(),
            categoryId: category.id,
            categoryName: category.name,
            objectId: obj.id,
            objectName: name,
            status: "error",
            message: graphError.message,
          });
        }
      },
    }
  );

  return { deleted, failed, skipped };
}

export function exportLogToCsv(log: DeletionLogEntry[]): string {
  const headers = ["Timestamp", "Category", "Object ID", "Object Name", "Status", "Message"];
  const rows = log.map((entry) => [
    entry.timestamp.toISOString(),
    entry.categoryName,
    entry.objectId,
    entry.objectName,
    entry.status,
    entry.message ?? "",
  ]);

  const csvContent = [
    headers.join(","),
    ...rows.map((row) =>
      row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
    ),
  ].join("\n");

  return csvContent;
}

export function downloadCsv(content: string, filename: string): void {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}
