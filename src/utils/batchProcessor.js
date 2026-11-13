/**
 * Thrown by a processor to signal that the user cancelled the run. Items that
 * end this way are reported as cancelled, never as failures.
 */
export class CancelledError extends Error {
  constructor() {
    super("Cancelled");
    this.name = "CancelledError";
  }
}

/**
 * @param {unknown} error
 * @returns {error is CancelledError}
 */
export function isCancelledError(error) {
  return error instanceof CancelledError;
}

/**
 * @template T
 * @typedef {{
 *   successful: T[],
 *   failed: Array<{ item: T, error: unknown }>,
 *   cancelled: T[],
 * }} BatchResult
 */

/**
 * @template T
 * @typedef {{
 *   batchSize?: number,
 *   onItemComplete?: (item: T, success: boolean, error?: unknown) => void,
 *   shouldContinue?: () => boolean,
 *   delayBetweenItems?: number,
 * }} BatchOptions
 */

/**
 * Runs `processor` over `items` in small concurrent batches.
 *
 * The original error object is passed to `onItemComplete` untouched so that
 * Graph status codes and error codes survive. Items whose processor throws a
 * CancelledError, or that are never started because `shouldContinue()`
 * returned false, are collected in `cancelled` and do not trigger
 * `onItemComplete`.
 *
 * @template T
 * @param {readonly T[]} items
 * @param {(item: T) => Promise<void>} processor
 * @param {BatchOptions<T>} [options]
 * @returns {Promise<BatchResult<T>>}
 */
export async function processBatch(items, processor, options = {}) {
  const {
    batchSize = 5,
    onItemComplete,
    shouldContinue = () => true,
    delayBetweenItems = 200,
  } = options;

  /** @type {BatchResult<T>} */
  const result = { successful: [], failed: [], cancelled: [] };

  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);

    if (!shouldContinue()) {
      result.cancelled.push(...items.slice(i));
      break;
    }

    await Promise.all(
      batch.map(async (item) => {
        if (!shouldContinue()) {
          result.cancelled.push(item);
          return;
        }

        try {
          await processor(item);
          result.successful.push(item);
          onItemComplete?.(item, true);
        } catch (error) {
          if (isCancelledError(error)) {
            result.cancelled.push(item);
            return;
          }
          result.failed.push({ item, error });
          onItemComplete?.(item, false, error);
        }
      }),
    );

    if (i + batchSize < items.length && shouldContinue() && delayBetweenItems > 0) {
      await new Promise((resolve) => setTimeout(resolve, delayBetweenItems));
    }
  }

  return result;
}
