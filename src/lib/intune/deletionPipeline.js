import { getProtectionReason } from "./protection.js";
import { processBatch, CancelledError } from "../../utils/batchProcessor.js";

/**
 * The per-category deletion pipeline: protection re-check, batching,
 * pause/cancel and log entries. The Graph-specific parts (the delete call and
 * error formatting) are injected so this module stays pure and testable.
 *
 * @typedef {import("../../types/intune").IntuneCategory} IntuneCategory
 * @typedef {import("../../types/intune").IntuneObject} IntuneObject
 * @typedef {import("../../types/intune").DeletionLogEntry} DeletionLogEntry
 * @typedef {"deleted" | "not-found" | "simulated"} DeleteOutcome
 * @typedef {(category: IntuneCategory, objectId: string) => Promise<DeleteOutcome>} DeleteObjectFn
 *
 * @typedef {{
 *   deleteObject: DeleteObjectFn,
 *   dryRun?: boolean,
 *   formatError?: (error: unknown) => string,
 *   onItemComplete?: (entry: DeletionLogEntry) => void,
 *   shouldContinue?: () => boolean,
 *   isPaused?: () => boolean,
 *   batchSize?: number,
 *   delayBetweenItems?: number,
 *   pausePollInterval?: number,
 * }} PipelineOptions
 *
 * @typedef {{ deleted: number, failed: number, skipped: number, cancelled: number }} PipelineResult
 */

export const DRY_RUN_MESSAGE = "Dry run — not deleted";

/**
 * Stand-in for the delete call during a dry run. It makes no Graph request.
 *
 * @type {DeleteObjectFn}
 */
export async function simulateDelete() {
  return "simulated";
}

/**
 * The single place where a dry run diverges from a real run: the delete call
 * is swapped for a no-op. Everything around it is identical.
 *
 * @param {DeleteObjectFn} deleteObject
 * @param {boolean} dryRun
 * @returns {DeleteObjectFn}
 */
export function resolveDeleteFn(deleteObject, dryRun) {
  return dryRun ? simulateDelete : deleteObject;
}

/**
 * @param {unknown} error
 * @returns {string}
 */
function defaultFormatError(error) {
  return error instanceof Error ? error.message : String(error);
}

/**
 * @param {IntuneCategory} category
 * @param {readonly IntuneObject[]} objects
 * @param {PipelineOptions} options
 * @returns {Promise<PipelineResult>}
 */
export async function runCategoryDeletion(category, objects, options) {
  const {
    dryRun = false,
    formatError = defaultFormatError,
    onItemComplete,
    shouldContinue = () => true,
    isPaused = () => false,
    batchSize = 3,
    delayBetweenItems = 300,
    pausePollInterval = 500,
  } = options;
  const remove = resolveDeleteFn(options.deleteObject, dryRun);

  let deleted = 0;
  let failed = 0;
  let skipped = 0;

  /**
   * @param {IntuneObject} obj
   * @param {DeletionLogEntry["status"]} status
   * @param {string} [message]
   * @returns {DeletionLogEntry}
   */
  const entry = (obj, status, message) => ({
    timestamp: new Date(),
    categoryId: category.id,
    categoryName: category.name,
    objectId: obj.id,
    objectName: obj.displayName ?? obj.name ?? obj.id,
    status,
    ...(message ? { message } : {}),
    ...(dryRun ? { dryRun: true } : {}),
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

  /** @type {Map<string, DeleteOutcome>} */
  const outcomes = new Map();

  const result = await processBatch(
    deletable,
    async (obj) => {
      while (isPaused()) {
        await new Promise((resolve) => setTimeout(resolve, pausePollInterval));
        if (!shouldContinue()) throw new CancelledError();
      }

      if (!shouldContinue()) throw new CancelledError();

      outcomes.set(obj.id, await remove(category, obj.id));
    },
    {
      batchSize,
      delayBetweenItems,
      shouldContinue,
      onItemComplete: (obj, success, error) => {
        if (success) {
          deleted++;
          const outcome = outcomes.get(obj.id);
          const message =
            outcome === "simulated"
              ? DRY_RUN_MESSAGE
              : outcome === "not-found"
                ? "Already removed (404)"
                : undefined;
          onItemComplete?.(entry(obj, "success", message));
        } else {
          failed++;
          onItemComplete?.(entry(obj, "error", formatError(error)));
        }
      },
    },
  );

  return { deleted, failed, skipped, cancelled: result.cancelled.length };
}
