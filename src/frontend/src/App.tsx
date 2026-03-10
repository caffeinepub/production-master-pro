import { Toaster } from "@/components/ui/sonner";
import { useState } from "react";
import { AdditionalWorkTab } from "./components/AdditionalWorkTab";
import { AppHeader } from "./components/AppHeader";
import { BottomNav } from "./components/BottomNav";
import { DispatchTab } from "./components/DispatchTab";
import { HistoryTab } from "./components/HistoryTab";
import { ItemMasterTab } from "./components/ItemMasterTab";
import { LoginScreen } from "./components/LoginScreen";
import { MasterReportTab } from "./components/MasterReportTab";
import { PaymentTab } from "./components/PaymentTab";
import { SplashScreen } from "./components/SplashScreen";
import { TailorTab } from "./components/TailorTab";

export type TabId =
  | "history"
  | "master_report"
  | "item_master"
  | "payment"
  | "tailor"
  | "add_work"
  | "dispatch";

const CURRENT_YEAR = new Date().getFullYear();
const HOST = typeof window !== "undefined" ? window.location.hostname : "";
const FOOTER_HREF = `https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(HOST)}`;

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>("item_master");

  if (showSplash) {
    return (
      <>
        <SplashScreen onDone={() => setShowSplash(false)} />
        <Toaster position="top-center" richColors />
      </>
    );
  }

  if (!isLoggedIn) {
    return (
      <>
        <LoginScreen onLogin={() => setIsLoggedIn(true)} />
        <Toaster position="top-center" richColors />
      </>
    );
  }

  return (
    <div className="app-shell">
      <AppHeader activeTab={activeTab} />

      <main className="tab-content-area">
        {activeTab === "history" && <HistoryTab />}
        {activeTab === "master_report" && <MasterReportTab />}
        {activeTab === "item_master" && <ItemMasterTab />}
        {activeTab === "payment" && <PaymentTab />}
        {activeTab === "tailor" && <TailorTab />}
        {activeTab === "add_work" && <AdditionalWorkTab />}
        {activeTab === "dispatch" && <DispatchTab />}

        <footer className="px-4 py-4 text-center">
          <a
            href={FOOTER_HREF}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs"
            style={{ color: "oklch(var(--muted-foreground))" }}
          >
            © {CURRENT_YEAR}. Built with ♥ using{" "}
            <span style={{ color: "oklch(var(--primary))" }}>caffeine.ai</span>
          </a>
        </footer>
      </main>

      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
      <Toaster position="top-center" richColors />
    </div>
  );
}
