import { Factory } from "lucide-react";
import type { TabId } from "../App";

const TAB_TITLES: Record<TabId, string> = {
  entry: "New Entry",
  history: "Production History",
  master_report: "Party Head",
  article_report: "Article Production Report",
  payment: "Payment Summary",
  tailor: "Tailor Records",
  overlock: "Overlock Records",
};

interface AppHeaderProps {
  activeTab: TabId;
}

export function AppHeader({ activeTab }: AppHeaderProps) {
  return (
    <header
      className="fixed top-0 left-1/2 -translate-x-1/2 z-40 w-full"
      style={{ maxWidth: "var(--app-max-width)" }}
    >
      <div
        className="flex items-center gap-3 px-4 h-[60px]"
        style={{
          background: "oklch(var(--primary))",
          boxShadow: "0 2px 8px oklch(0.28 0.07 220 / 0.4)",
        }}
      >
        <div className="flex items-center justify-center w-8 h-8 rounded bg-white/15">
          <Factory className="w-4 h-4 text-white" strokeWidth={2.5} />
        </div>
        <div className="flex flex-col min-w-0">
          <span
            className="text-white/60 leading-none"
            style={{
              fontSize: "10px",
              fontFamily: "Cabinet Grotesk, sans-serif",
              fontWeight: 600,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
            }}
          >
            Production Master Pro
          </span>
          <span
            className="text-white font-heading font-bold leading-tight truncate"
            style={{ fontSize: "17px", letterSpacing: "-0.02em" }}
          >
            {TAB_TITLES[activeTab]}
          </span>
        </div>
      </div>
    </header>
  );
}
