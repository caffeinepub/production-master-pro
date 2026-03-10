import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Download, TrendingUp, Users, X } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useGetMasterReport, useGetRecords } from "../hooks/useQueries";
import { exportToCSV } from "../utils/csvExport";

interface ArticleRow {
  articleNo: string;
  dispatchedPcs: number;
  pendingPcs: number;
}

export function MasterReportTab() {
  const { data: masterReport = [], isLoading } = useGetMasterReport();
  const { data: allRecords = [] } = useGetRecords();

  const [selectedParty, setSelectedParty] = useState<string | null>(null);

  // Build article-wise detail for the selected party
  const partyArticleRows = useMemo((): ArticleRow[] => {
    if (!selectedParty) return [];
    const filtered = allRecords.filter((r) => r.partyName === selectedParty);
    const articleMap = new Map<
      string,
      { dispatchedPcs: number; pendingPcs: number }
    >();
    for (const r of filtered) {
      const existing = articleMap.get(r.articleNo) ?? {
        dispatchedPcs: 0,
        pendingPcs: 0,
      };
      articleMap.set(r.articleNo, {
        dispatchedPcs: existing.dispatchedPcs + r.dispatchedPcs,
        pendingPcs: existing.pendingPcs + r.totalPcs,
      });
    }
    return Array.from(articleMap.entries()).map(([articleNo, data]) => ({
      articleNo,
      ...data,
    }));
  }, [allRecords, selectedParty]);

  const partyTotals = useMemo(() => {
    return partyArticleRows.reduce(
      (acc, row) => ({
        dispatchedPcs: acc.dispatchedPcs + row.dispatchedPcs,
        pendingPcs: acc.pendingPcs + row.pendingPcs,
      }),
      { dispatchedPcs: 0, pendingPcs: 0 },
    );
  }, [partyArticleRows]);

  const handleExport = () => {
    if (masterReport.length === 0) {
      toast.error("No data to export");
      return;
    }
    const headers = ["Party Name", "Total Pcs Produced", "Total Payment (₨)"];
    const rows = masterReport.map(([name, pcs, amount]) => [
      name,
      pcs,
      amount.toFixed(2),
    ]);
    exportToCSV("party_head_report", headers, rows);
    toast.success("Party head report exported");
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
            {masterReport.length} Party Head
            {masterReport.length !== 1 ? "s" : ""}
          </span>
        </div>
        <Button
          data-ocid="party_head.export_button"
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
        <div data-ocid="party_head.loading_state" className="space-y-3">
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
          data-ocid="party_head.empty_state"
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
              No Party Head Data
            </div>
            <div className="text-sm mt-1">
              Save production records to see party head reports
            </div>
          </div>
        </div>
      )}

      {/* Party Head Cards */}
      {!isLoading && masterReport.length > 0 && (
        <div data-ocid="party_head.list" className="space-y-2">
          {masterReport.map(
            ([masterName, totalPcsProduced, totalPayment], index) => {
              const ocidIndex = index + 1;
              const ocid =
                ocidIndex <= 3
                  ? `party_head.item.${ocidIndex}`
                  : "party_head.item";
              return (
                <button
                  key={masterName}
                  type="button"
                  data-ocid={ocid}
                  onClick={() => setSelectedParty(masterName)}
                  className="w-full text-left rounded-lg border p-4 space-y-3 transition-all hover:shadow-md active:scale-[0.99] cursor-pointer"
                  style={{
                    background: "oklch(var(--card))",
                    borderColor: "oklch(var(--border))",
                  }}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 font-heading font-bold text-sm"
                        style={{
                          background: "oklch(var(--primary) / 0.12)",
                          color: "oklch(var(--primary))",
                        }}
                      >
                        {masterName.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="font-heading font-bold text-base leading-tight truncate">
                          {masterName}
                        </div>
                        <div
                          className="text-xs"
                          style={{ color: "oklch(var(--muted-foreground))" }}
                        >
                          Party Head • Tap for details
                        </div>
                      </div>
                    </div>
                    <div
                      className="text-xs font-semibold px-2 py-1 rounded"
                      style={{
                        background: "oklch(var(--primary) / 0.1)",
                        color: "oklch(var(--primary))",
                      }}
                    >
                      View
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
                </button>
              );
            },
          )}
        </div>
      )}

      {/* Party Detail Dialog */}
      <Dialog
        open={!!selectedParty}
        onOpenChange={(open) => {
          if (!open) setSelectedParty(null);
        }}
      >
        <DialogContent
          data-ocid="party_head.detail_dialog"
          className="max-w-sm mx-auto max-h-[85vh] flex flex-col"
        >
          <DialogHeader className="flex-row items-center justify-between space-y-0 pr-0">
            <DialogTitle
              style={{ fontFamily: "Cabinet Grotesk, sans-serif" }}
              className="flex items-center gap-2 min-w-0"
            >
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 font-heading font-bold text-sm"
                style={{
                  background: "oklch(var(--primary) / 0.12)",
                  color: "oklch(var(--primary))",
                }}
              >
                {selectedParty?.charAt(0).toUpperCase()}
              </div>
              <span className="truncate">{selectedParty}</span>
            </DialogTitle>
            <Button
              data-ocid="party_head.detail.close_button"
              variant="ghost"
              size="icon"
              className="shrink-0 w-8 h-8"
              onClick={() => setSelectedParty(null)}
            >
              <X className="w-4 h-4" />
            </Button>
          </DialogHeader>

          {/* Totals Summary */}
          {partyArticleRows.length > 0 && (
            <div
              className="rounded-lg p-3 grid grid-cols-2 gap-3 shrink-0"
              style={{
                background: "oklch(var(--primary) / 0.06)",
                border: "1.5px solid oklch(var(--primary) / 0.2)",
              }}
            >
              <div>
                <div className="data-label text-xs mb-0.5">
                  Total Dispatched
                </div>
                <div
                  className="font-heading font-bold text-lg leading-none"
                  style={{ color: "oklch(var(--foreground))" }}
                >
                  {partyTotals.dispatchedPcs.toLocaleString()}
                  <span className="text-xs font-normal ml-1">PCS</span>
                </div>
              </div>
              <div>
                <div className="data-label text-xs mb-0.5">Total Pending</div>
                <div
                  className="font-heading font-bold text-lg leading-none"
                  style={{ color: "oklch(var(--primary))" }}
                >
                  {partyTotals.pendingPcs.toLocaleString()}
                  <span className="text-xs font-normal ml-1">PCS</span>
                </div>
              </div>
            </div>
          )}

          {/* Article-wise Table */}
          <div className="overflow-auto flex-1">
            {partyArticleRows.length === 0 ? (
              <div
                className="flex flex-col items-center justify-center py-10 gap-2"
                style={{ color: "oklch(var(--muted-foreground))" }}
              >
                <div className="text-sm">No records found for this party</div>
              </div>
            ) : (
              <Table data-ocid="party_head.detail.table">
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs font-semibold">
                      Article No
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-right">
                      Dispatched PCS
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-right">
                      Pending PCS
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {partyArticleRows.map((row) => (
                    <TableRow key={row.articleNo}>
                      <TableCell
                        className="font-medium text-sm"
                        style={{ color: "oklch(var(--primary))" }}
                      >
                        {row.articleNo}
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        {row.dispatchedPcs.toLocaleString()}
                      </TableCell>
                      <TableCell
                        className="text-right text-sm font-semibold"
                        style={{ color: "oklch(var(--primary))" }}
                      >
                        {row.pendingPcs.toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                  {/* Totals Row */}
                  <TableRow
                    style={{
                      background: "oklch(var(--muted))",
                      borderTop: "2px solid oklch(var(--border))",
                    }}
                  >
                    <TableCell className="font-bold text-sm">Total</TableCell>
                    <TableCell
                      className="text-right font-bold text-sm"
                      style={{ color: "oklch(var(--foreground))" }}
                    >
                      {partyTotals.dispatchedPcs.toLocaleString()}
                    </TableCell>
                    <TableCell
                      className="text-right font-bold text-sm"
                      style={{ color: "oklch(var(--primary))" }}
                    >
                      {partyTotals.pendingPcs.toLocaleString()}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
