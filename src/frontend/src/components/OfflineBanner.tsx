import { AlertTriangle, CheckCircle2, WifiOff } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useOfflineMode } from "../hooks/useOfflineMode";

export function OfflineBanner() {
  const { isOffline, isServerBusy, pendingCount, showSyncCompleted } =
    useOfflineMode();

  const showOfflineBanner = isOffline || isServerBusy;

  return (
    <AnimatePresence mode="wait">
      {showSyncCompleted && !showOfflineBanner ? (
        <motion.div
          key="sync-completed"
          data-ocid="offline_banner.panel"
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.25, ease: "easeInOut" }}
          className="overflow-hidden"
          style={{
            background: "oklch(0.22 0.04 145)",
            borderBottom: "1px solid oklch(0.65 0.15 145 / 0.4)",
          }}
        >
          <div className="flex items-center gap-2 px-4 py-2">
            <CheckCircle2
              className="w-3.5 h-3.5 shrink-0"
              style={{ color: "oklch(0.72 0.18 145)" }}
            />
            <p
              className="text-xs font-semibold"
              style={{ color: "oklch(0.85 0.12 145)" }}
            >
              Sync Completed – all pending records uploaded.
            </p>
          </div>
        </motion.div>
      ) : showOfflineBanner ? (
        <motion.div
          key="offline-banner"
          data-ocid="offline_banner.panel"
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.25, ease: "easeInOut" }}
          className="overflow-hidden"
          style={{
            background: "oklch(0.22 0.05 85)",
            borderBottom: "1px solid oklch(0.75 0.15 85 / 0.4)",
          }}
        >
          <div className="flex items-center gap-2 px-4 py-2">
            {isOffline ? (
              <WifiOff
                className="w-3.5 h-3.5 shrink-0"
                style={{ color: "oklch(0.82 0.14 85)" }}
              />
            ) : (
              <AlertTriangle
                className="w-3.5 h-3.5 shrink-0"
                style={{ color: "oklch(0.82 0.14 85)" }}
              />
            )}
            <p
              className="text-xs font-semibold"
              style={{ color: "oklch(0.9 0.1 85)" }}
            >
              {isOffline
                ? "Offline Mode Active \u2013 Data will sync when server reconnects."
                : "Server Busy \u2013 Working in offline mode. Data queued for sync."}
              {pendingCount > 0 && (
                <span
                  className="ml-2 font-normal"
                  style={{ color: "oklch(0.78 0.12 85)" }}
                >
                  ({pendingCount} record{pendingCount !== 1 ? "s" : ""} pending
                  sync)
                </span>
              )}
            </p>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
