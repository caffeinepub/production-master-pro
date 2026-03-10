import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Download,
  IndianRupee,
  Lock,
  LockOpen,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useGetRecords } from "../hooks/useQueries";
import { exportToCSV } from "../utils/csvExport";

const PAYMENT_PIN = "8807";

function getFirstDayOfMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
}

function getTodayDate() {
  return new Date().toISOString().split("T")[0];
}

export function PaymentTab() {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState(false);

  const handleUnlock = () => {
    if (pin === PAYMENT_PIN) {
      setIsUnlocked(true);
      setPinError(false);
      setPin("");
    } else {
      setPinError(true);
      setPin("");
    }
  };

  const handleLock = () => {
    setIsUnlocked(false);
    setPin("");
    setPinError(false);
  };

  if (!isUnlocked) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-6">
        <div
          className="w-full max-w-xs rounded-2xl p-8 space-y-6"
          style={{
            background: "oklch(var(--card))",
            border: "1.5px solid oklch(var(--border))",
            boxShadow: "0 4px 24px oklch(0.3 0.05 220 / 0.1)",
          }}
        >
          {/* Icon */}
          <div className="flex flex-col items-center gap-3">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{
                background: "oklch(var(--primary) / 0.12)",
                border: "2px solid oklch(var(--primary) / 0.25)",
              }}
            >
              <Lock
                className="w-7 h-7"
                style={{ color: "oklch(var(--primary))" }}
              />
            </div>
            <div className="text-center">
              <div
                className="font-heading font-bold text-lg leading-tight"
                style={{ fontFamily: "Cabinet Grotesk, sans-serif" }}
              >
                Payment Access
              </div>
              <div
                className="text-sm mt-1"
                style={{ color: "oklch(var(--muted-foreground))" }}
              >
                Enter PIN to view payment data
              </div>
            </div>
          </div>

          {/* PIN Input */}
          <div className="space-y-2">
            <Label className="data-label sr-only">PIN</Label>
            <Input
              data-ocid="payment.pin_input"
              type="password"
              inputMode="numeric"
              maxLength={4}
              placeholder="Enter 4-digit PIN"
              value={pin}
              onChange={(e) => {
                setPin(e.target.value);
                setPinError(false);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleUnlock();
              }}
              className="input-factory text-center text-xl tracking-widest"
              style={{
                borderColor: pinError ? "oklch(var(--destructive))" : undefined,
                letterSpacing: "0.4em",
              }}
              autoFocus
            />
            {pinError && (
              <p
                data-ocid="payment.pin_error_state"
                className="text-xs font-medium text-center"
                style={{ color: "oklch(var(--destructive))" }}
              >
                Incorrect PIN. Try again.
              </p>
            )}
          </div>

          <Button
            data-ocid="payment.unlock_button"
            onClick={handleUnlock}
            className="w-full"
            size="lg"
            style={{
              background: "oklch(var(--primary))",
              color: "oklch(var(--primary-foreground))",
            }}
          >
            <LockOpen className="w-4 h-4 mr-2" />
            Unlock
          </Button>
        </div>
      </div>
    );
  }

  return <PaymentContent onLock={handleLock} />;
}

function PaymentContent({ onLock }: { onLock: () => void }) {
  const [fromDate, setFromDate] = useState(getFirstDayOfMonth());
  const [toDate, setToDate] = useState(getTodayDate());

  const { data: records = [], isLoading } = useGetRecords();

  const filtered = useMemo(() => {
    if (!fromDate && !toDate) return records;
    return records.filter((r) => {
      if (fromDate && r.date < fromDate) return false;
      if (toDate && r.date > toDate) return false;
      return true;
    });
  }, [records, fromDate, toDate]);

  // Summary stats
  const totalPayment = useMemo(
    () => filtered.reduce((sum, r) => sum + r.finalAmount, 0),
    [filtered],
  );
  const totalDispatchedPcs = useMemo(
    () => filtered.reduce((sum, r) => sum + r.dispatchedPcs, 0),
    [filtered],
  );
  const totalPendingPcs = useMemo(
    () => filtered.reduce((sum, r) => sum + r.totalPcs, 0),
    [filtered],
  );

  // Group by master
  const byMaster = useMemo(() => {
    const map = new Map<
      string,
      { dispatched: number; pending: number; amount: number; count: number }
    >();
    for (const r of filtered) {
      const existing = map.get(r.partyName) ?? {
        dispatched: 0,
        pending: 0,
        amount: 0,
        count: 0,
      };
      map.set(r.partyName, {
        dispatched: existing.dispatched + r.dispatchedPcs,
        pending: existing.pending + r.totalPcs,
        amount: existing.amount + r.finalAmount,
        count: existing.count + 1,
      });
    }
    return Array.from(map.entries()).sort((a, b) => b[1].amount - a[1].amount);
  }, [filtered]);

  const handleExport = () => {
    if (byMaster.length === 0) {
      toast.error("No payment data to export");
      return;
    }
    const headers = [
      "Party Name",
      "Records",
      "Dispatched Pcs",
      "Pending Pcs",
      "Net Payment (₨)",
    ];
    const rows = byMaster.map(([name, d]) => [
      name,
      d.count,
      d.dispatched,
      d.pending,
      d.amount.toFixed(2),
    ]);
    exportToCSV(`payment_report_${fromDate}_to_${toDate}`, headers, rows);
    toast.success("Payment report exported");
  };

  return (
    <div className="px-4 py-4 space-y-4">
      {/* Lock button */}
      <div className="flex justify-end">
        <Button
          data-ocid="payment.lock_button"
          variant="outline"
          size="sm"
          onClick={onLock}
          className="gap-2 h-8 text-xs"
          style={{ color: "oklch(var(--muted-foreground))" }}
        >
          <Lock className="w-3.5 h-3.5" />
          Lock
        </Button>
      </div>

      {/* Date Range Filter */}
      <div
        className="rounded-lg p-4 space-y-3"
        style={{
          background: "oklch(var(--muted))",
          border: "1.5px solid oklch(var(--border))",
        }}
      >
        <div className="flex items-center gap-2 mb-1">
          <Wallet
            className="w-4 h-4"
            style={{ color: "oklch(var(--primary))" }}
          />
          <span
            className="data-label font-semibold"
            style={{ color: "oklch(var(--foreground))" }}
          >
            Select Time Period
          </span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="data-label">From Date</Label>
            <Input
              data-ocid="payment.from_date_input"
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="input-factory"
            />
          </div>
          <div className="space-y-1">
            <Label className="data-label">To Date</Label>
            <Input
              data-ocid="payment.to_date_input"
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="input-factory"
            />
          </div>
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div data-ocid="payment.loading_state" className="space-y-3">
          <div className="rounded-lg border p-4 space-y-2">
            <Skeleton className="h-6 w-1/2" />
            <div className="grid grid-cols-3 gap-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>
        </div>
      )}

      {/* Summary Card */}
      {!isLoading && (
        <div
          data-ocid="payment.summary_card"
          className="rounded-lg p-4 space-y-3"
          style={{
            background: "oklch(var(--primary) / 0.08)",
            border: "2px solid oklch(var(--primary) / 0.3)",
          }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <IndianRupee
                className="w-4 h-4"
                style={{ color: "oklch(var(--primary))" }}
              />
              <span
                className="font-heading font-bold text-sm"
                style={{ color: "oklch(var(--primary))" }}
              >
                Net Payment Earned
              </span>
            </div>
            <span
              className="text-xs font-medium"
              style={{ color: "oklch(var(--muted-foreground))" }}
            >
              {filtered.length} record{filtered.length !== 1 ? "s" : ""}
            </span>
          </div>

          <div
            className="font-heading font-bold text-3xl leading-none"
            style={{ color: "oklch(var(--success))" }}
          >
            ₨ {totalPayment.toFixed(2)}
          </div>

          <div
            className="grid grid-cols-2 gap-3 pt-2 border-t"
            style={{ borderColor: "oklch(var(--primary) / 0.2)" }}
          >
            <div>
              <div className="data-label mb-0.5">Dispatched Pcs</div>
              <div
                className="font-heading font-bold text-xl leading-none"
                style={{ color: "oklch(var(--foreground))" }}
              >
                {totalDispatchedPcs.toLocaleString()}
              </div>
            </div>
            <div>
              <div className="data-label mb-0.5">Pending Pcs</div>
              <div
                className="font-heading font-bold text-xl leading-none"
                style={{ color: "oklch(var(--primary))" }}
              >
                {totalPendingPcs.toLocaleString()}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && filtered.length === 0 && (
        <div
          data-ocid="payment.empty_state"
          className="flex flex-col items-center justify-center py-12 gap-3"
          style={{ color: "oklch(var(--muted-foreground))" }}
        >
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center"
            style={{ background: "oklch(var(--muted))" }}
          >
            <Wallet className="w-8 h-8" />
          </div>
          <div className="text-center">
            <div
              className="font-heading font-bold text-base"
              style={{ color: "oklch(var(--foreground))" }}
            >
              No Payment Data
            </div>
            <div className="text-sm mt-1">
              No records found for the selected date range
            </div>
          </div>
        </div>
      )}

      {/* Per-Party Breakdown */}
      {!isLoading && byMaster.length > 0 && (
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp
                className="w-4 h-4"
                style={{ color: "oklch(var(--primary))" }}
              />
              <span
                className="data-label font-semibold"
                style={{ color: "oklch(var(--foreground))" }}
              >
                Payment by Party
              </span>
            </div>
            <Button
              data-ocid="payment.export_button"
              variant="outline"
              size="sm"
              onClick={handleExport}
              className="gap-2 h-9"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </Button>
          </div>

          {/* Party Cards */}
          <div data-ocid="payment.list" className="space-y-2">
            {byMaster.map(([masterName, data], index) => {
              const ocidIndex = index + 1;
              const ocid =
                ocidIndex <= 3 ? `payment.item.${ocidIndex}` : "payment.item";
              return (
                <div
                  key={masterName}
                  data-ocid={ocid}
                  className="rounded-lg border p-4 space-y-3"
                  style={{
                    background: "oklch(var(--card))",
                    borderColor: "oklch(var(--border))",
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 font-heading font-bold text-sm"
                        style={{
                          background: "oklch(var(--primary) / 0.12)",
                          color: "oklch(var(--primary))",
                        }}
                      >
                        {masterName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-heading font-bold text-base leading-tight">
                          {masterName}
                        </div>
                        <div
                          className="text-xs"
                          style={{ color: "oklch(var(--muted-foreground))" }}
                        >
                          {data.count} record{data.count !== 1 ? "s" : ""}
                        </div>
                      </div>
                    </div>
                    <div
                      className="font-heading font-bold text-lg leading-none"
                      style={{ color: "oklch(var(--success))" }}
                    >
                      ₨ {data.amount.toFixed(2)}
                    </div>
                  </div>

                  <div
                    className="grid grid-cols-2 gap-3 border-t pt-3"
                    style={{ borderColor: "oklch(var(--border))" }}
                  >
                    <div>
                      <div className="data-label mb-0.5">Dispatched Pcs</div>
                      <div
                        className="font-heading font-bold text-lg leading-none"
                        style={{ color: "oklch(var(--foreground))" }}
                      >
                        {data.dispatched.toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <div className="data-label mb-0.5">Pending Pcs</div>
                      <div
                        className="font-heading font-bold text-lg leading-none"
                        style={{ color: "oklch(var(--primary))" }}
                      >
                        {data.pending.toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
