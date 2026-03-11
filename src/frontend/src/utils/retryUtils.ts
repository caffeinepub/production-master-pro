import { toast } from "sonner";

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
  if (lower.includes("overloaded") || lower.includes("busy")) {
    return "Server is currently overloaded. Please try again in a few seconds.";
  }
  return "Server temporarily busy. Please try again.";
}

/**
 * Checks if an error is a transient canister/network error worth retrying.
 */
function isTransientError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  const lower = msg.toLowerCase();
  return (
    lower.includes("ic0508") ||
    lower.includes("ic0503") ||
    lower.includes("ic0") ||
    lower.includes("canister") ||
    lower.includes("reject") ||
    lower.includes("replica") ||
    lower.includes("network") ||
    lower.includes("fetch") ||
    lower.includes("busy") ||
    lower.includes("overloaded") ||
    lower.includes("temporarily") ||
    lower.includes("timeout") ||
    lower.includes("connection")
  );
}

/**
 * Retries an async function up to `maxRetries` times with exponential backoff.
 * - Attempt 1: immediate
 * - Attempt 2: 2s delay
 * - Attempt 3: 5s delay
 * - Attempt 4: 10s delay
 * - Attempt 5: 20s delay
 *
 * Shows a toast while retrying. Throws a clean error on final failure.
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 5,
  _delayMs = 2000, // kept for backward-compat, not used directly
): Promise<T> {
  // Exponential delays in ms
  const delays = [0, 2000, 5000, 10000, 20000];

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      // Wait before retrying (0 delay on first attempt)
      if (attempt > 0) {
        const delay = delays[attempt] ?? 20000;
        toast.loading(
          `Server is busy right now. Retrying automatically... (attempt ${attempt}/${maxRetries - 1})`,
          { id: "retry-toast", duration: delay + 1000 },
        );
        await new Promise((r) => setTimeout(r, delay));
      }

      const result = await fn();
      // Dismiss any retry toast on success
      if (attempt > 0) toast.dismiss("retry-toast");
      return result;
    } catch (err) {
      if (!isTransientError(err)) {
        toast.dismiss("retry-toast");
        throw new Error(cleanErrorMessage(err));
      }
      // If this was the last attempt, give up
      if (attempt === maxRetries - 1) {
        toast.dismiss("retry-toast");
        throw new Error(
          "Server is currently overloaded. Please wait a moment and try again.",
        );
      }
      // Otherwise loop to next attempt
    }
  }

  // Should never reach here
  throw new Error(
    "Server is currently overloaded. Please wait a moment and try again.",
  );
}

/**
 * Warms up the canister by making a lightweight query call.
 * This helps wake up an idle canister before running an update call.
 */
export async function warmupCanister(
  actor: Record<string, (...args: unknown[]) => Promise<unknown>> | null,
): Promise<void> {
  if (!actor) return;
  try {
    // Use a lightweight query to wake the canister
    if (typeof actor.getItemMasters === "function") {
      await Promise.race([
        actor.getItemMasters(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("warmup timeout")), 8000),
        ),
      ]);
    }
  } catch {
    // Warmup failure is non-critical; proceed anyway
  }
}
