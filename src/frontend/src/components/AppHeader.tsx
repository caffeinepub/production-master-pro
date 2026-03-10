import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Factory, Settings } from "lucide-react";
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
}

export function AppHeader({ activeTab }: AppHeaderProps) {
  const [open, setOpen] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [saved, setSaved] = useState(false);

  function handleSave() {
    if (!newUsername.trim() || !newPassword.trim()) return;
    localStorage.setItem("app_username", newUsername.trim());
    localStorage.setItem("app_password", newPassword.trim());
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      setNewUsername("");
      setNewPassword("");
      setOpen(false);
    }, 1500);
  }

  function handleOpenChange(val: boolean) {
    setOpen(val);
    if (!val) {
      setSaved(false);
      setNewUsername("");
      setNewPassword("");
    }
  }

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

        {/* Settings Dialog */}
        <Dialog open={open} onOpenChange={handleOpenChange}>
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
              <DialogTitle>Change Login Credentials</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col gap-4 mt-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="new-username">New Username</Label>
                <Input
                  id="new-username"
                  data-ocid="settings.input"
                  type="text"
                  placeholder="Enter new username"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="new-password">New Password</Label>
                <Input
                  id="new-password"
                  data-ocid="settings.password_input"
                  type="password"
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>

              {saved && (
                <div
                  data-ocid="settings.success_state"
                  className="rounded-lg px-3 py-2 text-sm text-center"
                  style={{
                    background: "oklch(0.87 0.12 145 / 0.2)",
                    color: "oklch(0.45 0.15 145)",
                    border: "1px solid oklch(0.7 0.15 145 / 0.4)",
                  }}
                >
                  ✓ Credentials updated successfully
                </div>
              )}

              <Button
                data-ocid="settings.save_button"
                onClick={handleSave}
                disabled={!newUsername.trim() || !newPassword.trim()}
                className="w-full"
                style={{ background: "oklch(var(--primary))" }}
              >
                Save Changes
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </header>
  );
}
