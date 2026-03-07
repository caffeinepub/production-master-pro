import { Toaster } from "@/components/ui/sonner";
import { useState } from "react";
import { AppHeader } from "./components/AppHeader";
import { ArticleReportTab } from "./components/ArticleReportTab";
import { BottomNav } from "./components/BottomNav";
import { EntryTab } from "./components/EntryTab";
import { HistoryTab } from "./components/HistoryTab";
import { MasterReportTab } from "./components/MasterReportTab";
import { OverlockTab } from "./components/OverlockTab";
import { PaymentTab } from "./components/PaymentTab";
import { TailorTab } from "./components/TailorTab";

export type TabId =
  | "entry"
  | "history"
  | "master_report"
  | "article_report"
  | "payment"
  | "tailor"
  | "overlock";

const CURRENT_YEAR = new Date().getFullYear();
const HOST = typeof window !== "undefined" ? window.location.hostname : "";
const FOOTER_HREF = `https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(HOST)}`;

export default function App() {
  const [activeTab, setActiveTab] = useState<TabId>("entry");

  return (
    <div className="app-shell">
      <AppHeader activeTab={activeTab} />

      <main className="tab-content-area">
        {activeTab === "entry" && <EntryTab />}
        {activeTab === "history" && <HistoryTab />}
        {activeTab === "master_report" && <MasterReportTab />}
        {activeTab === "article_report" && <ArticleReportTab />}
        {activeTab === "payment" && <PaymentTab />}
        {activeTab === "tailor" && <TailorTab />}
        {activeTab === "overlock" && <OverlockTab />}

        {/* Footer */}
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
