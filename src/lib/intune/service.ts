import { graphGetAllPages, graphDelete, parseGraphError } from "../graph/graphClient";
import { getProtectionReason } from "./protection";
import { buildListEndpoint } from "./endpoints";
import type { IntuneObject, IntuneCategory, DeletionLogEntry } from "~/types/intune";
import { runCategoryDeletion } from "./deletionPipeline";
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
  /** Run the whole pipeline but replace the Graph delete with a no-op. */
  dryRun?: boolean;
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
  return runCategoryDeletion(category, objects, {
    ...options,
    deleteObject,
    formatError: formatGraphError,
  });
}

export function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}

export function downloadCsv(content: string, filename: string): void {
  downloadFile(content, filename, "text/csv;charset=utf-8;");
}

export function downloadJson(content: string, filename: string): void {
  downloadFile(content, filename, "application/json;charset=utf-8;");
}
