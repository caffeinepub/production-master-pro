import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertTriangle,
  CalendarRange,
  Loader2,
  Package,
  Pencil,
  RotateCcw,
  Save,
  Send,
  Trash2,
  TrendingUp,
} from "lucide-react";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import type { DispatchRecord } from "../backend";
import {
  useAddDispatchRecord,
  useDeleteDispatchRecord,
  useGetDispatchRecords,
  useGetItemMasterByArticle,
  useGetItemMasters,
  useUpdateDispatchRecord,
} from "../hooks/useQueries";

type SubTab = "add" | "view";

interface FormState {
  date: string;
  articleNo: string;
  dispatchQuantity: string;
  salePrice: string;
  percentage: string;
}

interface EditFormState extends FormState {
  id: bigint;
}

function getTodayDate() {
  return new Date().toISOString().split("T")[0];
}

const INITIAL_FORM: FormState = {
  date: getTodayDate(),
  articleNo: "",
  dispatchQuantity: "",
  salePrice: "",
  percentage: "",
};

function ArticleStockInfo({
  articleNo,
  dispatchRecords,
}: {
  articleNo: string;
  dispatchRecords: DispatchRecord[];
}) {
  const { data: itemMaster, isLoading } = useGetItemMasterByArticle(articleNo);

  if (!articleNo) return null;
  if (isLoading)
    return (
      <div
        className="rounded-lg p-2 text-xs"
        style={{ background: "oklch(var(--muted))" }}
      >
        Loading article info...
      </div>
    );
  if (!itemMaster)
    return (
      <div
        data-ocid="dispatch.article_error"
        className="rounded-lg p-3 flex items-start gap-2"
        style={{
          background: "oklch(var(--destructive) / 0.08)",
          border: "1px solid oklch(var(--destructive) / 0.3)",
        }}
      >
        <AlertTriangle
          className="w-4 h-4 mt-0.5 shrink-0"
          style={{ color: "oklch(var(--destructive))" }}
        />
        <p
          className="text-xs font-medium"
          style={{ color: "oklch(var(--destructive))" }}
        >
          Article not found in Item Master. Please create this article first.
        </p>
      </div>
    );

  const alreadyDispatched = dispatchRecords
    .filter((r) => r.articleNo === articleNo)
    .reduce((sum, r) => sum + r.dispatchQuantity, 0);
  const remaining = itemMaster.totalQuantity - alreadyDispatched;

  return (
    <div
      data-ocid="dispatch.stock_panel"
      className="rounded-lg p-3"
      style={{
        background:
          remaining <= 0
            ? "oklch(var(--destructive) / 0.08)"
            : "oklch(var(--primary) / 0.07)",
        border: `1px solid ${
          remaining <= 0
            ? "oklch(var(--destructive) / 0.3)"
            : "oklch(var(--primary) / 0.2)"
        }`,
      }}
    >
      <div className="grid grid-cols-3 gap-2 text-center">
        <div>
          <div
            className="text-xs"
            style={{ color: "oklch(var(--muted-foreground))" }}
          >
            Total Qty
          </div>
          <div
            className="font-bold text-sm"
            style={{ color: "oklch(var(--foreground))" }}
          >
            {itemMaster.totalQuantity.toLocaleString()}
          </div>
        </div>
        <div>
          <div
            className="text-xs"
            style={{ color: "oklch(var(--muted-foreground))" }}
          >
            Dispatched
          </div>
          <div
            className="font-bold text-sm"
            style={{ color: "oklch(var(--foreground))" }}
          >
            {alreadyDispatched.toLocaleString()}
          </div>
        </div>
        <div>
          <div
            className="text-xs"
            style={{ color: "oklch(var(--muted-foreground))" }}
          >
            Remaining
          </div>
          <div
            className="font-bold text-sm"
            style={{
              color:
                remaining <= 0
                  ? "oklch(var(--destructive))"
                  : "oklch(var(--success))",
            }}
          >
            {remaining.toLocaleString()}
          </div>
        </div>
      </div>
    </div>
  );
}

export function DispatchTab() {
  const [subTab, setSubTab] = useState<SubTab>("add");
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [errors, setErrors] = useState<
    Partial<Record<keyof FormState, string>>
  >({});
  const [editingRecord, setEditingRecord] = useState<EditFormState | null>(
    null,
  );
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const { data: itemMasters = [] } = useGetItemMasters();
  const { data: dispatchRecords = [], isLoading } = useGetDispatchRecords();
  const { data: selectedItemMaster } = useGetItemMasterByArticle(
    form.articleNo,
  );
  const addDispatch = useAddDispatchRecord();
  const updateDispatch = useUpdateDispatchRecord();
  const deleteDispatch = useDeleteDispatchRecord();

  const dispatchQty = Number(form.dispatchQuantity) || 0;
  const salePrice = Number(form.salePrice) || 0;
  const percentage = Number(form.percentage) || 0;
  const finalPayment = (dispatchQty * salePrice * percentage) / 100;

  const alreadyDispatched = dispatchRecords
    .filter((r) => r.articleNo === form.articleNo)
    .reduce((sum, r) => sum + r.dispatchQuantity, 0);
  const remainingQty = selectedItemMaster
    ? selectedItemMaster.totalQuantity - alreadyDispatched
    : null;

  const handleChange = useCallback(
    (field: keyof FormState) =>
      (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setForm((prev) => ({ ...prev, [field]: e.target.value }));
        setErrors((prev) => ({ ...prev, [field]: undefined }));
      },
    [],
  );

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof FormState, string>> = {};
    if (!form.date) newErrors.date = "Date is required";
    if (!form.articleNo.trim()) newErrors.articleNo = "Article No. is required";
    else if (!selectedItemMaster)
      newErrors.articleNo = "Article not found in Item Master";
    if (!form.dispatchQuantity || dispatchQty <= 0)
      newErrors.dispatchQuantity = "Enter valid dispatch quantity";
    else if (remainingQty !== null && dispatchQty > remainingQty)
      newErrors.dispatchQuantity = "Dispatch quantity exceeds available stock.";
    if (!form.salePrice || salePrice <= 0)
      newErrors.salePrice = "Enter valid sale price";
    if (!form.percentage || percentage <= 0)
      newErrors.percentage = "Enter valid percentage";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    const params = {
      date: form.date,
      articleNo: form.articleNo.trim(),
      dispatchQuantity: dispatchQty,
      salePrice,
      percentage,
      finalPayment,
    };
    try {
      if (editingRecord) {
        await updateDispatch.mutateAsync({ id: editingRecord.id, ...params });
        toast.success("Dispatch record updated!");
        setEditingRecord(null);
      } else {
        await addDispatch.mutateAsync(params);
        toast.success(`Dispatched ${dispatchQty} pcs from ${form.articleNo}`);
      }
      setForm({ ...INITIAL_FORM, date: getTodayDate() });
      setErrors({});
      setSubTab("view");
    } catch (err) {
      console.error(err);
      toast.error("Failed to save. Please try again.");
    }
  };

  const handleEdit = (record: DispatchRecord) => {
    setEditingRecord({
      id: record.id,
      date: record.date,
      articleNo: record.articleNo,
      dispatchQuantity: String(record.dispatchQuantity),
      salePrice: String(record.salePrice),
      percentage: String(record.percentage),
    });
    setForm({
      date: record.date,
      articleNo: record.articleNo,
      dispatchQuantity: String(record.dispatchQuantity),
      salePrice: String(record.salePrice),
      percentage: String(record.percentage),
    });
    setErrors({});
    setSubTab("add");
  };

  const handleDelete = async (id: bigint, articleNo: string) => {
    try {
      await deleteDispatch.mutateAsync(id);
      toast.success(`Dispatch record for ${articleNo} deleted.`);
    } catch {
      toast.error("Failed to delete.");
    }
  };

  const handleClear = () => {
    setForm({ ...INITIAL_FORM, date: getTodayDate() });
    setErrors({});
    setEditingRecord(null);
  };

  const isPending = addDispatch.isPending || updateDispatch.isPending;

  const filteredRecords = dispatchRecords.filter((r) => {
    if (dateFrom && r.date < dateFrom) return false;
    if (dateTo && r.date > dateTo) return false;
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
          data-ocid="dispatch.add_tab"
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
          <Send className="inline w-4 h-4 mr-1.5 mb-0.5" />
          {editingRecord ? "Edit Dispatch" : "Add Dispatch"}
        </button>
        <button
          type="button"
          data-ocid="dispatch.view_tab"
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
          <Package className="inline w-4 h-4 mr-1.5 mb-0.5" />
          History ({dispatchRecords.length})
        </button>
      </div>

      {/* ─── ADD / EDIT FORM ─────────────────────────── */}
      {subTab === "add" && (
        <div className="space-y-4">
          {/* Live Calculation */}
          <div
            data-ocid="dispatch.result_card"
            className="rounded-lg border-2 overflow-hidden"
            style={{
              borderColor:
                finalPayment > 0
                  ? "oklch(var(--primary))"
                  : "oklch(var(--border))",
              background:
                finalPayment > 0
                  ? "oklch(var(--primary) / 0.06)"
                  : "oklch(var(--muted))",
              transition: "all 0.2s ease",
            }}
          >
            <div
              className="px-4 py-2.5 flex items-center gap-2 border-b"
              style={{
                borderColor:
                  finalPayment > 0
                    ? "oklch(var(--primary) / 0.2)"
                    : "oklch(var(--border))",
              }}
            >
              <TrendingUp
                className="w-4 h-4"
                style={{
                  color:
                    finalPayment > 0
                      ? "oklch(var(--primary))"
                      : "oklch(var(--muted-foreground))",
                }}
              />
              <span
                className="data-label"
                style={{
                  color: finalPayment > 0 ? "oklch(var(--primary))" : undefined,
                }}
              >
                Live Calculation
              </span>
            </div>
            <div className="px-4 py-3 grid grid-cols-2 gap-3">
              <div>
                <div className="data-label mb-1">Dispatch Qty</div>
                <div
                  className="data-value"
                  style={{
                    color:
                      dispatchQty > 0
                        ? "oklch(var(--foreground))"
                        : "oklch(var(--muted-foreground))",
                  }}
                >
                  {dispatchQty > 0 ? dispatchQty.toLocaleString() : "—"}
                </div>
              </div>
              <div>
                <div className="data-label mb-1">Final Payment</div>
                <div
                  className="data-value"
                  style={{
                    color:
                      finalPayment > 0
                        ? "oklch(var(--success))"
                        : "oklch(var(--muted-foreground))",
                    fontSize: "1.05rem",
                  }}
                >
                  {finalPayment > 0 ? `₨ ${finalPayment.toFixed(2)}` : "—"}
                </div>
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="space-y-3">
            {/* Date */}
            <div className="space-y-1">
              <Label htmlFor="dispatch-date" className="data-label">
                Date
              </Label>
              <Input
                id="dispatch-date"
                data-ocid="dispatch.date_input"
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

            {/* Article Number */}
            <div className="space-y-1">
              <Label htmlFor="dispatch-article" className="data-label">
                Article Number
              </Label>
              <select
                id="dispatch-article"
                data-ocid="dispatch.article_select"
                value={form.articleNo}
                onChange={handleChange("articleNo")}
                className="input-factory w-full"
                style={{
                  height: "44px",
                  background: "oklch(var(--card))",
                  color: "oklch(var(--foreground))",
                  border: `1px solid ${
                    errors.articleNo
                      ? "oklch(var(--destructive))"
                      : "oklch(var(--border))"
                  }`,
                  borderRadius: "8px",
                  padding: "0 12px",
                  fontSize: "15px",
                }}
              >
                <option value="">Select Article</option>
                {itemMasters.map((im) => (
                  <option key={String(im.id)} value={im.articleNo}>
                    {im.articleNo}
                  </option>
                ))}
              </select>
              {errors.articleNo && (
                <p
                  data-ocid="dispatch.article_error"
                  className="text-xs font-medium"
                  style={{ color: "oklch(var(--destructive))" }}
                >
                  {errors.articleNo}
                </p>
              )}
              {/* Stock info */}
              {form.articleNo && (
                <ArticleStockInfo
                  articleNo={form.articleNo}
                  dispatchRecords={dispatchRecords}
                />
              )}
            </div>

            {/* Dispatch Quantity */}
            <div className="space-y-1">
              <Label htmlFor="dispatch-qty" className="data-label">
                Dispatch Quantity
              </Label>
              <Input
                id="dispatch-qty"
                data-ocid="dispatch.quantity_input"
                type="number"
                inputMode="numeric"
                placeholder="0"
                value={form.dispatchQuantity}
                onChange={handleChange("dispatchQuantity")}
                className="input-factory"
                style={
                  errors.dispatchQuantity
                    ? { borderColor: "oklch(var(--destructive))" }
                    : {}
                }
              />
              {errors.dispatchQuantity && (
                <p
                  data-ocid="dispatch.quantity_error"
                  className="text-xs font-medium"
                  style={{ color: "oklch(var(--destructive))" }}
                >
                  {errors.dispatchQuantity}
                </p>
              )}
            </div>

            {/* Sale Price & Percentage */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="dispatch-price" className="data-label">
                  Sale Price (₨)
                </Label>
                <Input
                  id="dispatch-price"
                  data-ocid="dispatch.sale_price_input"
                  type="number"
                  inputMode="decimal"
                  placeholder="0.00"
                  step="0.01"
                  value={form.salePrice}
                  onChange={handleChange("salePrice")}
                  className="input-factory"
                  style={
                    errors.salePrice
                      ? { borderColor: "oklch(var(--destructive))" }
                      : {}
                  }
                />
                {errors.salePrice && (
                  <p
                    className="text-xs font-medium"
                    style={{ color: "oklch(var(--destructive))" }}
                  >
                    {errors.salePrice}
                  </p>
                )}
              </div>
              <div className="space-y-1">
                <Label htmlFor="dispatch-pct" className="data-label">
                  Percentage (%)
                </Label>
                <Input
                  id="dispatch-pct"
                  data-ocid="dispatch.percentage_input"
                  type="number"
                  inputMode="decimal"
                  placeholder="50"
                  step="0.01"
                  value={form.percentage}
                  onChange={handleChange("percentage")}
                  className="input-factory"
                  style={
                    errors.percentage
                      ? { borderColor: "oklch(var(--destructive))" }
                      : {}
                  }
                />
                {errors.percentage && (
                  <p
                    className="text-xs font-medium"
                    style={{ color: "oklch(var(--destructive))" }}
                  >
                    {errors.percentage}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Formula Info */}
          <div
            className="rounded-lg p-3 text-xs space-y-1"
            style={{
              background: "oklch(var(--muted))",
              color: "oklch(var(--muted-foreground))",
            }}
          >
            <div
              className="font-semibold mb-1"
              style={{ fontFamily: "Cabinet Grotesk, sans-serif" }}
            >
              Formula
            </div>
            <div>
              Final Payment = Dispatch Qty × Sale Price × Percentage ÷ 100
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2 pt-1">
            <Button
              data-ocid="dispatch.save_button"
              onClick={handleSave}
              disabled={isPending}
              className="w-full btn-factory"
              size="lg"
              style={{
                background: "oklch(var(--success))",
                color: "oklch(var(--success-foreground))",
              }}
            >
              {isPending ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5 mr-2" />
                  {editingRecord ? "Update Dispatch" : "Save Dispatch"}
                </>
              )}
            </Button>
            <Button
              data-ocid="dispatch.clear_button"
              onClick={handleClear}
              variant="outline"
              className="w-full btn-factory"
              size="lg"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Clear Form
            </Button>
          </div>
        </div>
      )}

      {/* ─── HISTORY VIEW ────────────────────────────── */}
      {subTab === "view" && (
        <div className="space-y-3">
          {/* Date filters */}
          <div
            className="rounded-lg p-3 space-y-2"
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
                  data-ocid="dispatch.date_from_input"
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="input-factory"
                />
              </div>
              <div className="space-y-1">
                <Label className="data-label">Date To</Label>
                <Input
                  data-ocid="dispatch.date_to_input"
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="input-factory"
                />
              </div>
            </div>
          </div>

          {isLoading && (
            <div
              data-ocid="dispatch.loading_state"
              className="flex items-center justify-center py-10"
            >
              <Loader2
                className="w-7 h-7 animate-spin"
                style={{ color: "oklch(var(--primary))" }}
              />
            </div>
          )}

          {!isLoading && filteredRecords.length === 0 && (
            <div
              data-ocid="dispatch.empty_state"
              className="rounded-xl border-2 border-dashed py-12 text-center"
              style={{ borderColor: "oklch(var(--border))" }}
            >
              <Send
                className="w-10 h-10 mx-auto mb-3"
                style={{ color: "oklch(var(--muted-foreground))" }}
              />
              <p
                className="font-semibold mb-1"
                style={{
                  fontFamily: "Cabinet Grotesk, sans-serif",
                  color: "oklch(var(--foreground))",
                }}
              >
                No dispatch records
              </p>
              <p
                className="text-sm"
                style={{ color: "oklch(var(--muted-foreground))" }}
              >
                Add a dispatch record using the Dispatch tab.
              </p>
            </div>
          )}

          {filteredRecords.map((record, idx) => (
            <div
              key={String(record.id)}
              data-ocid={`dispatch.item.${idx + 1}`}
              className="rounded-lg border overflow-hidden"
              style={{
                borderColor: "oklch(var(--border))",
                background: "oklch(var(--card))",
              }}
            >
              {/* Header */}
              <div
                className="px-4 py-2.5 flex items-center justify-between border-b"
                style={{
                  borderColor: "oklch(var(--border))",
                  background: "oklch(var(--muted))",
                }}
              >
                <div className="flex items-center gap-2">
                  <Send
                    className="w-4 h-4"
                    style={{ color: "oklch(var(--primary))" }}
                  />
                  <span
                    className="font-bold text-sm"
                    style={{
                      fontFamily: "Cabinet Grotesk, sans-serif",
                      color: "oklch(var(--foreground))",
                    }}
                  >
                    {record.articleNo}
                  </span>
                  <span
                    className="text-xs px-2 py-0.5 rounded-full"
                    style={{
                      background: "oklch(var(--primary) / 0.1)",
                      color: "oklch(var(--primary))",
                    }}
                  >
                    {record.date}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    data-ocid={`dispatch.edit_button.${idx + 1}`}
                    onClick={() => handleEdit(record)}
                    className="h-7 w-7 p-0"
                    style={{ color: "oklch(var(--primary))" }}
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    data-ocid={`dispatch.delete_button.${idx + 1}`}
                    onClick={() => handleDelete(record.id, record.articleNo)}
                    disabled={deleteDispatch.isPending}
                    className="h-7 w-7 p-0"
                    style={{ color: "oklch(var(--destructive))" }}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>

              {/* Body */}
              <div className="px-4 py-3 grid grid-cols-2 gap-x-4 gap-y-2">
                <div>
                  <div className="data-label">Dispatch Qty</div>
                  <div className="data-value text-sm">
                    {record.dispatchQuantity.toLocaleString()} pcs
                  </div>
                </div>
                <div>
                  <div className="data-label">Sale Price</div>
                  <div className="data-value text-sm">
                    ₨ {record.salePrice.toFixed(2)}
                  </div>
                </div>
                <div>
                  <div className="data-label">Percentage</div>
                  <div className="data-value text-sm">{record.percentage}%</div>
                </div>
              </div>

              <div
                className="px-4 py-2.5 flex items-center justify-between border-t"
                style={{
                  borderColor: "oklch(var(--border))",
                  background: "oklch(var(--success) / 0.05)",
                }}
              >
                <span className="data-label">Final Payment</span>
                <span
                  className="font-bold text-base"
                  style={{ color: "oklch(var(--success))" }}
                >
                  ₨ {record.finalPayment.toFixed(2)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
