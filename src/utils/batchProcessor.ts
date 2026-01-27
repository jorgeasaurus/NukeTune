export interface BatchResult<T> {
  successful: T[];
  failed: Array<{ item: T; error: string }>;
}

export interface BatchOptions<T> {
  batchSize?: number;
  onProgress?: (completed: number, total: number) => void;
  onItemComplete?: (item: T, success: boolean, error?: string) => void;
  shouldContinue?: () => boolean;
  delayBetweenItems?: number;
}

export async function processBatch<T>(
  items: T[],
  processor: (item: T) => Promise<void>,
  options: BatchOptions<T> = {}
): Promise<BatchResult<T>> {
  const {
    batchSize = 5,
    onProgress,
    onItemComplete,
    shouldContinue = () => true,
    delayBetweenItems = 200,
  } = options;

  const result: BatchResult<T> = { successful: [], failed: [] };
  let completed = 0;

  for (let i = 0; i < items.length; i += batchSize) {
    if (!shouldContinue()) break;

    const batch = items.slice(i, i + batchSize);

    await Promise.all(
      batch.map(async (item) => {
        if (!shouldContinue()) return;

        try {
          await processor(item);
          result.successful.push(item);
          onItemComplete?.(item, true);
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : "Unknown error";
          result.failed.push({ item, error: errorMessage });
          onItemComplete?.(item, false, errorMessage);
        }

        completed++;
        onProgress?.(completed, items.length);
      })
    );

    if (i + batchSize < items.length && shouldContinue()) {
      await new Promise((resolve) => setTimeout(resolve, delayBetweenItems));
    }
  }

  return result;
}

export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  initialDelay = 1000
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      if (attempt === maxRetries - 1) {
        throw error;
      }

      const delay = initialDelay * Math.pow(2, attempt);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError ?? new Error("Max retries exceeded");
}
