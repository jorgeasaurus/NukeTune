import { graphGetAllPages, graphDelete, parseGraphError } from "../graph/graphClient";
import { getProtectionReason } from "./protection";
import { buildListEndpoint } from "./endpoints";
import type { IntuneObject, IntuneCategory, DeletionLogEntry } from "~/types/intune";
import { processBatch, CancelledError } from "~/utils/batchProcessor";
export { exportLogToCsv } from "~/utils/csv";

export async function fetchCategoryObjects(
  category: IntuneCategory
): Promise<IntuneObject[]> {
  const objects = await graphGetAllPages<IntuneObject>(
    buildListEndpoint(category.listEndpoint, category.filter),
    category.useBeta
  );

  return objects.map((obj) => {
    const protectedReason = getProtectionReason(category.id, obj);
    return {
      ...obj,
      _categoryId: category.id,
      _categoryName: category.name,
      ...(protectedReason ? { _protectedReason: protectedReason } : {}),
    };
  });
}

function isNotFound(error: unknown): boolean {
  return parseGraphError(error).statusCode === 404;
}

async function deleteIgnoringNotFound(endpoint: string, useBeta: boolean): Promise<"deleted" | "not-found"> {
  try {
    await graphDelete(endpoint, useBeta);
    return "deleted";
  } catch (error) {
    if (isNotFound(error)) return "not-found";
    throw error;
  }
}

async function deleteObjectAssignments(
  category: IntuneCategory,
  objectId: string
): Promise<void> {
  const base = `${category.deleteEndpoint}/${objectId}/assignments`;
  const assignments = await graphGetAllPages<IntuneObject>(base, category.useBeta);
  for (const assignment of assignments) {
    await deleteIgnoringNotFound(`${base}/${assignment.id}`, category.useBeta);
  }
}

/**
 * Deletes one object (and its assignments first, when the category needs it).
 * A 404 means the object is already gone and is reported as "not-found"
 * rather than thrown.
 */
export async function deleteObject(
  category: IntuneCategory,
  objectId: string
): Promise<"deleted" | "not-found"> {
  if (category.deleteAssignmentsFirst) {
    try {
      await deleteObjectAssignments(category, objectId);
    } catch (error) {
      if (isNotFound(error)) return "not-found";
      throw error;
    }
  }
  return deleteIgnoringNotFound(`${category.deleteEndpoint}/${objectId}`, category.useBeta);
}

export interface DeletionOptions {
  onItemComplete?: (entry: DeletionLogEntry) => void;
  shouldContinue?: () => boolean;
  isPaused?: () => boolean;
}

function formatGraphError(error: unknown): string {
  const graphError = parseGraphError(error);
  return graphError.code && graphError.code !== "UnknownError"
    ? `${graphError.code}: ${graphError.message}`
    : graphError.message;
}

export async function deleteCategoryObjects(
  category: IntuneCategory,
  objects: IntuneObject[],
  options: DeletionOptions = {}
): Promise<{ deleted: number; failed: number; skipped: number; cancelled: number }> {
  const { onItemComplete, shouldContinue = () => true, isPaused = () => false } = options;

  let deleted = 0;
  let failed = 0;
  let skipped = 0;

  const entry = (
    obj: IntuneObject,
    status: DeletionLogEntry["status"],
    message?: string
  ): DeletionLogEntry => ({
    timestamp: new Date(),
    categoryId: category.id,
    categoryName: category.name,
    objectId: obj.id,
    objectName: obj.displayName ?? obj.name ?? obj.id,
    status,
    ...(message ? { message } : {}),
  });

  // Defence in depth: protected objects should never be selected, but
  // re-check right before deleting.
  const deletable = objects.filter((obj) => {
    const reason = obj._protectedReason ?? getProtectionReason(category.id, obj);
    if (reason) {
      skipped++;
      onItemComplete?.(entry(obj, "skipped", `Protected: ${reason}`));
      return false;
    }
    return true;
  });

  const notFound = new Set<string>();

  const result = await processBatch(
    deletable,
    async (obj) => {
      while (isPaused()) {
        await new Promise((resolve) => setTimeout(resolve, 500));
        if (!shouldContinue()) throw new CancelledError();
      }

      if (!shouldContinue()) throw new CancelledError();

      if ((await deleteObject(category, obj.id)) === "not-found") {
        notFound.add(obj.id);
      }
    },
    {
      batchSize: 3,
      delayBetweenItems: 300,
      shouldContinue,
      onItemComplete: (obj, success, error) => {
        if (success) {
          deleted++;
          onItemComplete?.(
            entry(obj, "success", notFound.has(obj.id) ? "Already removed (404)" : undefined)
          );
        } else {
          failed++;
          onItemComplete?.(entry(obj, "error", formatGraphError(error)));
        }
      },
    }
  );

  return { deleted, failed, skipped, cancelled: result.cancelled.length };
}

export function downloadCsv(content: string, filename: string): void {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}
