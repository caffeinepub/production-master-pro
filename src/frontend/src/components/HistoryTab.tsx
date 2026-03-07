import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Calendar,
  ClipboardList,
  Download,
  Search,
  Trash2,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import type { ProductionRecord } from "../backend";
import { useDeleteRecord, useGetRecords } from "../hooks/useQueries";
import { exportToCSV } from "../utils/csvExport";

export function HistoryTab() {
  const [searchArticle, setSearchArticle] = useState("");
  const [filterDate, setFilterDate] = useState("");

  const { data: records = [], isLoading } = useGetRecords();
  const deleteRecord = useDeleteRecord();

  const filteredRecords = useMemo(() => {
    let result = [...records];
    if (searchArticle.trim()) {
      result = result.filter((r) =>
        r.articleNo.toLowerCase().includes(searchArticle.trim().toLowerCase()),
      );
    }
    if (filterDate) {
      result = result.filter((r) => r.date === filterDate);
    }
    // Sort newest first
    result.sort((a, b) => b.date.localeCompare(a.date));
    return result;
  }, [records, searchArticle, filterDate]);

  const handleDelete = async (id: bigint) => {
    try {
      await deleteRecord.mutateAsync(id);
      toast.success("Record deleted");
    } catch {
      toast.error("Failed to delete record");
    }
  };

  const handleExport = () => {
    if (filteredRecords.length === 0) {
      toast.error("No records to export");
      return;
    }
    const headers = [
      "Date",
      "Article No",
      "Master Name",
      "Dispatched Pcs",
      "Cut by Master",
      "Pending Pcs",
      "Rate",
      "Percentage",
      "Final Amount (₨)",
    ];
    const rows = filteredRecords.map((r) => [
      r.date,
      r.articleNo,
      r.masterName,
      r.dispatchedPcs,
      r.cutByMaster,
      r.totalPcs,
      r.rate,
      r.percentage,
      r.finalAmount.toFixed(2),
    ]);
    exportToCSV("production_history", headers, rows);
    toast.success("CSV exported successfully");
  };

  return (
    <div className="px-4 py-4 space-y-3">
      {/* Search & Export Row */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
            style={{ color: "oklch(var(--muted-foreground))" }}
          />
          <Input
            data-ocid="history.search_input"
            type="text"
            placeholder="Search article number..."
            value={searchArticle}
            onChange={(e) => setSearchArticle(e.target.value)}
            className="pl-9 input-factory"
          />
        </div>
        <Button
          data-ocid="history.export_button"
          variant="outline"
          size="icon"
          className="shrink-0 w-12 h-12"
          onClick={handleExport}
          title="Export CSV"
        >
          <Download className="w-5 h-5" />
        </Button>
      </div>

      {/* Date Filter */}
      <div className="flex items-center gap-2">
        <Calendar
          className="w-4 h-4 shrink-0"
          style={{ color: "oklch(var(--muted-foreground))" }}
        />
        <Input
          data-ocid="history.date_input"
          type="date"
          value={filterDate}
          onChange={(e) => setFilterDate(e.target.value)}
          className="input-factory flex-1"
        />
        {filterDate && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setFilterDate("")}
            className="shrink-0 text-xs h-9 px-3"
          >
            Clear
          </Button>
        )}
      </div>

      {/* Count */}
      {!isLoading && (
        <div
          className="text-xs font-semibold"
          style={{ color: "oklch(var(--muted-foreground))" }}
        >
          {filteredRecords.length} record
          {filteredRecords.length !== 1 ? "s" : ""} found
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div data-ocid="history.loading_state" className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-lg border p-4 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-6 w-1/3" />
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && filteredRecords.length === 0 && (
        <div
          data-ocid="history.empty_state"
          className="flex flex-col items-center justify-center py-16 gap-3"
          style={{ color: "oklch(var(--muted-foreground))" }}
        >
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center"
            style={{ background: "oklch(var(--muted))" }}
          >
            <ClipboardList className="w-8 h-8" />
          </div>
          <div className="text-center">
            <div
              className="font-heading font-bold text-base"
              style={{ color: "oklch(var(--foreground))" }}
            >
              No Records Found
            </div>
            <div className="text-sm mt-1">
              {searchArticle || filterDate
                ? "Try adjusting your search or filters"
                : "Save your first entry to see it here"}
            </div>
          </div>
        </div>
      )}

      {/* Records List */}
      {!isLoading && filteredRecords.length > 0 && (
        <div data-ocid="history.list" className="space-y-2">
          {filteredRecords.map((record, index) => (
            <RecordCard
              key={record.id.toString()}
              record={record}
              index={index + 1}
              onDelete={handleDelete}
              isDeleting={deleteRecord.isPending}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface RecordCardProps {
  record: ProductionRecord;
  index: number;
  onDelete: (id: bigint) => Promise<void>;
  isDeleting: boolean;
}

function RecordCard({ record, index, onDelete, isDeleting }: RecordCardProps) {
  const ocidSuffix = index <= 3 ? `.${index}` : "";
  const displayDate = record.date;

  return (
    <div
      data-ocid={`history.item${ocidSuffix}`}
      className="rounded-lg border p-4 space-y-3 transition-shadow hover:shadow-card"
      style={{
        background: "oklch(var(--card))",
        borderColor: "oklch(var(--border))",
      }}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div
            className="font-heading font-bold text-base leading-tight truncate"
            style={{ color: "oklch(var(--primary))" }}
          >
            {record.articleNo}
          </div>
          <div
            className="text-sm font-medium truncate mt-0.5"
            style={{ color: "oklch(var(--foreground))" }}
          >
            {record.masterName}
          </div>
        </div>
        <div className="text-right shrink-0">
          <div
            className="text-xs"
            style={{ color: "oklch(var(--muted-foreground))" }}
          >
            {displayDate}
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div
        className="grid grid-cols-3 gap-2 border-t pt-3"
        style={{ borderColor: "oklch(var(--border))" }}
      >
        <div>
          <div className="data-label mb-0.5">Dispatched</div>
          <div
            className="font-heading font-bold text-lg leading-none"
            style={{ color: "oklch(var(--foreground))" }}
          >
            {record.dispatchedPcs.toLocaleString()}
          </div>
        </div>
        <div>
          <div className="data-label mb-0.5">Pending Pcs</div>
          <div
            className="font-heading font-bold text-lg leading-none"
            style={{ color: "oklch(var(--primary))" }}
          >
            {record.totalPcs.toLocaleString()}
          </div>
        </div>
        <div>
          <div className="data-label mb-0.5">Final Amount</div>
          <div
            className="font-heading font-bold text-base leading-none"
            style={{ color: "oklch(var(--success))" }}
          >
            ₨ {record.finalAmount.toFixed(2)}
          </div>
        </div>
      </div>

      {/* Rate detail row */}
      <div
        className="flex items-center gap-3 text-xs"
        style={{ color: "oklch(var(--muted-foreground))" }}
      >
        <span>Rate: ₨{record.rate}/pc</span>
        <span>•</span>
        <span>Cut: {record.cutByMaster}</span>
        <span>•</span>
        <span>{record.percentage}%</span>
      </div>

      {/* Delete button */}
      <div
        className="flex justify-end border-t pt-2"
        style={{ borderColor: "oklch(var(--border))" }}
      >
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              data-ocid={`history.delete_button${ocidSuffix}`}
              variant="ghost"
              size="sm"
              disabled={isDeleting}
              className="text-xs h-8 gap-1.5"
              style={{ color: "oklch(var(--destructive))" }}
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Record?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete the record for{" "}
                <strong>{record.articleNo}</strong> — {record.masterName} (
                {record.date}). This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel data-ocid="history.cancel_button">
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                data-ocid="history.confirm_button"
                onClick={() => onDelete(record.id)}
                style={{
                  background: "oklch(var(--destructive))",
                  color: "oklch(var(--destructive-foreground))",
                }}
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
