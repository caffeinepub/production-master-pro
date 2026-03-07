import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Download, TrendingUp, Users } from "lucide-react";
import { toast } from "sonner";
import { useGetMasterReport } from "../hooks/useQueries";
import { exportToCSV } from "../utils/csvExport";

export function MasterReportTab() {
  const { data: masterReport = [], isLoading } = useGetMasterReport();

  const handleExport = () => {
    if (masterReport.length === 0) {
      toast.error("No data to export");
      return;
    }
    const headers = ["Master Name", "Total Pcs Produced", "Total Payment (₨)"];
    const rows = masterReport.map(([name, pcs, amount]) => [
      name,
      pcs,
      amount.toFixed(2),
    ]);
    exportToCSV("master_payment_report", headers, rows);
    toast.success("Master report exported");
  };

  // Calculate totals
  const totalPcs = masterReport.reduce((sum, [, pcs]) => sum + pcs, 0);
  const totalAmount = masterReport.reduce(
    (sum, [, , amount]) => sum + amount,
    0,
  );

  return (
    <div className="px-4 py-4 space-y-4">
      {/* Summary Totals Card */}
      {!isLoading && masterReport.length > 0 && (
        <div
          className="rounded-lg p-4 grid grid-cols-2 gap-4"
          style={{
            background: "oklch(var(--primary) / 0.08)",
            border: "1.5px solid oklch(var(--primary) / 0.25)",
          }}
        >
          <div>
            <div className="data-label mb-1">Total Pcs</div>
            <div
              className="data-value"
              style={{ color: "oklch(var(--primary))" }}
            >
              {totalPcs.toLocaleString()}
            </div>
          </div>
          <div>
            <div className="data-label mb-1">Total Amount</div>
            <div
              className="data-value"
              style={{ color: "oklch(var(--success))" }}
            >
              ₨ {totalAmount.toFixed(0)}
            </div>
          </div>
        </div>
      )}

      {/* Header Row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp
            className="w-4 h-4"
            style={{ color: "oklch(var(--primary))" }}
          />
          <span
            className="data-label"
            style={{ color: "oklch(var(--foreground))" }}
          >
            {masterReport.length} Master{masterReport.length !== 1 ? "s" : ""}
          </span>
        </div>
        <Button
          data-ocid="master_report.export_button"
          variant="outline"
          size="sm"
          onClick={handleExport}
          className="gap-2 h-9"
        >
          <Download className="w-4 h-4" />
          Export CSV
        </Button>
      </div>

      {/* Loading */}
      {isLoading && (
        <div data-ocid="master_report.loading_state" className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-lg border p-4 space-y-2">
              <Skeleton className="h-5 w-1/2" />
              <div className="flex gap-4">
                <Skeleton className="h-8 w-1/3" />
                <Skeleton className="h-8 w-1/3" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && masterReport.length === 0 && (
        <div
          data-ocid="master_report.empty_state"
          className="flex flex-col items-center justify-center py-16 gap-3"
          style={{ color: "oklch(var(--muted-foreground))" }}
        >
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center"
            style={{ background: "oklch(var(--muted))" }}
          >
            <Users className="w-8 h-8" />
          </div>
          <div className="text-center">
            <div
              className="font-heading font-bold text-base"
              style={{ color: "oklch(var(--foreground))" }}
            >
              No Master Data
            </div>
            <div className="text-sm mt-1">
              Save production records to see master reports
            </div>
          </div>
        </div>
      )}

      {/* Master Cards */}
      {!isLoading && masterReport.length > 0 && (
        <div data-ocid="master_report.list" className="space-y-2">
          {masterReport.map(
            ([masterName, totalPcsProduced, totalPayment], index) => {
              const ocidSuffix = index < 2 ? `.${index + 1}` : "";
              return (
                <div
                  key={masterName}
                  data-ocid={`master_report.item${ocidSuffix}`}
                  className="rounded-lg border p-4 space-y-3"
                  style={{
                    background: "oklch(var(--card))",
                    borderColor: "oklch(var(--border))",
                  }}
                >
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
                        Master
                      </div>
                    </div>
                  </div>
                  <div
                    className="grid grid-cols-2 gap-3 border-t pt-3"
                    style={{ borderColor: "oklch(var(--border))" }}
                  >
                    <div>
                      <div className="data-label mb-0.5">
                        Total Pcs Produced
                      </div>
                      <div
                        className="font-heading font-bold text-xl leading-none"
                        style={{ color: "oklch(var(--primary))" }}
                      >
                        {totalPcsProduced.toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <div className="data-label mb-0.5">Total Payment</div>
                      <div
                        className="font-heading font-bold text-xl leading-none"
                        style={{ color: "oklch(var(--success))" }}
                      >
                        ₨ {totalPayment.toFixed(2)}
                      </div>
                    </div>
                  </div>
                </div>
              );
            },
          )}
        </div>
      )}
    </div>
  );
}
