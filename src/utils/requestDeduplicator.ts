// Request Deduplication Utility
// Prevents duplicate requests from being made simultaneously
// Useful for React components that might trigger the same request multiple times

/**
 * Pending requests cache
 * Key: unique request identifier
 * Value: Promise for that request
 */
const pendingRequests = new Map<string, Promise<any>>();

/**
 * Deduplicated Request
 * If the same request is already in progress, returns the existing promise
 * Otherwise, executes the request and caches the promise
 * 
 * @param key - Unique identifier for the request
 * @param fn - Function that returns a promise for the request
 * @returns Promise with the request result
 * 
 * @example
 * ```typescript
 * // Multiple components call this simultaneously
 * const data = await deduplicatedRequest(
 *   'user-123',
 *   () => fetch('/api/users/123').then(r => r.json())
 * );
 * // Only ONE actual request is made, all callers get the same promise
 * ```
 */
export async function deduplicatedRequest<T>(
  key: string,
  fn: () => Promise<T>
): Promise<T> {
  // Check if request is already in progress
  if (pendingRequests.has(key)) {
    console.log(`🔄 Deduplicating request: ${key}`);
    return pendingRequests.get(key) as Promise<T>;
  }

  // Start new request
  const promise = fn().finally(() => {
    // Clean up after request completes (success or failure)
    pendingRequests.delete(key);
  });

  // Cache the promise
  pendingRequests.set(key, promise);
  
  return promise;
}

/**
 * Clear all pending requests
 * Useful for testing or cleanup
 */
export function clearPendingRequests(): void {
  pendingRequests.clear();
  console.log('🧹 Cleared all pending requests');
}

/**
 * Get number of pending requests
 * Useful for debugging
 */
export function getPendingRequestCount(): number {
  return pendingRequests.size;
}

/**
 * Check if a specific request is pending
 */
export function isRequestPending(key: string): boolean {
  return pendingRequests.has(key);
}

/**
 * Batch Deduplicator
 * Collects multiple requests and executes them as a single batch after a delay
 * Useful for GraphQL queries that can be batched
 */
export class BatchDeduplicator<T> {
  private queue: Set<string> = new Set();
  private timeout: NodeJS.Timeout | null = null;
  private readonly delay: number;
  private readonly batchFn: (keys: string[]) => Promise<Map<string, T>>;
  private pendingResolvers = new Map<string, {
    resolve: (value: T) => void;
    reject: (error: any) => void;
  }>();

  constructor(
    batchFn: (keys: string[]) => Promise<Map<string, T>>,
    delay: number = 50 // 50ms default delay
  ) {
    this.batchFn = batchFn;
    this.delay = delay;
  }

  /**
   * Add item to batch
   * Returns a promise that resolves when the batch is processed
   */
  async add(key: string): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      // Add to queue
      this.queue.add(key);
      this.pendingResolvers.set(key, { resolve, reject });

      // Reset timeout
      if (this.timeout) {
        clearTimeout(this.timeout);
      }

      // Schedule batch execution
      this.timeout = setTimeout(() => {
        this.executeBatch();
      }, this.delay);
    });
  }

  /**
   * Execute the batch
   */
  private async executeBatch(): Promise<void> {
    if (this.queue.size === 0) return;

    const keys = Array.from(this.queue);
    const resolvers = new Map(this.pendingResolvers);

    // Clear queue and resolvers
    this.queue.clear();
    this.pendingResolvers.clear();
    this.timeout = null;

    try {
      console.log(`📦 Executing batch with ${keys.length} items`);
      const results = await this.batchFn(keys);

      // Resolve individual promises
      keys.forEach(key => {
        const resolver = resolvers.get(key);
        if (resolver) {
          const result = results.get(key);
          if (result !== undefined) {
            resolver.resolve(result);
          } else {
            resolver.reject(new Error(`No result for key: ${key}`));
          }
        }
      });
    } catch (error) {
      // Reject all pending promises on batch error
      keys.forEach(key => {
        const resolver = resolvers.get(key);
        if (resolver) {
          resolver.reject(error);
        }
      });
    }
  }

  /**
   * Clear the batch queue
   */
  clear(): void {
    if (this.timeout) {
      clearTimeout(this.timeout);
      this.timeout = null;
    }
    this.queue.clear();
    
    // Reject all pending resolvers
    this.pendingResolvers.forEach(({ reject }) => {
      reject(new Error('Batch cleared'));
    });
    this.pendingResolvers.clear();
  }
}
