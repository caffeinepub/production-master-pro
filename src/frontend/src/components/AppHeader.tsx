import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Factory, LogOut, Settings, UserCheck } from "lucide-react";
import { useState } from "react";
import type { TabId } from "../App";

const TAB_TITLES: Record<TabId, string> = {
  history: "Production History",
  master_report: "Party Head",
  item_master: "Item Master",
  dispatch: "Dispatch",
  payment: "Payment Summary",
  tailor: "Tailor Records",
  add_work: "Additional Work",
};

interface AppHeaderProps {
  activeTab: TabId;
  onLogout?: () => void;
}

export function AppHeader({ activeTab, onLogout }: AppHeaderProps) {
  const [open, setOpen] = useState(false);

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
        <div className="flex flex-col min-w-0 flex-1">
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

        {/* Settings / Profile Dialog */}
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <button
              type="button"
              data-ocid="settings.open_modal_button"
              className="flex items-center justify-center w-8 h-8 rounded bg-white/15 hover:bg-white/25 transition-colors"
              aria-label="Settings"
            >
              <Settings className="w-4 h-4 text-white" />
            </button>
          </DialogTrigger>
          <DialogContent
            data-ocid="settings.dialog"
            className="w-[90vw] max-w-sm rounded-xl"
          >
            <DialogHeader>
              <DialogTitle>Account &amp; Settings</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col gap-4 mt-2">
              {/* Logged-in indicator */}
              <div
                className="flex items-center gap-3 rounded-lg px-4 py-3"
                style={{
                  background: "oklch(var(--primary) / 0.08)",
                  border: "1px solid oklch(var(--primary) / 0.2)",
                }}
              >
                <div
                  className="flex items-center justify-center w-9 h-9 rounded-full shrink-0"
                  style={{ background: "oklch(var(--primary))" }}
                >
                  <UserCheck className="w-5 h-5 text-white" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span
                    className="font-semibold text-sm"
                    style={{ color: "oklch(var(--foreground))" }}
                  >
                    Logged In
                  </span>
                  <span
                    className="text-xs truncate"
                    style={{ color: "oklch(var(--muted-foreground))" }}
                  >
                    Internet Identity authenticated
                  </span>
                </div>
              </div>

              {/* Logout button */}
              <Button
                data-ocid="settings.delete_button"
                variant="destructive"
                className="w-full gap-2"
                onClick={() => {
                  setOpen(false);
                  onLogout?.();
                }}
              >
                <LogOut className="w-4 h-4" />
                Logout
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </header>
  );
}
