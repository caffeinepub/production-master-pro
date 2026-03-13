import { useEffect, useState } from "react";
import { getPendingCount } from "../utils/syncQueue";

export interface OfflineModeState {
  isOffline: boolean;
  isServerBusy: boolean;
  pendingCount: number;
  markServerBusy: () => void;
  markServerOnline: () => void;
  showSyncCompleted: boolean;
}

export function useOfflineMode(): OfflineModeState {
  const [isOffline, setIsOffline] = useState(() => !navigator.onLine);
  const [isServerBusy, setIsServerBusy] = useState(false);
  const [pendingCount, setPendingCount] = useState(() => getPendingCount());
  const [showSyncCompleted, setShowSyncCompleted] = useState(false);

  const markServerBusy = () => setIsServerBusy(true);
  const markServerOnline = () => setIsServerBusy(false);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    const handleServerBusy = () => setIsServerBusy(true);
    const handleServerOnline = () => setIsServerBusy(false);
    const handleQueueChanged = () => setPendingCount(getPendingCount());
    const handleSyncCompleted = () => {
      setIsServerBusy(false);
      setPendingCount(getPendingCount());
      setShowSyncCompleted(true);
      setTimeout(() => setShowSyncCompleted(false), 3000);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    window.addEventListener("serverBusy", handleServerBusy);
    window.addEventListener("serverOnline", handleServerOnline);
    window.addEventListener("syncQueueChanged", handleQueueChanged);
    window.addEventListener("syncCompleted", handleSyncCompleted);

    const interval = setInterval(
      () => setPendingCount(getPendingCount()),
      5000,
    );

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("serverBusy", handleServerBusy);
      window.removeEventListener("serverOnline", handleServerOnline);
      window.removeEventListener("syncQueueChanged", handleQueueChanged);
      window.removeEventListener("syncCompleted", handleSyncCompleted);
      clearInterval(interval);
    };
  }, []);

  return {
    isOffline,
    isServerBusy,
    pendingCount,
    markServerBusy,
    markServerOnline,
    showSyncCompleted,
  };
}
