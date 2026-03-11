/**
 * Translates raw ICP/canister error messages into user-friendly strings.
 */
export function cleanErrorMessage(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);
  const lower = msg.toLowerCase();
  if (
    lower.includes("ic0508") ||
    lower.includes("canister is stopped") ||
    lower.includes("canister stopped")
  ) {
    return "Server temporarily busy. Please try again.";
  }
  if (lower.includes("ic0503") || lower.includes("canister is overloaded")) {
    return "Server is busy. Please try again in a moment.";
  }
  if (
    lower.includes("reject") ||
    lower.includes("replica") ||
    lower.includes("ic0")
  ) {
    return "Connection interrupted. Retrying\u2026";
  }
  if (
    lower.includes("network") ||
    lower.includes("fetch") ||
    lower.includes("failed to fetch")
  ) {
    return "Network error \u2014 check your connection and try again.";
  }
  if (lower.includes("validation") || lower.includes("required")) {
    return msg;
  }
  return "Server temporarily busy. Please try again.";
}

/**
 * Retries an async function up to `maxRetries` times with exponential backoff.
 * Returns the result on success. Throws a clean error message on final failure.
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  baseDelayMs = 1000,
): Promise<T> {
  let lastErr: unknown;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      const msg = err instanceof Error ? err.message : String(err);
      const lower = msg.toLowerCase();
      const isTransient =
        lower.includes("ic0508") ||
        lower.includes("ic0503") ||
        lower.includes("canister") ||
        lower.includes("reject") ||
        lower.includes("replica") ||
        lower.includes("network") ||
        lower.includes("fetch");
      if (!isTransient) throw new Error(cleanErrorMessage(err));
      if (attempt < maxRetries - 1) {
        await new Promise((r) => setTimeout(r, baseDelayMs * 2 ** attempt));
      }
    }
  }
  throw new Error(cleanErrorMessage(lastErr));
}
