import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  CalendarRange,
  ChevronDown,
  ChevronUp,
  Loader2,
  RotateCcw,
  Save,
  Scissors,
  Trash2,
  TrendingUp,
  Users,
} from "lucide-react";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import {
  useAddTailorRecord,
  useDeleteTailorRecord,
  useGetTailorRecords,
  useGetTailorReport,
} from "../hooks/useQueries";

type SubTab = "add" | "view";

interface FormState {
  date: string;
  articleNo: string;
  tailorName: string;
  color: string;
  quantity: string;
  pcsRate: string;
}

interface FormErrors {
  date?: string;
  articleNo?: string;
  tailorName?: string;
  color?: string;
  quantity?: string;
  pcsRate?: string;
}

function getTodayDate() {
  return new Date().toISOString().split("T")[0];
}

const INITIAL_FORM: FormState = {
  date: getTodayDate(),
  articleNo: "",
  tailorName: "",
  color: "",
  quantity: "",
  pcsRate: "",
};

export function TailorTab() {
  const [subTab, setSubTab] = useState<SubTab>("add");
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [errors, setErrors] = useState<FormErrors>({});

  // View filters
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [articleFilter, setArticleFilter] = useState("");
  const [summaryExpanded, setSummaryExpanded] = useState(true);

  const { data: records = [], isLoading: recordsLoading } =
    useGetTailorRecords();
  const { data: report = [] } = useGetTailorReport();
  const addRecord = useAddTailorRecord();
  const deleteRecord = useDeleteTailorRecord();

  const finalAmount =
    (Number(form.quantity) || 0) * (Number(form.pcsRate) || 0);

  const handleChange = useCallback(
    (field: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement>) => {
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    },
    [],
  );

  const validate = (): boolean => {
    const newErrors: FormErrors = {};
    if (!form.date) newErrors.date = "Date is required";
    if (!form.articleNo.trim()) newErrors.articleNo = "Article No. is required";
    if (!form.tailorName.trim())
      newErrors.tailorName = "Tailor Name is required";
    if (!form.color.trim()) newErrors.color = "Color is required";
    if (
      !form.quantity ||
      Number.isNaN(Number(form.quantity)) ||
      Number(form.quantity) <= 0
    )
      newErrors.quantity = "Enter valid quantity";
    if (
      !form.pcsRate ||
      Number.isNaN(Number(form.pcsRate)) ||
      Number(form.pcsRate) <= 0
    )
      newErrors.pcsRate = "Enter valid Pcs Rate";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    const qty = Number(form.quantity);
    const rate = Number(form.pcsRate);
    const amt = qty * rate;
    try {
      await addRecord.mutateAsync({
        date: form.date,
        articleNo: form.articleNo.trim(),
        tailorName: form.tailorName.trim(),
        color: form.color.trim(),
        quantity: qty,
        pcsRate: rate,
        finalAmount: amt,
      });
      toast.success("Tailor record saved!", {
        description: `${form.tailorName} — ₨ ${amt.toFixed(2)}`,
      });
      handleClear();
    } catch {
      toast.error("Failed to save tailor record. Please try again.");
    }
  };

  const handleClear = () => {
    setForm({ ...INITIAL_FORM, date: getTodayDate() });
    setErrors({});
  };

  const handleDelete = async (id: bigint, name: string) => {
    try {
      await deleteRecord.mutateAsync(id);
      toast.success(`Record for ${name} deleted.`);
    } catch {
      toast.error("Failed to delete record.");
    }
  };

  // Filter records
  const filteredRecords = records.filter((r) => {
    if (dateFrom && r.date < dateFrom) return false;
    if (dateTo && r.date > dateTo) return false;
    if (
      articleFilter &&
      !r.articleNo.toLowerCase().includes(articleFilter.toLowerCase())
    )
      return false;
    return true;
  });

  // Filter report by date range (client-side approximation)
  const filteredReport = report.filter(([name]) => {
    // If date filter is active, cross-check against filtered records
    if (dateFrom || dateTo || articleFilter) {
      const namesInFiltered = new Set(filteredRecords.map((r) => r.tailorName));
      return namesInFiltered.has(name);
    }
    return true;
  });

  return (
    <div className="px-4 py-4 space-y-4">
      {/* Sub-tab Switcher */}
      <div
        className="flex rounded-lg overflow-hidden border"
        style={{ borderColor: "oklch(var(--border))" }}
      >
        <button
          type="button"
          data-ocid="tailor.add_tab"
          onClick={() => setSubTab("add")}
          className="flex-1 py-2.5 text-sm font-semibold transition-colors"
          style={{
            background:
              subTab === "add"
                ? "oklch(var(--primary))"
                : "oklch(var(--muted))",
            color:
              subTab === "add"
                ? "oklch(var(--primary-foreground))"
                : "oklch(var(--muted-foreground))",
            fontFamily: "Cabinet Grotesk, sans-serif",
          }}
        >
          <Scissors className="inline w-4 h-4 mr-1.5 mb-0.5" />
          Add Record
        </button>
        <button
          type="button"
          data-ocid="tailor.view_tab"
          onClick={() => setSubTab("view")}
          className="flex-1 py-2.5 text-sm font-semibold transition-colors"
          style={{
            background:
              subTab === "view"
                ? "oklch(var(--primary))"
                : "oklch(var(--muted))",
            color:
              subTab === "view"
                ? "oklch(var(--primary-foreground))"
                : "oklch(var(--muted-foreground))",
            fontFamily: "Cabinet Grotesk, sans-serif",
          }}
        >
          <Users className="inline w-4 h-4 mr-1.5 mb-0.5" />
          View Records
        </button>
      </div>

      {/* ─── ADD RECORD SUB-TAB ─────────────────────────────────── */}
      {subTab === "add" && (
        <div className="space-y-4">
          {/* Live Result Card */}
          <div
            data-ocid="tailor.result_card"
            className="rounded-lg border-2 overflow-hidden"
            style={{
              borderColor:
                finalAmount > 0
                  ? "oklch(var(--primary))"
                  : "oklch(var(--border))",
              background:
                finalAmount > 0
                  ? "oklch(var(--primary) / 0.06)"
                  : "oklch(var(--muted))",
              transition: "all 0.2s ease",
            }}
          >
            <div
              className="px-4 py-2.5 flex items-center gap-2 border-b"
              style={{
                borderColor:
                  finalAmount > 0
                    ? "oklch(var(--primary) / 0.2)"
                    : "oklch(var(--border))",
              }}
            >
              <TrendingUp
                className="w-4 h-4"
                style={{
                  color:
                    finalAmount > 0
                      ? "oklch(var(--primary))"
                      : "oklch(var(--muted-foreground))",
                }}
              />
              <span
                className="data-label"
                style={{
                  color: finalAmount > 0 ? "oklch(var(--primary))" : undefined,
                }}
              >
                Live Calculation
              </span>
            </div>
            <div className="px-4 py-3 grid grid-cols-3 gap-3">
              <div>
                <div className="data-label mb-1">Quantity</div>
                <div
                  className="data-value"
                  style={{
                    color: form.quantity
                      ? "oklch(var(--foreground))"
                      : "oklch(var(--muted-foreground))",
                  }}
                >
                  {form.quantity ? Number(form.quantity).toLocaleString() : "—"}
                </div>
              </div>
              <div>
                <div className="data-label mb-1">Pcs Rate</div>
                <div
                  className="data-value"
                  style={{
                    color: form.pcsRate
                      ? "oklch(var(--foreground))"
                      : "oklch(var(--muted-foreground))",
                  }}
                >
                  {form.pcsRate ? `₨ ${Number(form.pcsRate).toFixed(2)}` : "—"}
                </div>
              </div>
              <div>
                <div className="data-label mb-1">Final Amount</div>
                <div
                  className="data-value"
                  style={{
                    color:
                      finalAmount > 0
                        ? "oklch(var(--success))"
                        : "oklch(var(--muted-foreground))",
                    fontSize: "1.05rem",
                  }}
                >
                  {finalAmount > 0 ? `₨ ${finalAmount.toFixed(2)}` : "—"}
                </div>
              </div>
            </div>
          </div>

          {/* Form Fields */}
          <div className="space-y-3">
            {/* Date */}
            <div className="space-y-1">
              <Label htmlFor="tailor-date" className="data-label">
                Date
              </Label>
              <Input
                id="tailor-date"
                data-ocid="tailor.date_input"
                type="date"
                value={form.date}
                onChange={handleChange("date")}
                className="input-factory"
                style={
                  errors.date
                    ? { borderColor: "oklch(var(--destructive))" }
                    : {}
                }
              />
              {errors.date && (
                <p
                  className="text-xs font-medium"
                  style={{ color: "oklch(var(--destructive))" }}
                >
                  {errors.date}
                </p>
              )}
            </div>

            {/* Article No */}
            <div className="space-y-1">
              <Label htmlFor="tailor-article" className="data-label">
                Article No.
              </Label>
              <Input
                id="tailor-article"
                data-ocid="tailor.article_input"
                type="text"
                placeholder="e.g. ART-2024-001"
                value={form.articleNo}
                onChange={handleChange("articleNo")}
                className="input-factory"
                style={
                  errors.articleNo
                    ? { borderColor: "oklch(var(--destructive))" }
                    : {}
                }
              />
              {errors.articleNo && (
                <p
                  className="text-xs font-medium"
                  style={{ color: "oklch(var(--destructive))" }}
                >
                  {errors.articleNo}
                </p>
              )}
            </div>

            {/* Tailor Name */}
            <div className="space-y-1">
              <Label htmlFor="tailor-name" className="data-label">
                Tailor Name
              </Label>
              <Input
                id="tailor-name"
                data-ocid="tailor.name_input"
                type="text"
                placeholder="Enter tailor name"
                value={form.tailorName}
                onChange={handleChange("tailorName")}
                className="input-factory"
                style={
                  errors.tailorName
                    ? { borderColor: "oklch(var(--destructive))" }
                    : {}
                }
              />
              {errors.tailorName && (
                <p
                  className="text-xs font-medium"
                  style={{ color: "oklch(var(--destructive))" }}
                >
                  {errors.tailorName}
                </p>
              )}
            </div>

            {/* Color */}
            <div className="space-y-1">
              <Label htmlFor="tailor-color" className="data-label">
                Color
              </Label>
              <Input
                id="tailor-color"
                data-ocid="tailor.color_input"
                type="text"
                placeholder="e.g. Navy Blue, Red"
                value={form.color}
                onChange={handleChange("color")}
                className="input-factory"
                style={
                  errors.color
                    ? { borderColor: "oklch(var(--destructive))" }
                    : {}
                }
              />
              {errors.color && (
                <p
                  className="text-xs font-medium"
                  style={{ color: "oklch(var(--destructive))" }}
                >
                  {errors.color}
                </p>
              )}
            </div>

            {/* Quantity & Pcs Rate */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="tailor-quantity" className="data-label">
                  Quantity (Pcs)
                </Label>
                <Input
                  id="tailor-quantity"
                  data-ocid="tailor.quantity_input"
                  type="number"
                  inputMode="numeric"
                  placeholder="0"
                  value={form.quantity}
                  onChange={handleChange("quantity")}
                  className="input-factory"
                  style={
                    errors.quantity
                      ? { borderColor: "oklch(var(--destructive))" }
                      : {}
                  }
                />
                {errors.quantity && (
                  <p
                    className="text-xs font-medium"
                    style={{ color: "oklch(var(--destructive))" }}
                  >
                    {errors.quantity}
                  </p>
                )}
              </div>
              <div className="space-y-1">
                <Label htmlFor="tailor-pcsrate" className="data-label">
                  Pcs Rate (₨)
                </Label>
                <Input
                  id="tailor-pcsrate"
                  data-ocid="tailor.pcsrate_input"
                  type="number"
                  inputMode="decimal"
                  placeholder="0.00"
                  step="0.01"
                  value={form.pcsRate}
                  onChange={handleChange("pcsRate")}
                  className="input-factory"
                  style={
                    errors.pcsRate
                      ? { borderColor: "oklch(var(--destructive))" }
                      : {}
                  }
                />
                {errors.pcsRate && (
                  <p
                    className="text-xs font-medium"
                    style={{ color: "oklch(var(--destructive))" }}
                  >
                    {errors.pcsRate}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2 pt-1">
            <Button
              data-ocid="tailor.save_button"
              onClick={handleSave}
              disabled={addRecord.isPending}
              className="w-full btn-factory"
              size="lg"
              style={{
                background: "oklch(var(--success))",
                color: "oklch(var(--success-foreground))",
              }}
            >
              {addRecord.isPending ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5 mr-2" />
                  Save Tailor Record
                </>
              )}
            </Button>
            <Button
              data-ocid="tailor.clear_button"
              onClick={handleClear}
              variant="outline"
              className="w-full btn-factory"
              size="lg"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Clear Form
            </Button>
          </div>

          {/* Formula Info */}
          <div
            className="rounded-lg p-3 text-xs"
            style={{
              background: "oklch(var(--muted))",
              color: "oklch(var(--muted-foreground))",
            }}
          >
            <div
              className="font-semibold mb-1"
              style={{ fontFamily: "Cabinet Grotesk, sans-serif" }}
            >
              Calculation
            </div>
            <div>Final Amount = Quantity × Pcs Rate</div>
          </div>
        </div>
      )}

      {/* ─── VIEW RECORDS SUB-TAB ───────────────────────────────── */}
      {subTab === "view" && (
        <div className="space-y-4">
          {/* Filters */}
          <div
            className="rounded-lg p-3 space-y-3"
            style={{ background: "oklch(var(--muted))" }}
          >
            <div className="flex items-center gap-2">
              <CalendarRange
                className="w-4 h-4"
                style={{ color: "oklch(var(--primary))" }}
              />
              <span
                className="text-sm font-semibold"
                style={{
                  fontFamily: "Cabinet Grotesk, sans-serif",
                  color: "oklch(var(--foreground))",
                }}
              >
                Filter Records
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="data-label">Date From</Label>
                <Input
                  data-ocid="tailor.date_from_input"
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="input-factory"
                />
              </div>
              <div className="space-y-1">
                <Label className="data-label">Date To</Label>
                <Input
                  data-ocid="tailor.date_to_input"
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="input-factory"
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="data-label">Article Filter</Label>
              <Input
                data-ocid="tailor.article_filter_input"
                type="text"
                placeholder="Search article no..."
                value={articleFilter}
                onChange={(e) => setArticleFilter(e.target.value)}
                className="input-factory"
              />
            </div>
          </div>

          {/* Tailor Summary */}
          {filteredReport.length > 0 && (
            <div
              className="rounded-lg overflow-hidden border"
              style={{ borderColor: "oklch(var(--border))" }}
            >
              <button
                type="button"
                onClick={() => setSummaryExpanded((v) => !v)}
                className="w-full flex items-center justify-between px-4 py-3"
                style={{ background: "oklch(var(--primary) / 0.08)" }}
              >
                <div className="flex items-center gap-2">
                  <Scissors
                    className="w-4 h-4"
                    style={{ color: "oklch(var(--primary))" }}
                  />
                  <span
                    className="text-sm font-bold"
                    style={{
                      fontFamily: "Cabinet Grotesk, sans-serif",
                      color: "oklch(var(--primary))",
                    }}
                  >
                    Tailor Summary ({filteredReport.length})
                  </span>
                </div>
                {summaryExpanded ? (
                  <ChevronUp
                    className="w-4 h-4"
                    style={{ color: "oklch(var(--primary))" }}
                  />
                ) : (
                  <ChevronDown
                    className="w-4 h-4"
                    style={{ color: "oklch(var(--primary))" }}
                  />
                )}
              </button>
              {summaryExpanded && (
                <div
                  className="divide-y"
                  style={{ borderColor: "oklch(var(--border))" }}
                >
                  {filteredReport.map(([name, totalQty, totalAmount]) => (
                    <div
                      key={name}
                      className="px-4 py-3 flex items-center justify-between"
                      style={{ background: "oklch(var(--card))" }}
                    >
                      <div>
                        <div
                          className="font-semibold text-sm"
                          style={{
                            fontFamily: "Cabinet Grotesk, sans-serif",
                            color: "oklch(var(--foreground))",
                          }}
                        >
                          {name}
                        </div>
                        <div className="data-label mt-0.5">
                          {totalQty.toLocaleString()} pcs
                        </div>
                      </div>
                      <div
                        className="font-bold text-base"
                        style={{ color: "oklch(var(--success))" }}
                      >
                        ₨ {totalAmount.toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Records List */}
          {recordsLoading ? (
            <div
              data-ocid="tailor.loading_state"
              className="flex items-center justify-center py-12"
              style={{ color: "oklch(var(--muted-foreground))" }}
            >
              <Loader2 className="w-6 h-6 animate-spin mr-2" />
              <span className="text-sm">Loading records...</span>
            </div>
          ) : filteredRecords.length === 0 ? (
            <div
              data-ocid="tailor.empty_state"
              className="flex flex-col items-center justify-center py-14 space-y-2"
            >
              <Scissors
                className="w-10 h-10"
                style={{ color: "oklch(var(--muted-foreground))" }}
              />
              <p
                className="text-sm font-medium"
                style={{ color: "oklch(var(--muted-foreground))" }}
              >
                No tailor records found
              </p>
              <p
                className="text-xs"
                style={{ color: "oklch(var(--muted-foreground))" }}
              >
                Add a record or adjust your filters
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div
                className="text-xs font-semibold px-1"
                style={{ color: "oklch(var(--muted-foreground))" }}
              >
                {filteredRecords.length} record
                {filteredRecords.length !== 1 ? "s" : ""}
              </div>
              {filteredRecords.map((record, idx) => (
                <div
                  key={String(record.id)}
                  data-ocid={`tailor.record.item.${idx + 1}`}
                  className="rounded-lg border overflow-hidden"
                  style={{
                    borderColor: "oklch(var(--border))",
                    background: "oklch(var(--card))",
                  }}
                >
                  {/* Card Header */}
                  <div
                    className="px-4 py-2.5 flex items-center justify-between border-b"
                    style={{
                      borderColor: "oklch(var(--border))",
                      background: "oklch(var(--muted))",
                    }}
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <span
                        className="font-bold text-sm truncate"
                        style={{
                          fontFamily: "Cabinet Grotesk, sans-serif",
                          color: "oklch(var(--foreground))",
                        }}
                      >
                        {record.tailorName}
                      </span>
                      <span
                        className="text-xs px-2 py-0.5 rounded-full shrink-0"
                        style={{
                          background: "oklch(var(--primary) / 0.12)",
                          color: "oklch(var(--primary))",
                          fontFamily: "Cabinet Grotesk, sans-serif",
                          fontWeight: 600,
                        }}
                      >
                        {record.articleNo}
                      </span>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      data-ocid={`tailor.record.delete_button.${idx + 1}`}
                      onClick={() => handleDelete(record.id, record.tailorName)}
                      disabled={deleteRecord.isPending}
                      className="ml-2 shrink-0 h-7 w-7 p-0"
                      style={{ color: "oklch(var(--destructive))" }}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>

                  {/* Card Body */}
                  <div className="px-4 py-3 grid grid-cols-2 gap-x-4 gap-y-2">
                    <div>
                      <div className="data-label">Date</div>
                      <div className="data-value text-sm">{record.date}</div>
                    </div>
                    <div>
                      <div className="data-label">Color</div>
                      <div className="data-value text-sm">{record.color}</div>
                    </div>
                    <div>
                      <div className="data-label">Quantity</div>
                      <div className="data-value text-sm">
                        {record.quantity.toLocaleString()} pcs
                      </div>
                    </div>
                    <div>
                      <div className="data-label">Pcs Rate</div>
                      <div className="data-value text-sm">
                        ₨ {record.pcsRate.toFixed(2)}
                      </div>
                    </div>
                  </div>
                  <div
                    className="px-4 py-2.5 flex items-center justify-between border-t"
                    style={{
                      borderColor: "oklch(var(--border))",
                      background: "oklch(var(--success) / 0.05)",
                    }}
                  >
                    <span className="data-label">Final Amount</span>
                    <span
                      className="font-bold text-base"
                      style={{ color: "oklch(var(--success))" }}
                    >
                      ₨ {record.finalAmount.toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
