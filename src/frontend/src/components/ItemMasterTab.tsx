import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Camera, Image, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { ItemMaster } from "../backend";
import { useActor } from "../hooks/useActor";
import {
  type ArticleRates,
  loadArticleRates,
  saveArticleRates,
} from "../utils/articleRates";
import {
  compressImage,
  deleteArticleImage,
  getArticleImage,
  saveArticleImage,
} from "../utils/imageUtils";
import { getFromCache, saveToCache } from "../utils/offlineCache";
import { cleanErrorMessage, withRetry } from "../utils/retryUtils";
import { enqueuePending } from "../utils/syncQueue";
import { DashboardAlerts } from "./DashboardAlerts";

const ALL_SIZES = [
  "XS",
  "S",
  "M",
  "L",
  "XL",
  "XXL",
  "3XL",
  "4XL",
  "5XL",
] as const;
type SizeName = (typeof ALL_SIZES)[number];

const SIZE_KEYS: Record<SizeName, keyof ItemMaster> = {
  XS: "sizeXS",
  S: "sizeS",
  M: "sizeM",
  L: "sizeL",
  XL: "sizeXL",
  XXL: "sizeXXL",
  "3XL": "size3XL",
  "4XL": "size4XL",
  "5XL": "size5XL",
};

const PREDEFINED_WORK_TYPES = [
  "Tailor Stitching",
  "Overlock",
  "Folding",
  "Press",
  "Packing",
  "Thread Cutting",
];

const WORK_TYPE_RATE_KEYS: Record<string, keyof ArticleRates> = {
  "Tailor Stitching": "tailorRate",
  Overlock: "overlockRate",
  Folding: "foldingRate",
  Press: "pressRate",
  Packing: "packingRate",
  "Thread Cutting": "threadCuttingRate",
};

interface ColorEntry {
  color: string;
  sizes: Record<string, number>;
}

interface FormState {
  articleNo: string;
  totalQuantity: string;
  hasAdditionalWork: boolean;
  selectedWorkTypes: string[];
  customWorkType: string;
  colorEntries: ColorEntry[];
}

interface CustomSizeInput {
  id: number;
  name: string;
  qty: string;
}

const emptyForm = (): FormState => ({
  articleNo: "",
  totalQuantity: "",
  hasAdditionalWork: false,
  selectedWorkTypes: [],
  customWorkType: "",
  colorEntries: [],
});

const emptyRates = (): ArticleRates => ({
  tailorRate: 0,
  overlockRate: 0,
  foldingRate: 0,
  pressRate: 0,
  packingRate: 0,
  threadCuttingRate: 0,
  customRates: {},
});

function parseColorSizeData(raw: string): ColorEntry[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map(
      (entry: { color: string; sizes: Record<string, number> }) => ({
        color: entry.color || "",
        sizes: entry.sizes || {},
      }),
    );
  } catch {
    return [];
  }
}

let _customSizeIdCounter = 0;
const nextCustomSizeId = () => ++_customSizeIdCounter;

export function ItemMasterTab() {
  const { actor } = useActor();
  const [items, setItems] = useState<ItemMaster[]>([]);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [rates, setRates] = useState<ArticleRates>(emptyRates());
  const [editId, setEditId] = useState<bigint | null>(null);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [fabricPerPiece, setFabricPerPiece] = useState(0);
  const [fabricUnit, setFabricUnit] = useState<"meters" | "grams" | "kg">(
    "meters",
  );

  // Article image state
  const [articleImageUrl, setArticleImageUrl] = useState<string>("");
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  // Detail modal state
  const [detailItem, setDetailItem] = useState<ItemMaster | null>(null);

  // Color add form state
  const [showColorForm, setShowColorForm] = useState(false);
  const [editColorIndex, setEditColorIndex] = useState<number | null>(null);
  const [newColorName, setNewColorName] = useState("");
  const [newColorSizes, setNewColorSizes] = useState<Record<string, string>>(
    {},
  );
  const [customSizeInputs, setCustomSizeInputs] = useState<CustomSizeInput[]>(
    [],
  );

  const loadItems = async () => {
    // 1. Load from cache immediately for instant render
    const cached = await getFromCache<typeof items>(
      "ProductionMasterCache",
      "cache",
      "items_cache",
    );
    if (cached && cached.length > 0) {
      setItems(cached);
    }
    // 2. Fetch from backend in background
    if (!actor) return;
    try {
      const data = await actor.getItemMasters();
      setItems(data as typeof data);
      saveToCache("ProductionMasterCache", "cache", "items_cache", data).catch(
        () => {},
      );
    } catch {
      if (!cached || cached.length === 0) {
        // no-op
      } else {
        import("sonner").then(({ toast: t }) => {
          t.info("Showing cached data – server unavailable", {
            id: "items-cached",
          });
        });
      }
    }
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: load on actor ready
  useEffect(() => {
    loadItems();
  }, [actor]);

  const handleImageFile = async (file: File) => {
    try {
      const compressed = await compressImage(file);
      setArticleImageUrl(compressed);
    } catch {
      toast.error("Failed to process image. Please try again.");
    }
  };

  // Sum all quantities across all colors and all sizes
  const totalColorSizeSum = form.colorEntries.reduce((total, ce) => {
    return total + Object.values(ce.sizes).reduce((s, v) => s + (v || 0), 0);
  }, 0);

  const totalQtyNum = Number.parseFloat(form.totalQuantity) || 0;
  const sizeMatchesTotal =
    form.colorEntries.length === 0 ||
    Math.abs(totalColorSizeSum - totalQtyNum) < 0.01;

  const handleSave = async () => {
    if (!actor) {
      toast.error("Not connected");
      return;
    }
    if (!form.articleNo.trim()) {
      toast.error("Article Number is required");
      return;
    }
    if (!articleImageUrl && editId === null) {
      toast.error("Article Image is required");
      return;
    }
    if (totalQtyNum <= 0) {
      toast.error("Total Quantity must be greater than 0");
      return;
    }

    const colorSizeData = JSON.stringify(
      form.colorEntries.map((ce) => ({ color: ce.color, sizes: ce.sizes })),
    );
    const colorsStr = form.colorEntries.map((ce) => ce.color).join(",");
    const flatSizes: Record<string, number> = {};
    for (const size of ALL_SIZES) {
      flatSizes[size] = form.colorEntries.reduce(
        (sum, ce) => sum + (ce.sizes[size] || 0),
        0,
      );
    }
    const workTypes = form.selectedWorkTypes.join(",");

    setLoading(true);
    try {
      if (editId !== null) {
        const ok = await withRetry(() =>
          actor.updateItemMaster(
            editId,
            form.articleNo.trim(),
            totalQtyNum,
            colorsStr,
            form.hasAdditionalWork,
            workTypes,
            flatSizes.XS ?? 0,
            flatSizes.S ?? 0,
            flatSizes.M ?? 0,
            flatSizes.L ?? 0,
            flatSizes.XL ?? 0,
            flatSizes.XXL ?? 0,
            flatSizes["3XL"] ?? 0,
            flatSizes["4XL"] ?? 0,
            flatSizes["5XL"] ?? 0,
            colorSizeData,
          ),
        );
        if (!ok) {
          toast.error("Item not found — could not update");
          setLoading(false);
          return;
        }
      } else {
        await withRetry(() =>
          actor.addItemMaster(
            form.articleNo.trim(),
            totalQtyNum,
            colorsStr,
            form.hasAdditionalWork,
            workTypes,
            flatSizes.XS ?? 0,
            flatSizes.S ?? 0,
            flatSizes.M ?? 0,
            flatSizes.L ?? 0,
            flatSizes.XL ?? 0,
            flatSizes.XXL ?? 0,
            flatSizes["3XL"] ?? 0,
            flatSizes["4XL"] ?? 0,
            flatSizes["5XL"] ?? 0,
            colorSizeData,
          ),
        );
      }
    } catch (saveErr) {
      console.error("[ItemMaster] Backend save error:", saveErr);
      if (editId === null) {
        const pendingData = {
          articleNo: form.articleNo.trim(),
          totalQuantity: totalQtyNum,
          colorSizeData: JSON.stringify(
            form.colorEntries.map((ce) => ({
              color: ce.color,
              sizes: ce.sizes,
            })),
          ),
          workTypes: form.selectedWorkTypes.join(","),
          hasAdditionalWork: form.hasAdditionalWork,
        };
        enqueuePending("item_master", pendingData);
        toast.warning("Saved offline – will sync when server is available");
      } else {
        toast.error(cleanErrorMessage(saveErr));
      }
      setLoading(false);
      return;
    }

    // post-save
    const isUpdate = editId !== null;
    saveArticleRates(form.articleNo, rates);
    if (articleImageUrl) {
      saveArticleImage(form.articleNo.trim(), articleImageUrl);
    }
    if (fabricPerPiece > 0 && actor) {
      actor.setFabricPerPiece(form.articleNo, fabricPerPiece).catch(() => {});
    }
    localStorage.setItem(`fabricUnit_${form.articleNo}`, fabricUnit);
    setFabricPerPiece(0);
    setFabricUnit("meters");
    setForm(emptyForm());
    setRates(emptyRates());
    setArticleImageUrl("");
    setEditId(null);
    setShowForm(false);
    toast.success(
      isUpdate ? "Item updated successfully" : "Item saved successfully",
    );
    setLoading(false);

    await loadItems().catch((e) =>
      console.warn("[ItemMaster] Refresh failed:", e),
    );
  };

  const handleEdit = (item: ItemMaster) => {
    const colorEntries = parseColorSizeData(item.colorSizeData);
    const entries: ColorEntry[] =
      colorEntries.length > 0
        ? colorEntries
        : item.colors
          ? item.colors
              .split(",")
              .filter(Boolean)
              .map((c) => {
                const sizes: Record<string, number> = {};
                for (const s of ALL_SIZES) {
                  sizes[s] = (item[SIZE_KEYS[s]] as number) || 0;
                }
                return { color: c.trim(), sizes };
              })
          : [];

    setForm({
      articleNo: item.articleNo,
      totalQuantity: String(item.totalQuantity),
      hasAdditionalWork: item.hasAdditionalWork,
      selectedWorkTypes: item.workTypes
        ? item.workTypes.split(",").filter(Boolean)
        : [],
      customWorkType: "",
      colorEntries: entries,
    });
    setRates(loadArticleRates(item.articleNo));
    const savedUnit = localStorage.getItem(`fabricUnit_${item.articleNo}`) as
      | "meters"
      | "grams"
      | "kg"
      | null;
    setFabricUnit(savedUnit || "meters");
    if (actor) {
      actor
        .getFabricPerPiece(item.articleNo)
        .then((v) => setFabricPerPiece(v))
        .catch(() => {});
    }
    // Load saved image
    const img = getArticleImage(item.articleNo);
    setArticleImageUrl(img || "");
    setEditId(item.id);
    setShowForm(true);
  };

  const handleDelete = async (id: bigint) => {
    if (!actor) return;
    if (!confirm("Delete this item?")) return;
    try {
      // Also clean up image from localStorage
      const item = items.find((i) => i.id === id);
      if (item) deleteArticleImage(item.articleNo);
      await actor.deleteItemMaster(id);
      toast.success("Deleted");
      await loadItems();
    } catch {
      toast.error("Failed to delete");
    }
  };

  const toggleWorkType = (wt: string) => {
    setForm((f) => ({
      ...f,
      selectedWorkTypes: f.selectedWorkTypes.includes(wt)
        ? f.selectedWorkTypes.filter((x) => x !== wt)
        : [...f.selectedWorkTypes, wt],
    }));
  };

  const addCustomWorkType = () => {
    const wt = form.customWorkType.trim();
    if (!wt) return;
    if (!form.selectedWorkTypes.includes(wt)) {
      setForm((f) => ({
        ...f,
        selectedWorkTypes: [...f.selectedWorkTypes, wt],
        customWorkType: "",
      }));
    } else {
      setForm((f) => ({ ...f, customWorkType: "" }));
    }
  };

  const closeColorForm = () => {
    setShowColorForm(false);
    setEditColorIndex(null);
    setNewColorName("");
    setNewColorSizes({});
    setCustomSizeInputs([]);
  };

  const openAddColorForm = () => {
    setEditColorIndex(null);
    setNewColorName("");
    setNewColorSizes({});
    setCustomSizeInputs([]);
    setShowColorForm(true);
  };

  const openEditColorForm = (idx: number) => {
    const ce = form.colorEntries[idx];
    setEditColorIndex(idx);
    setNewColorName(ce.color);
    const predefinedSizeSet = new Set<string>(ALL_SIZES);
    const predefined: Record<string, string> = {};
    const custom: CustomSizeInput[] = [];
    for (const [k, v] of Object.entries(ce.sizes)) {
      if (predefinedSizeSet.has(k)) {
        predefined[k] = String(v);
      } else {
        custom.push({ id: nextCustomSizeId(), name: k, qty: String(v) });
      }
    }
    setNewColorSizes(predefined);
    setCustomSizeInputs(custom);
    setShowColorForm(true);
  };

  const saveColorEntry = () => {
    if (!newColorName.trim()) {
      toast.error("Color name is required");
      return;
    }
    const sizesObj: Record<string, number> = {};
    for (const size of ALL_SIZES) {
      const val = Number.parseFloat(newColorSizes[size] || "0") || 0;
      if (val > 0) sizesObj[size] = val;
    }
    for (const cs of customSizeInputs) {
      const name = cs.name.trim();
      const qty = Number.parseFloat(cs.qty) || 0;
      if (name && qty > 0) sizesObj[name] = qty;
    }
    const newEntry: ColorEntry = {
      color: newColorName.trim(),
      sizes: sizesObj,
    };
    setForm((f) => {
      const entries = [...f.colorEntries];
      if (editColorIndex !== null) {
        entries[editColorIndex] = newEntry;
      } else {
        if (
          entries.some(
            (e) => e.color.toLowerCase() === newEntry.color.toLowerCase(),
          )
        ) {
          toast.error("Color already added");
          return f;
        }
        entries.push(newEntry);
      }
      return { ...f, colorEntries: entries };
    });
    closeColorForm();
  };

  const removeColorEntry = (idx: number) => {
    setForm((f) => ({
      ...f,
      colorEntries: f.colorEntries.filter((_, i) => i !== idx),
    }));
  };

  const workTypesNeedingRates = form.selectedWorkTypes;

  const getRateForWT = (wt: string): string => {
    const key = WORK_TYPE_RATE_KEYS[wt];
    if (key) return String((rates[key] as number) || "");
    return String(rates.customRates[wt] || "");
  };

  const setRateForWT = (wt: string, val: string) => {
    const num = Number.parseFloat(val) || 0;
    const key = WORK_TYPE_RATE_KEYS[wt];
    if (key) {
      setRates((r) => ({ ...r, [key]: num }));
    } else {
      setRates((r) => ({
        ...r,
        customRates: { ...r.customRates, [wt]: num },
      }));
    }
  };

  const getItemRates = (articleNo: string) => loadArticleRates(articleNo);

  return (
    <div className="p-4 pb-24 space-y-4">
      <DashboardAlerts />
      <div className="flex items-center justify-between">
        <h2
          className="text-lg font-bold"
          style={{ color: "oklch(var(--foreground))" }}
        >
          Item Master
        </h2>
        <Button
          data-ocid="item_master.open_modal_button"
          onClick={() => {
            setForm(emptyForm());
            setRates(emptyRates());
            setEditId(null);
            setFabricUnit("meters");
            setArticleImageUrl("");
            setShowForm(true);
            setShowColorForm(false);
          }}
          size="sm"
        >
          + New Item
        </Button>
      </div>

      {showForm && (
        <div
          className="rounded-xl border p-4 space-y-3"
          style={{
            background: "oklch(var(--card))",
            borderColor: "oklch(var(--border))",
          }}
        >
          <h3
            className="font-semibold text-sm"
            style={{ color: "oklch(var(--foreground))" }}
          >
            {editId !== null ? "Edit Item" : "New Item"}
          </h3>

          <div>
            <Label>Article Number *</Label>
            <Input
              data-ocid="item_master.article_input"
              value={form.articleNo}
              onChange={(e) =>
                setForm((f) => ({ ...f, articleNo: e.target.value }))
              }
              placeholder="e.g. ART-001"
            />
          </div>

          {/* Article Image Upload */}
          <div>
            <Label>
              Article Image{" "}
              {editId !== null ? (
                <span
                  className="text-xs font-normal"
                  style={{ color: "oklch(var(--muted-foreground))" }}
                >
                  (Optional)
                </span>
              ) : (
                <span
                  className="text-xs font-normal"
                  style={{ color: "oklch(var(--destructive))" }}
                >
                  *
                </span>
              )}
            </Label>

            {/* Hidden file inputs */}
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (file) await handleImageFile(file);
                e.target.value = "";
              }}
            />
            <input
              ref={galleryInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (file) await handleImageFile(file);
                e.target.value = "";
              }}
            />

            <div className="flex gap-2 mt-1">
              <Button
                data-ocid="item_master.image_camera_button"
                type="button"
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => cameraInputRef.current?.click()}
              >
                <Camera className="w-4 h-4 mr-1" />
                Camera
              </Button>
              <Button
                data-ocid="item_master.image_gallery_button"
                type="button"
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => galleryInputRef.current?.click()}
              >
                <Image className="w-4 h-4 mr-1" />
                Gallery
              </Button>
            </div>

            {articleImageUrl ? (
              <div className="relative mt-2">
                <img
                  src={articleImageUrl}
                  alt="Article preview"
                  className="w-full max-h-48 object-contain rounded-lg"
                  style={{
                    border: "1px solid oklch(var(--border))",
                    background: "oklch(var(--muted) / 0.3)",
                  }}
                />
                <button
                  type="button"
                  onClick={() => setArticleImageUrl("")}
                  className="absolute top-1 right-1 rounded-full p-1"
                  style={{
                    background: "oklch(var(--destructive))",
                    color: "oklch(var(--destructive-foreground))",
                  }}
                  aria-label="Remove image"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <div
                className="mt-2 rounded-lg border-2 border-dashed flex items-center justify-center h-24 text-sm"
                style={{
                  borderColor: "oklch(var(--border))",
                  color: "oklch(var(--muted-foreground))",
                }}
              >
                No image uploaded
              </div>
            )}
          </div>

          <div>
            <Label>Total Cutting Quantity *</Label>
            <Input
              data-ocid="item_master.qty_input"
              type="number"
              value={form.totalQuantity}
              onChange={(e) =>
                setForm((f) => ({ ...f, totalQuantity: e.target.value }))
              }
              placeholder="e.g. 500"
            />
          </div>

          <div>
            <Label>Fabric Consumption Per Piece — Optional</Label>
            <div className="flex gap-2 mt-1 mb-2">
              {(["meters", "grams", "kg"] as const).map((unit) => (
                <button
                  key={unit}
                  type="button"
                  onClick={() => setFabricUnit(unit)}
                  className="px-4 py-1.5 rounded-lg text-sm font-medium border transition-colors"
                  style={{
                    background:
                      fabricUnit === unit
                        ? "oklch(var(--primary))"
                        : "transparent",
                    color:
                      fabricUnit === unit
                        ? "oklch(var(--primary-foreground))"
                        : "oklch(var(--foreground))",
                    borderColor: "oklch(var(--border))",
                  }}
                >
                  {unit === "meters"
                    ? "Meters"
                    : unit === "grams"
                      ? "Grams"
                      : "KG"}
                </button>
              ))}
            </div>
            <Input
              data-ocid="item_master.input"
              type="number"
              step={
                fabricUnit === "meters" || fabricUnit === "kg" ? "0.01" : "1"
              }
              value={fabricPerPiece > 0 ? String(fabricPerPiece) : ""}
              onChange={(e) =>
                setFabricPerPiece(Number.parseFloat(e.target.value) || 0)
              }
              placeholder={
                fabricUnit === "meters"
                  ? "e.g. 1.5"
                  : fabricUnit === "kg"
                    ? "e.g. 1.25"
                    : "e.g. 250"
              }
            />
          </div>

          {/* Colors Section */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>Colors &amp; Size-wise Quantity (Optional)</Label>
              <Button
                data-ocid="item_master.add_color_button"
                type="button"
                variant="outline"
                size="sm"
                onClick={openAddColorForm}
              >
                + Add Color
              </Button>
            </div>

            {form.colorEntries.length > 0 && form.totalQuantity && (
              <p
                className="text-xs mb-2"
                style={{
                  color: sizeMatchesTotal
                    ? "oklch(var(--primary))"
                    : "oklch(var(--destructive))",
                }}
              >
                Total entered: {totalColorSizeSum} / {totalQtyNum} pcs
                {sizeMatchesTotal ? " ✓" : " — must match total quantity"}
              </p>
            )}

            {form.colorEntries.length === 0 && (
              <p
                className="text-xs"
                style={{ color: "oklch(var(--muted-foreground))" }}
              >
                No colors added (optional). Click "+ Add Color" to add
                color-wise quantities.
              </p>
            )}

            <div className="space-y-2">
              {form.colorEntries.map((ce, idx) => (
                <div
                  key={ce.color}
                  className="rounded-lg border p-2"
                  style={{
                    background: "oklch(var(--muted) / 0.4)",
                    borderColor: "oklch(var(--border))",
                  }}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className="font-semibold text-sm"
                      style={{ color: "oklch(var(--foreground))" }}
                    >
                      {ce.color}
                    </span>
                    <div className="flex gap-1">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => openEditColorForm(idx)}
                        className="h-6 text-xs px-2"
                      >
                        Edit
                      </Button>
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => removeColorEntry(idx)}
                        className="h-6 px-2"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {Object.entries(ce.sizes)
                      .filter(([, v]) => v > 0)
                      .map(([size, qty]) => (
                        <span
                          key={size}
                          className="text-xs px-2 py-0.5 rounded-full"
                          style={{
                            background: "oklch(var(--primary) / 0.12)",
                            color: "oklch(var(--primary))",
                          }}
                        >
                          {size}: {qty}
                        </span>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Color Form (inline) */}
          {showColorForm && (
            <div
              className="rounded-lg border p-3 space-y-3"
              style={{
                background: "oklch(var(--card))",
                borderColor: "oklch(var(--primary) / 0.4)",
              }}
            >
              <p
                className="font-semibold text-xs"
                style={{ color: "oklch(var(--primary))" }}
              >
                {editColorIndex !== null ? "Edit Color" : "Add Color"}
              </p>
              <div>
                <Label className="text-xs">Color Name *</Label>
                <Input
                  value={newColorName}
                  onChange={(e) => setNewColorName(e.target.value)}
                  placeholder="e.g. Black, Blue, Red"
                  className="text-sm"
                />
              </div>
              <div>
                <Label className="text-xs mb-2 block">
                  Size-wise Quantity (Optional)
                </Label>
                <div className="grid grid-cols-3 gap-2">
                  {ALL_SIZES.map((size) => (
                    <div key={size}>
                      <label
                        htmlFor={`color-size-${size}`}
                        className="text-xs font-medium"
                        style={{ color: "oklch(var(--muted-foreground))" }}
                      >
                        {size}
                      </label>
                      <Input
                        id={`color-size-${size}`}
                        type="number"
                        value={newColorSizes[size] || ""}
                        onChange={(e) =>
                          setNewColorSizes((s) => ({
                            ...s,
                            [size]: e.target.value,
                          }))
                        }
                        placeholder="0"
                        className="text-sm"
                        min="0"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Custom Sizes Section */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className="text-xs font-semibold"
                    style={{ color: "oklch(var(--foreground))" }}
                  >
                    Custom Sizes
                  </span>
                  <span
                    className="text-xs"
                    style={{ color: "oklch(var(--muted-foreground))" }}
                  >
                    (Optional)
                  </span>
                </div>

                {customSizeInputs.length > 0 && (
                  <div className="space-y-2 mb-2">
                    {customSizeInputs.map((cs, csIdx) => (
                      <div key={cs.id} className="flex items-center gap-2">
                        <Input
                          value={cs.name}
                          onChange={(e) =>
                            setCustomSizeInputs((prev) =>
                              prev.map((item, i) =>
                                i === csIdx
                                  ? { ...item, name: e.target.value }
                                  : item,
                              ),
                            )
                          }
                          placeholder="Size name (e.g. Free Size, 28)"
                          className="text-sm flex-1"
                        />
                        <Input
                          type="number"
                          value={cs.qty}
                          onChange={(e) =>
                            setCustomSizeInputs((prev) =>
                              prev.map((item, i) =>
                                i === csIdx
                                  ? { ...item, qty: e.target.value }
                                  : item,
                              ),
                            )
                          }
                          placeholder="Qty"
                          className="text-sm w-20"
                          min="0"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setCustomSizeInputs((prev) =>
                              prev.filter((_, i) => i !== csIdx),
                            )
                          }
                          className="p-1 rounded transition-colors"
                          style={{ color: "oklch(var(--destructive))" }}
                          aria-label="Remove custom size"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <Button
                  data-ocid="item_master.add_custom_size_button"
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setCustomSizeInputs((prev) => [
                      ...prev,
                      { id: nextCustomSizeId(), name: "", qty: "" },
                    ])
                  }
                >
                  + Add Custom Size
                </Button>
              </div>

              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  onClick={saveColorEntry}
                  className="flex-1"
                >
                  {editColorIndex !== null ? "Update Color" : "Add Color"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={closeColorForm}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* Additional Work */}
          <div>
            <Label className="block mb-2">Additional Work Required?</Label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() =>
                  setForm((f) => ({ ...f, hasAdditionalWork: true }))
                }
                className="px-4 py-1.5 rounded-lg text-sm font-medium border transition-colors"
                style={{
                  background: form.hasAdditionalWork
                    ? "oklch(var(--primary))"
                    : "transparent",
                  color: form.hasAdditionalWork
                    ? "oklch(var(--primary-foreground))"
                    : "oklch(var(--foreground))",
                  borderColor: "oklch(var(--border))",
                }}
              >
                Yes
              </button>
              <button
                type="button"
                onClick={() =>
                  setForm((f) => ({
                    ...f,
                    hasAdditionalWork: false,
                    selectedWorkTypes: [],
                  }))
                }
                className="px-4 py-1.5 rounded-lg text-sm font-medium border transition-colors"
                style={{
                  background: !form.hasAdditionalWork
                    ? "oklch(var(--primary))"
                    : "transparent",
                  color: !form.hasAdditionalWork
                    ? "oklch(var(--primary-foreground))"
                    : "oklch(var(--foreground))",
                  borderColor: "oklch(var(--border))",
                }}
              >
                No
              </button>
            </div>
          </div>

          {/* Work Types Selection */}
          {form.hasAdditionalWork && (
            <div>
              <Label className="block mb-2">Work Types</Label>
              <div className="flex flex-wrap gap-2 mb-2">
                {PREDEFINED_WORK_TYPES.map((wt) => (
                  <button
                    key={wt}
                    type="button"
                    onClick={() => toggleWorkType(wt)}
                    className="px-3 py-1 rounded-full text-xs font-medium border transition-colors"
                    style={{
                      background: form.selectedWorkTypes.includes(wt)
                        ? "oklch(var(--primary))"
                        : "transparent",
                      color: form.selectedWorkTypes.includes(wt)
                        ? "oklch(var(--primary-foreground))"
                        : "oklch(var(--foreground))",
                      borderColor: "oklch(var(--border))",
                    }}
                  >
                    {wt}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  value={form.customWorkType}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, customWorkType: e.target.value }))
                  }
                  placeholder="Custom work type..."
                  className="text-sm"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addCustomWorkType();
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addCustomWorkType}
                >
                  Add
                </Button>
              </div>
              {form.selectedWorkTypes.length > 0 && (
                <p
                  className="text-xs mt-1"
                  style={{ color: "oklch(var(--muted-foreground))" }}
                >
                  Selected: {form.selectedWorkTypes.join(", ")}
                </p>
              )}
            </div>
          )}

          {/* Work Type Rates */}
          <div
            className="rounded-xl border p-3 space-y-3"
            style={{
              background: "oklch(var(--primary) / 0.04)",
              borderColor: "oklch(var(--primary) / 0.2)",
            }}
          >
            <p
              className="font-semibold text-sm"
              style={{ color: "oklch(var(--primary))" }}
            >
              Work Type Rates (₹ per PCS)
            </p>
            <p
              className="text-xs"
              style={{ color: "oklch(var(--muted-foreground))" }}
            >
              Define rates once here. They will auto-fill when selecting this
              article in Tailor and Additional Work tabs.
            </p>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Tailor Stitching Rate</Label>
                <div className="relative">
                  <span
                    className="absolute left-2 top-1/2 -translate-y-1/2 text-sm"
                    style={{ color: "oklch(var(--muted-foreground))" }}
                  >
                    ₹
                  </span>
                  <Input
                    data-ocid="item_master.tailor_rate_input"
                    type="number"
                    value={rates.tailorRate || ""}
                    onChange={(e) =>
                      setRates((r) => ({
                        ...r,
                        tailorRate: Number.parseFloat(e.target.value) || 0,
                      }))
                    }
                    placeholder="0"
                    className="pl-6 text-sm"
                    min="0"
                  />
                </div>
              </div>

              {PREDEFINED_WORK_TYPES.filter(
                (wt) => wt !== "Tailor Stitching",
              ).map((wt) => (
                <div key={wt}>
                  <Label className="text-xs">{wt} Rate</Label>
                  <div className="relative">
                    <span
                      className="absolute left-2 top-1/2 -translate-y-1/2 text-sm"
                      style={{ color: "oklch(var(--muted-foreground))" }}
                    >
                      ₹
                    </span>
                    <Input
                      type="number"
                      value={getRateForWT(wt)}
                      onChange={(e) => setRateForWT(wt, e.target.value)}
                      placeholder="0"
                      className="pl-6 text-sm"
                      min="0"
                    />
                  </div>
                </div>
              ))}

              {workTypesNeedingRates
                .filter((wt) => !PREDEFINED_WORK_TYPES.includes(wt))
                .map((wt) => (
                  <div key={wt}>
                    <Label className="text-xs">{wt} Rate</Label>
                    <div className="relative">
                      <span
                        className="absolute left-2 top-1/2 -translate-y-1/2 text-sm"
                        style={{ color: "oklch(var(--muted-foreground))" }}
                      >
                        ₹
                      </span>
                      <Input
                        type="number"
                        value={getRateForWT(wt)}
                        onChange={(e) => setRateForWT(wt, e.target.value)}
                        placeholder="0"
                        className="pl-6 text-sm"
                        min="0"
                      />
                    </div>
                  </div>
                ))}
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              data-ocid="item_master.save_button"
              onClick={handleSave}
              disabled={loading}
              className="flex-1"
            >
              {loading
                ? "Saving..."
                : editId !== null
                  ? "Update Item"
                  : "Save Item"}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setShowForm(false);
                setShowColorForm(false);
                setForm(emptyForm());
                setRates(emptyRates());
                setEditId(null);
                setFabricUnit("meters");
                setArticleImageUrl("");
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Items List */}
      <div className="space-y-3">
        {items.length === 0 && (
          <div
            data-ocid="item_master.empty_state"
            className="text-center py-8"
            style={{ color: "oklch(var(--muted-foreground))" }}
          >
            No items yet. Create your first item.
          </div>
        )}
        {items.map((item, idx) => {
          const colorEntries = parseColorSizeData(item.colorSizeData);
          const savedRates = getItemRates(item.articleNo);
          const imgUrl = getArticleImage(item.articleNo);
          return (
            <div
              key={Number(item.id)}
              data-ocid={`item_master.item.${idx + 1}`}
              className="rounded-xl border p-3 space-y-2 cursor-pointer active:opacity-80 transition-opacity"
              style={{
                background: "oklch(var(--card))",
                borderColor: "oklch(var(--border))",
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") setDetailItem(item);
              }}
              onClick={() => setDetailItem(item)}
            >
              <div className="flex items-start gap-3">
                {/* Thumbnail */}
                {imgUrl && (
                  <img
                    src={imgUrl}
                    alt={item.articleNo}
                    className="w-12 h-12 object-cover rounded-lg flex-shrink-0"
                    style={{ border: "1px solid oklch(var(--border))" }}
                  />
                )}
                <div className="flex-1 min-w-0">
                  <p
                    className="font-bold"
                    style={{ color: "oklch(var(--foreground))" }}
                  >
                    {item.articleNo}
                  </p>
                  <p
                    className="text-sm"
                    style={{ color: "oklch(var(--muted-foreground))" }}
                  >
                    Total Qty: {String(item.totalQuantity)}
                  </p>
                </div>
                {/* Tap hint */}
                <span
                  className="text-xs flex-shrink-0 self-center"
                  style={{ color: "oklch(var(--muted-foreground))" }}
                >
                  ›
                </span>
              </div>

              {colorEntries.length > 0 ? (
                <div className="space-y-1">
                  {colorEntries.map((ce) => (
                    <div key={ce.color}>
                      <span
                        className="text-xs font-semibold"
                        style={{ color: "oklch(var(--foreground))" }}
                      >
                        {ce.color}:
                      </span>
                      <span className="ml-1 flex flex-wrap gap-1 inline-flex">
                        {Object.entries(ce.sizes)
                          .filter(([, v]) => v > 0)
                          .map(([size, qty]) => (
                            <span
                              key={size}
                              className="text-xs px-1.5 py-0.5 rounded-full"
                              style={{
                                background: "oklch(var(--muted))",
                                color: "oklch(var(--muted-foreground))",
                              }}
                            >
                              {size}:{qty}
                            </span>
                          ))}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-wrap gap-1">
                  {ALL_SIZES.map((s) => {
                    const val = item[SIZE_KEYS[s]] as number;
                    if (!val || val === 0) return null;
                    return (
                      <span
                        key={s}
                        className="text-xs px-2 py-0.5 rounded-full"
                        style={{
                          background: "oklch(var(--muted))",
                          color: "oklch(var(--muted-foreground))",
                        }}
                      >
                        {s}: {val}
                      </span>
                    );
                  })}
                </div>
              )}

              {item.hasAdditionalWork && item.workTypes && (
                <p
                  className="text-xs"
                  style={{ color: "oklch(var(--primary))" }}
                >
                  Work: {item.workTypes}
                </p>
              )}

              {(savedRates.tailorRate > 0 ||
                savedRates.overlockRate > 0 ||
                savedRates.foldingRate > 0 ||
                savedRates.pressRate > 0 ||
                savedRates.packingRate > 0 ||
                savedRates.threadCuttingRate > 0 ||
                Object.keys(savedRates.customRates).length > 0) && (
                <div
                  className="rounded-lg p-2"
                  style={{ background: "oklch(var(--muted) / 0.5)" }}
                >
                  <p
                    className="text-xs font-semibold mb-1"
                    style={{ color: "oklch(var(--muted-foreground))" }}
                  >
                    Rates:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {savedRates.tailorRate > 0 && (
                      <span
                        className="text-xs"
                        style={{ color: "oklch(var(--foreground))" }}
                      >
                        Tailor: ₹{savedRates.tailorRate}
                      </span>
                    )}
                    {savedRates.overlockRate > 0 && (
                      <span
                        className="text-xs"
                        style={{ color: "oklch(var(--foreground))" }}
                      >
                        Overlock: ₹{savedRates.overlockRate}
                      </span>
                    )}
                    {savedRates.foldingRate > 0 && (
                      <span
                        className="text-xs"
                        style={{ color: "oklch(var(--foreground))" }}
                      >
                        Folding: ₹{savedRates.foldingRate}
                      </span>
                    )}
                    {savedRates.pressRate > 0 && (
                      <span
                        className="text-xs"
                        style={{ color: "oklch(var(--foreground))" }}
                      >
                        Press: ₹{savedRates.pressRate}
                      </span>
                    )}
                    {savedRates.packingRate > 0 && (
                      <span
                        className="text-xs"
                        style={{ color: "oklch(var(--foreground))" }}
                      >
                        Packing: ₹{savedRates.packingRate}
                      </span>
                    )}
                    {savedRates.threadCuttingRate > 0 && (
                      <span
                        className="text-xs"
                        style={{ color: "oklch(var(--foreground))" }}
                      >
                        Thread: ₹{savedRates.threadCuttingRate}
                      </span>
                    )}
                    {Object.entries(savedRates.customRates).map(([k, v]) =>
                      v > 0 ? (
                        <span
                          key={k}
                          className="text-xs"
                          style={{ color: "oklch(var(--foreground))" }}
                        >
                          {k}: ₹{v}
                        </span>
                      ) : null,
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Item Detail Modal */}
      {detailItem && (
        <div
          className="fixed inset-0 z-50 flex flex-col"
          style={{ background: "oklch(var(--background))" }}
        >
          {/* Header */}
          <div
            className="flex items-center gap-3 p-4 border-b"
            style={{ borderColor: "oklch(var(--border))" }}
          >
            <button
              data-ocid="item_master.detail.close_button"
              type="button"
              onClick={() => setDetailItem(null)}
              className="flex items-center gap-1 text-sm font-medium"
              style={{ color: "oklch(var(--primary))" }}
            >
              ← Back
            </button>
            <h2
              className="font-bold text-lg flex-1"
              style={{ color: "oklch(var(--foreground))" }}
            >
              Item Details
            </h2>
          </div>

          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Large image */}
            {(() => {
              const detailImg = getArticleImage(detailItem.articleNo);
              return detailImg ? (
                <img
                  src={detailImg}
                  alt={detailItem.articleNo}
                  className="w-full max-h-72 object-contain rounded-xl"
                  style={{
                    border: "1px solid oklch(var(--border))",
                    background: "oklch(var(--muted) / 0.3)",
                  }}
                />
              ) : (
                <div
                  className="w-full h-48 rounded-xl flex items-center justify-center text-sm"
                  style={{
                    background: "oklch(var(--muted))",
                    color: "oklch(var(--muted-foreground))",
                  }}
                >
                  No Image
                </div>
              );
            })()}

            {/* Article details */}
            <div
              className="rounded-xl border p-4 space-y-2"
              style={{
                background: "oklch(var(--card))",
                borderColor: "oklch(var(--border))",
              }}
            >
              <div className="flex justify-between">
                <span
                  className="text-sm font-semibold"
                  style={{ color: "oklch(var(--muted-foreground))" }}
                >
                  Article Number
                </span>
                <span
                  className="text-sm font-bold"
                  style={{ color: "oklch(var(--foreground))" }}
                >
                  {detailItem.articleNo}
                </span>
              </div>
              <div className="flex justify-between">
                <span
                  className="text-sm font-semibold"
                  style={{ color: "oklch(var(--muted-foreground))" }}
                >
                  Total Quantity
                </span>
                <span
                  className="text-sm"
                  style={{ color: "oklch(var(--foreground))" }}
                >
                  {String(detailItem.totalQuantity)} pcs
                </span>
              </div>
              {detailItem.hasAdditionalWork && detailItem.workTypes && (
                <div className="flex justify-between">
                  <span
                    className="text-sm font-semibold"
                    style={{ color: "oklch(var(--muted-foreground))" }}
                  >
                    Work Types
                  </span>
                  <span
                    className="text-sm"
                    style={{ color: "oklch(var(--primary))" }}
                  >
                    {detailItem.workTypes}
                  </span>
                </div>
              )}
            </div>

            {/* Colors & Sizes */}
            {(() => {
              const colorEntries = parseColorSizeData(detailItem.colorSizeData);
              if (colorEntries.length === 0) return null;
              return (
                <div
                  className="rounded-xl border p-4"
                  style={{
                    background: "oklch(var(--card))",
                    borderColor: "oklch(var(--border))",
                  }}
                >
                  <p
                    className="text-sm font-semibold mb-3"
                    style={{ color: "oklch(var(--foreground))" }}
                  >
                    Colors &amp; Sizes
                  </p>
                  <div className="space-y-3">
                    {colorEntries.map((ce) => (
                      <div key={ce.color}>
                        <p
                          className="text-sm font-medium mb-1"
                          style={{ color: "oklch(var(--foreground))" }}
                        >
                          {ce.color}
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {Object.entries(ce.sizes)
                            .filter(([, v]) => v > 0)
                            .map(([size, qty]) => (
                              <span
                                key={size}
                                className="text-xs px-2 py-0.5 rounded-full"
                                style={{
                                  background: "oklch(var(--primary) / 0.12)",
                                  color: "oklch(var(--primary))",
                                }}
                              >
                                {size}: {qty}
                              </span>
                            ))}
                          {Object.keys(ce.sizes).filter((k) => ce.sizes[k] > 0)
                            .length === 0 && (
                            <span
                              className="text-xs"
                              style={{
                                color: "oklch(var(--muted-foreground))",
                              }}
                            >
                              No sizes defined
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* Rates */}
            {(() => {
              const r = loadArticleRates(detailItem.articleNo);
              const hasRates =
                r.tailorRate > 0 ||
                r.overlockRate > 0 ||
                r.foldingRate > 0 ||
                r.pressRate > 0 ||
                r.packingRate > 0 ||
                r.threadCuttingRate > 0 ||
                Object.keys(r.customRates).length > 0;
              if (!hasRates) return null;
              return (
                <div
                  className="rounded-xl border p-4"
                  style={{
                    background: "oklch(var(--card))",
                    borderColor: "oklch(var(--border))",
                  }}
                >
                  <p
                    className="text-sm font-semibold mb-3"
                    style={{ color: "oklch(var(--foreground))" }}
                  >
                    Work Rates
                  </p>
                  <div className="space-y-1">
                    {r.tailorRate > 0 && (
                      <div className="flex justify-between">
                        <span
                          className="text-sm"
                          style={{ color: "oklch(var(--muted-foreground))" }}
                        >
                          Tailor Stitching
                        </span>
                        <span
                          className="text-sm font-medium"
                          style={{ color: "oklch(var(--foreground))" }}
                        >
                          ₹{r.tailorRate}
                        </span>
                      </div>
                    )}
                    {r.overlockRate > 0 && (
                      <div className="flex justify-between">
                        <span
                          className="text-sm"
                          style={{ color: "oklch(var(--muted-foreground))" }}
                        >
                          Overlock
                        </span>
                        <span
                          className="text-sm font-medium"
                          style={{ color: "oklch(var(--foreground))" }}
                        >
                          ₹{r.overlockRate}
                        </span>
                      </div>
                    )}
                    {r.foldingRate > 0 && (
                      <div className="flex justify-between">
                        <span
                          className="text-sm"
                          style={{ color: "oklch(var(--muted-foreground))" }}
                        >
                          Folding
                        </span>
                        <span
                          className="text-sm font-medium"
                          style={{ color: "oklch(var(--foreground))" }}
                        >
                          ₹{r.foldingRate}
                        </span>
                      </div>
                    )}
                    {r.pressRate > 0 && (
                      <div className="flex justify-between">
                        <span
                          className="text-sm"
                          style={{ color: "oklch(var(--muted-foreground))" }}
                        >
                          Press
                        </span>
                        <span
                          className="text-sm font-medium"
                          style={{ color: "oklch(var(--foreground))" }}
                        >
                          ₹{r.pressRate}
                        </span>
                      </div>
                    )}
                    {r.packingRate > 0 && (
                      <div className="flex justify-between">
                        <span
                          className="text-sm"
                          style={{ color: "oklch(var(--muted-foreground))" }}
                        >
                          Packing
                        </span>
                        <span
                          className="text-sm font-medium"
                          style={{ color: "oklch(var(--foreground))" }}
                        >
                          ₹{r.packingRate}
                        </span>
                      </div>
                    )}
                    {r.threadCuttingRate > 0 && (
                      <div className="flex justify-between">
                        <span
                          className="text-sm"
                          style={{ color: "oklch(var(--muted-foreground))" }}
                        >
                          Thread Cutting
                        </span>
                        <span
                          className="text-sm font-medium"
                          style={{ color: "oklch(var(--foreground))" }}
                        >
                          ₹{r.threadCuttingRate}
                        </span>
                      </div>
                    )}
                    {Object.entries(r.customRates).map(([k, v]) =>
                      v > 0 ? (
                        <div key={k} className="flex justify-between">
                          <span
                            className="text-sm"
                            style={{ color: "oklch(var(--muted-foreground))" }}
                          >
                            {k}
                          </span>
                          <span
                            className="text-sm font-medium"
                            style={{ color: "oklch(var(--foreground))" }}
                          >
                            ₹{v}
                          </span>
                        </div>
                      ) : null,
                    )}
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Action buttons */}
          <div
            className="p-4 border-t flex gap-3"
            style={{ borderColor: "oklch(var(--border))" }}
          >
            <Button
              data-ocid="item_master.detail.edit_button"
              className="flex-1"
              onClick={() => {
                handleEdit(detailItem);
                setDetailItem(null);
                setShowForm(true);
              }}
            >
              Edit Item
            </Button>
            <Button
              data-ocid="item_master.detail.delete_button"
              variant="destructive"
              className="flex-1"
              onClick={() => {
                handleDelete(detailItem.id);
                setDetailItem(null);
              }}
            >
              Delete Item
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
