import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertTriangle,
  CheckCircle2,
  Layers,
  Loader2,
  Package,
  Pencil,
  PlusCircle,
  RotateCcw,
  Save,
  Trash2,
} from "lucide-react";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import type { ItemMaster } from "../backend";
import {
  useAddItemMaster,
  useDeleteItemMaster,
  useGetItemMasters,
  useUpdateItemMaster,
} from "../hooks/useQueries";

type SubTab = "add" | "list";

interface SizeForm {
  articleNo: string;
  totalQuantity: string;
  sizeS: string;
  sizeM: string;
  sizeL: string;
  sizeXL: string;
  sizeXXL: string;
}

const INITIAL_FORM: SizeForm = {
  articleNo: "",
  totalQuantity: "",
  sizeS: "",
  sizeM: "",
  sizeL: "",
  sizeXL: "",
  sizeXXL: "",
};

function sizeSum(form: SizeForm): number {
  return (
    (Number(form.sizeS) || 0) +
    (Number(form.sizeM) || 0) +
    (Number(form.sizeL) || 0) +
    (Number(form.sizeXL) || 0) +
    (Number(form.sizeXXL) || 0)
  );
}

export function ItemMasterTab() {
  const [subTab, setSubTab] = useState<SubTab>("add");
  const [form, setForm] = useState<SizeForm>(INITIAL_FORM);
  const [errors, setErrors] = useState<Partial<SizeForm & { sizeSum: string }>>(
    {},
  );
  const [editingId, setEditingId] = useState<bigint | null>(null);

  const { data: itemMasters = [], isLoading } = useGetItemMasters();
  const addItemMaster = useAddItemMaster();
  const updateItemMaster = useUpdateItemMaster();
  const deleteItemMaster = useDeleteItemMaster();

  const totalQty = Number(form.totalQuantity) || 0;
  const currentSum = sizeSum(form);
  const sumMatchesTotal = totalQty > 0 && currentSum === totalQty;
  const sumExceedsTotal = totalQty > 0 && currentSum > totalQty;

  const handleChange = useCallback(
    (field: keyof SizeForm) => (e: React.ChangeEvent<HTMLInputElement>) => {
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
      setErrors((prev) => ({
        ...prev,
        [field]: undefined,
        sizeSum: undefined,
      }));
    },
    [],
  );

  const validate = (): boolean => {
    const newErrors: Partial<SizeForm & { sizeSum: string }> = {};
    if (!form.articleNo.trim()) newErrors.articleNo = "Article No. is required";
    if (!form.totalQuantity || Number(form.totalQuantity) <= 0)
      newErrors.totalQuantity = "Enter valid total quantity";
    if (currentSum !== totalQty)
      newErrors.sizeSum = "Total of all sizes must match the Total Quantity.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    const params = {
      articleNo: form.articleNo.trim(),
      totalQuantity: Number(form.totalQuantity),
      sizeS: Number(form.sizeS) || 0,
      sizeM: Number(form.sizeM) || 0,
      sizeL: Number(form.sizeL) || 0,
      sizeXL: Number(form.sizeXL) || 0,
      sizeXXL: Number(form.sizeXXL) || 0,
    };
    try {
      if (editingId !== null) {
        await updateItemMaster.mutateAsync({ id: editingId, ...params });
        toast.success("Item Master updated!");
        setEditingId(null);
      } else {
        await addItemMaster.mutateAsync(params);
        toast.success(`Article ${params.articleNo} created!`);
      }
      setForm(INITIAL_FORM);
      setErrors({});
      setSubTab("list");
    } catch (err) {
      console.error(err);
      toast.error("Failed to save. Please try again.");
    }
  };

  const handleEdit = (item: ItemMaster) => {
    setEditingId(item.id);
    setForm({
      articleNo: item.articleNo,
      totalQuantity: String(item.totalQuantity),
      sizeS: String(item.sizeS),
      sizeM: String(item.sizeM),
      sizeL: String(item.sizeL),
      sizeXL: String(item.sizeXL),
      sizeXXL: String(item.sizeXXL),
    });
    setErrors({});
    setSubTab("add");
  };

  const handleDelete = async (id: bigint, articleNo: string) => {
    try {
      await deleteItemMaster.mutateAsync(id);
      toast.success(`Article ${articleNo} deleted.`);
    } catch {
      toast.error("Failed to delete.");
    }
  };

  const handleClear = () => {
    setForm(INITIAL_FORM);
    setErrors({});
    setEditingId(null);
  };

  const isPending = addItemMaster.isPending || updateItemMaster.isPending;

  return (
    <div className="px-4 py-4 space-y-4">
      {/* Sub-tab Switcher */}
      <div
        className="flex rounded-lg overflow-hidden border"
        style={{ borderColor: "oklch(var(--border))" }}
      >
        <button
          type="button"
          data-ocid="item_master.add_tab"
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
          <PlusCircle className="inline w-4 h-4 mr-1.5 mb-0.5" />
          {editingId !== null ? "Edit Article" : "Add Article"}
        </button>
        <button
          type="button"
          data-ocid="item_master.list_tab"
          onClick={() => setSubTab("list")}
          className="flex-1 py-2.5 text-sm font-semibold transition-colors"
          style={{
            background:
              subTab === "list"
                ? "oklch(var(--primary))"
                : "oklch(var(--muted))",
            color:
              subTab === "list"
                ? "oklch(var(--primary-foreground))"
                : "oklch(var(--muted-foreground))",
            fontFamily: "Cabinet Grotesk, sans-serif",
          }}
        >
          <Layers className="inline w-4 h-4 mr-1.5 mb-0.5" />
          All Articles ({itemMasters.length})
        </button>
      </div>

      {/* ─── ADD / EDIT FORM ─────────────────────────── */}
      {subTab === "add" && (
        <div className="space-y-4">
          {editingId !== null && (
            <div
              className="rounded-lg p-3 flex items-center gap-2"
              style={{
                background: "oklch(var(--primary) / 0.08)",
                border: "1px solid oklch(var(--primary) / 0.25)",
              }}
            >
              <Pencil
                className="w-4 h-4"
                style={{ color: "oklch(var(--primary))" }}
              />
              <span
                className="text-sm font-semibold"
                style={{
                  color: "oklch(var(--primary))",
                  fontFamily: "Cabinet Grotesk, sans-serif",
                }}
              >
                Editing: {form.articleNo}
              </span>
            </div>
          )}

          <div className="space-y-3">
            {/* Article No */}
            <div className="space-y-1">
              <Label htmlFor="im-article" className="data-label">
                Article Number
              </Label>
              <Input
                id="im-article"
                data-ocid="item_master.article_input"
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
                  data-ocid="item_master.article_error"
                  className="text-xs font-medium"
                  style={{ color: "oklch(var(--destructive))" }}
                >
                  {errors.articleNo}
                </p>
              )}
            </div>

            {/* Total Quantity */}
            <div className="space-y-1">
              <Label htmlFor="im-total" className="data-label">
                Total Quantity
              </Label>
              <Input
                id="im-total"
                data-ocid="item_master.total_quantity_input"
                type="number"
                inputMode="numeric"
                placeholder="0"
                value={form.totalQuantity}
                onChange={handleChange("totalQuantity")}
                className="input-factory"
                style={
                  errors.totalQuantity
                    ? { borderColor: "oklch(var(--destructive))" }
                    : {}
                }
              />
              {errors.totalQuantity && (
                <p
                  className="text-xs font-medium"
                  style={{ color: "oklch(var(--destructive))" }}
                >
                  {errors.totalQuantity}
                </p>
              )}
            </div>

            {/* Size-wise Ratio */}
            <div
              className="rounded-lg p-3 space-y-3"
              style={{
                background: "oklch(var(--muted))",
                border: "1px solid oklch(var(--border))",
              }}
            >
              <div className="flex items-center justify-between">
                <span
                  className="text-sm font-bold"
                  style={{
                    fontFamily: "Cabinet Grotesk, sans-serif",
                    color: "oklch(var(--foreground))",
                  }}
                >
                  Size-wise Ratio
                </span>
                {totalQty > 0 && (
                  <span
                    className="text-xs font-semibold px-2 py-0.5 rounded-full"
                    style={{
                      background: sumMatchesTotal
                        ? "oklch(var(--success) / 0.15)"
                        : sumExceedsTotal
                          ? "oklch(var(--destructive) / 0.15)"
                          : "oklch(var(--primary) / 0.12)",
                      color: sumMatchesTotal
                        ? "oklch(var(--success))"
                        : sumExceedsTotal
                          ? "oklch(var(--destructive))"
                          : "oklch(var(--primary))",
                    }}
                  >
                    {currentSum} / {totalQty}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-5 gap-2">
                {(
                  ["sizeS", "sizeM", "sizeL", "sizeXL", "sizeXXL"] as const
                ).map((key, i) => {
                  const labels = ["S", "M", "L", "XL", "XXL"];
                  return (
                    <div key={key} className="space-y-1">
                      <Label
                        htmlFor={`im-${key}`}
                        className="data-label text-center block"
                      >
                        {labels[i]}
                      </Label>
                      <Input
                        id={`im-${key}`}
                        data-ocid={`item_master.size_${labels[i].toLowerCase()}_input`}
                        type="number"
                        inputMode="numeric"
                        placeholder="0"
                        value={form[key]}
                        onChange={handleChange(key)}
                        className="input-factory text-center px-1"
                      />
                    </div>
                  );
                })}
              </div>

              {/* Size sum validation */}
              {sumMatchesTotal && (
                <div
                  data-ocid="item_master.size_match_success"
                  className="flex items-center gap-2"
                >
                  <CheckCircle2
                    className="w-4 h-4"
                    style={{ color: "oklch(var(--success))" }}
                  />
                  <span
                    className="text-xs font-medium"
                    style={{ color: "oklch(var(--success))" }}
                  >
                    Sizes match Total Quantity ✓
                  </span>
                </div>
              )}
              {errors.sizeSum && (
                <div
                  data-ocid="item_master.size_sum_error"
                  className="flex items-start gap-2"
                >
                  <AlertTriangle
                    className="w-4 h-4 mt-0.5 shrink-0"
                    style={{ color: "oklch(var(--destructive))" }}
                  />
                  <p
                    className="text-xs font-medium"
                    style={{ color: "oklch(var(--destructive))" }}
                  >
                    {errors.sizeSum}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2 pt-1">
            <Button
              data-ocid="item_master.save_button"
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
                  {editingId !== null ? "Update Article" : "Save Article"}
                </>
              )}
            </Button>
            <Button
              data-ocid="item_master.clear_button"
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

      {/* ─── LIST VIEW ───────────────────────────────── */}
      {subTab === "list" && (
        <div className="space-y-3">
          {isLoading && (
            <div
              data-ocid="item_master.loading_state"
              className="flex items-center justify-center py-10"
            >
              <Loader2
                className="w-7 h-7 animate-spin"
                style={{ color: "oklch(var(--primary))" }}
              />
            </div>
          )}

          {!isLoading && itemMasters.length === 0 && (
            <div
              data-ocid="item_master.empty_state"
              className="rounded-xl border-2 border-dashed py-12 text-center"
              style={{ borderColor: "oklch(var(--border))" }}
            >
              <Package
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
                No articles yet
              </p>
              <p
                className="text-sm"
                style={{ color: "oklch(var(--muted-foreground))" }}
              >
                Add your first article using the Add tab.
              </p>
            </div>
          )}

          {itemMasters.map((item, idx) => (
            <div
              key={String(item.id)}
              data-ocid={`item_master.item.${idx + 1}`}
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
                  <Package
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
                    {item.articleNo}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    data-ocid={`item_master.edit_button.${idx + 1}`}
                    onClick={() => handleEdit(item)}
                    className="h-7 w-7 p-0"
                    style={{ color: "oklch(var(--primary))" }}
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    data-ocid={`item_master.delete_button.${idx + 1}`}
                    onClick={() => handleDelete(item.id, item.articleNo)}
                    disabled={deleteItemMaster.isPending}
                    className="h-7 w-7 p-0"
                    style={{ color: "oklch(var(--destructive))" }}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>

              {/* Body */}
              <div className="px-4 py-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="data-label">Total Quantity</span>
                  <span
                    className="font-bold text-base"
                    style={{ color: "oklch(var(--primary))" }}
                  >
                    {item.totalQuantity.toLocaleString()} pcs
                  </span>
                </div>
                {/* Size breakdown */}
                <div className="grid grid-cols-5 gap-1 text-center">
                  {[
                    { label: "S", val: item.sizeS },
                    { label: "M", val: item.sizeM },
                    { label: "L", val: item.sizeL },
                    { label: "XL", val: item.sizeXL },
                    { label: "XXL", val: item.sizeXXL },
                  ].map(({ label, val }) => (
                    <div
                      key={label}
                      className="rounded-md py-1.5"
                      style={{ background: "oklch(var(--muted))" }}
                    >
                      <div
                        className="text-xs font-bold"
                        style={{ color: "oklch(var(--primary))" }}
                      >
                        {label}
                      </div>
                      <div
                        className="text-sm font-semibold"
                        style={{ color: "oklch(var(--foreground))" }}
                      >
                        {val}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
