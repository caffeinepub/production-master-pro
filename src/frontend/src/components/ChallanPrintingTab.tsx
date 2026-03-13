import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Camera,
  Download,
  Edit,
  FileText,
  ImageIcon,
  Package,
  Plus,
  Printer,
  Search,
  Share2,
  Trash2,
  X,
} from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useActor } from "../hooks/useActor";
import { downloadPdf, sharePdfWhatsApp } from "../utils/pdfUtils";

// ── Types ────────────────────────────────────────────────────────────────────

interface ChallanItem {
  articleNo: string;
  color: string;
  qty: number;
  jobType: string;
}

interface CustomField {
  id: string;
  name: string;
  fieldType: "text" | "number" | "dropdown";
  value: string;
  options?: string[];
}

interface Challan {
  id: string;
  challanNo: string;
  date: string;
  senderParty: string;
  receiverParty: string;
  jobType: string;
  items: ChallanItem[];
  customFields: CustomField[];
  photos: string[];
  garmentImage?: string;
  createdAt: string;
  updatedAt: string;
}

type PrintAction = "print" | "download" | "share";

interface ActivePrint {
  challan: Challan;
  action: PrintAction;
}

const JOB_TYPES = [
  "Printing",
  "Embroidery",
  "Washing",
  "Dyeing",
  "Finishing",
  "Other Job Work",
];

const COMMON_FIELDS = [
  "Fabric Type",
  "GSM",
  "Print Type",
  "Shade",
  "Remarks",
  "Rate",
];

// ── Utilities ────────────────────────────────────────────────────────────────

function loadChallans(): Challan[] {
  try {
    return JSON.parse(localStorage.getItem("sg_challans") || "[]");
  } catch {
    return [];
  }
}

function saveChallans(challans: Challan[]) {
  localStorage.setItem("sg_challans", JSON.stringify(challans));
}

function peekNextChallanNo(): string {
  const last = Number.parseInt(
    localStorage.getItem("sg_lastChallanNo") || "0",
    10,
  );
  const next = last + 1;
  return `CH-${String(next).padStart(3, "0")}`;
}

function consumeChallanNo(): void {
  const last = Number.parseInt(
    localStorage.getItem("sg_lastChallanNo") || "0",
    10,
  );
  localStorage.setItem("sg_lastChallanNo", String(last + 1));
}

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function compressImage(file: File): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const MAX = 800;
      let { width, height } = img;
      if (width > height && width > MAX) {
        height = (height * MAX) / width;
        width = MAX;
      } else if (height > MAX) {
        width = (width * MAX) / height;
        height = MAX;
      }
      canvas.width = width;
      canvas.height = height;
      canvas.getContext("2d")!.drawImage(img, 0, 0, width, height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/jpeg", 0.7));
    };
    img.src = url;
  });
}

function totalQty(items: ChallanItem[]): number {
  return items.reduce((s, i) => s + (i.qty || 0), 0);
}

/** Group items by color, returning ordered entries */
function groupByColor(
  items: ChallanItem[],
): { color: string; items: ChallanItem[]; subtotal: number }[] {
  const map = new Map<
    string,
    { color: string; items: ChallanItem[]; subtotal: number }
  >();
  for (const item of items) {
    const key = item.color || "(No Color)";
    if (!map.has(key)) map.set(key, { color: key, items: [], subtotal: 0 });
    const g = map.get(key)!;
    g.items.push(item);
    g.subtotal += item.qty || 0;
  }
  return Array.from(map.values());
}

// ── Main Component ────────────────────────────────────────────────────────────

export function ChallanPrintingTab() {
  const { actor } = useActor();

  const [view, setView] = useState<"form" | "history">("history");
  const [challans, setChallans] = useState<Challan[]>(loadChallans);
  const [searchQ, setSearchQ] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  // Active print state
  const [activePrint, setActivePrint] = useState<ActivePrint | null>(null);
  const printAreaRef = useRef<HTMLDivElement>(null);

  // Form state
  const [formDate, setFormDate] = useState(todayStr());
  const [formNo, setFormNo] = useState("");
  const [senderParty, setSenderParty] = useState("");
  const [receiverParty, setReceiverParty] = useState("");
  const [jobType, setJobType] = useState(JOB_TYPES[0]);
  const [items, setItems] = useState<ChallanItem[]>([]);
  const [customFields, setCustomFields] = useState<CustomField[]>([]);
  const [photos, setPhotos] = useState<string[]>([]);
  const [garmentImage, setGarmentImage] = useState<string>("");

  const [newFieldName, setNewFieldName] = useState("");
  const [newFieldType, setNewFieldType] = useState<
    "text" | "number" | "dropdown"
  >("text");
  const [newFieldOpts, setNewFieldOpts] = useState("");
  const [addingField, setAddingField] = useState(false);

  const [itemDialogOpen, setItemDialogOpen] = useState(false);
  const [itemSearch, setItemSearch] = useState("");
  const [itemMasters, setItemMasters] = useState<any[]>([]);

  // ── Load item masters ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!actor) return;
    actor
      .getItemMasters()
      .then((res: any[]) => setItemMasters(res))
      .catch(() => {});
  }, [actor]);

  // ── Trigger print/pdf action after activePrint state renders ──────────────
  useEffect(() => {
    if (!activePrint) return;
    const timeout = setTimeout(async () => {
      const ch = activePrint.challan;
      const filename = `Shiva_Garments_Challan_${ch.challanNo}_${ch.date}.pdf`;
      try {
        if (activePrint.action === "print") {
          window.print();
        } else if (activePrint.action === "download") {
          await downloadPdf("challan-print-area", filename);
          toast.success("PDF downloaded!");
        } else if (activePrint.action === "share") {
          const text = `SHIVA GARMENTS - Job Work Challan\nChallan No: ${ch.challanNo}\nDate: ${ch.date}\nFrom: ${ch.senderParty} → ${ch.receiverParty}\nTotal Qty: ${totalQty(ch.items)} pcs`;
          await sharePdfWhatsApp("challan-print-area", filename, text);
        }
      } catch (err) {
        toast.error(
          `Export failed: ${
            err instanceof Error ? err.message : "Unknown error"
          }`,
        );
      } finally {
        setActivePrint(null);
      }
    }, 600);
    return () => clearTimeout(timeout);
  }, [activePrint]);

  // ── Form init ─────────────────────────────────────────────────────────────
  const openNewForm = () => {
    setEditingId(null);
    setFormDate(todayStr());
    setFormNo(peekNextChallanNo());
    setSenderParty("");
    setReceiverParty("");
    setJobType(JOB_TYPES[0]);
    setItems([]);
    setCustomFields([]);
    setPhotos([]);
    setGarmentImage("");
    setView("form");
  };

  const openEditForm = (ch: Challan) => {
    setEditingId(ch.id);
    setFormDate(ch.date);
    setFormNo(ch.challanNo);
    setSenderParty(ch.senderParty);
    setReceiverParty(ch.receiverParty);
    setJobType(ch.jobType);
    setItems(ch.items);
    setCustomFields(ch.customFields);
    setPhotos(ch.photos);
    setGarmentImage(ch.garmentImage || "");
    setView("form");
  };

  // ── Save / Delete ──────────────────────────────────────────────────────────
  const handleSave = () => {
    if (!senderParty.trim() || !receiverParty.trim()) {
      toast.error("Sender and Receiver party names are required");
      return;
    }
    const now = new Date().toISOString();
    if (editingId) {
      const updated = challans.map((c) =>
        c.id === editingId
          ? {
              ...c,
              date: formDate,
              senderParty,
              receiverParty,
              jobType,
              items,
              customFields,
              photos,
              garmentImage,
              updatedAt: now,
            }
          : c,
      );
      saveChallans(updated);
      setChallans(updated);
      toast.success("Challan updated");
    } else {
      const ch: Challan = {
        id: Date.now().toString(),
        challanNo: formNo,
        date: formDate,
        senderParty,
        receiverParty,
        jobType,
        items,
        customFields,
        photos,
        garmentImage,
        createdAt: now,
        updatedAt: now,
      };
      consumeChallanNo();
      const updated = [ch, ...challans];
      saveChallans(updated);
      setChallans(updated);
      toast.success("Challan saved");
    }
    setView("history");
  };

  const handleDelete = (id: string) => {
    const updated = challans.filter((c) => c.id !== id);
    saveChallans(updated);
    setChallans(updated);
    toast.success("Challan deleted");
  };

  // ── Export handlers ────────────────────────────────────────────────────────
  const handlePrint = (ch: Challan) => {
    setActivePrint({ challan: ch, action: "print" });
  };

  const handleDownloadPdf = (ch: Challan) => {
    toast.loading("Generating PDF...", { id: "pdf-gen" });
    setActivePrint({ challan: ch, action: "download" });
    setTimeout(() => toast.dismiss("pdf-gen"), 3000);
  };

  const handleSharePdf = (ch: Challan) => {
    toast.loading("Preparing PDF for sharing...", { id: "pdf-share" });
    setActivePrint({ challan: ch, action: "share" });
    setTimeout(() => toast.dismiss("pdf-share"), 5000);
  };

  // ── Item Master selection ──────────────────────────────────────────────────
  const handleSelectItem = (item: any) => {
    const colorsRaw: string = item.colors || "";
    const colorList = colorsRaw
      .split(",")
      .map((c: string) => c.trim())
      .filter(Boolean);
    const rows: ChallanItem[] =
      colorList.length > 0
        ? colorList.map((color: string) => ({
            articleNo: item.articleNo,
            color,
            qty: 0,
            jobType,
          }))
        : [{ articleNo: item.articleNo, color: "", qty: 0, jobType }];
    setItems((prev) => [...prev, ...rows]);
    setItemDialogOpen(false);
    setItemSearch("");
  };

  const updateItemQty = (idx: number, qty: number) => {
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, qty } : it)));
  };

  const updateItemJobType = (idx: number, jt: string) => {
    setItems((prev) =>
      prev.map((it, i) => (i === idx ? { ...it, jobType: jt } : it)),
    );
  };

  const removeItem = (idx: number) => {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  };

  // ── Custom fields ──────────────────────────────────────────────────────────
  const addCustomField = (
    name: string,
    ft: "text" | "number" | "dropdown",
    opts?: string,
  ) => {
    const options =
      ft === "dropdown" && opts
        ? opts
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
        : undefined;
    const field: CustomField = {
      id: Date.now().toString(),
      name: name.trim(),
      fieldType: ft,
      value: "",
      options,
    };
    setCustomFields((prev) => [...prev, field]);
    setNewFieldName("");
    setNewFieldOpts("");
    setAddingField(false);
  };

  const updateFieldValue = (id: string, value: string) => {
    setCustomFields((prev) =>
      prev.map((f) => (f.id === id ? { ...f, value } : f)),
    );
  };

  const removeCustomField = (id: string) => {
    setCustomFields((prev) => prev.filter((f) => f.id !== id));
  };

  // ── Photo upload ───────────────────────────────────────────────────────────
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    toast.loading("Compressing photos...");
    const compressed = await Promise.all(files.map(compressImage));
    setPhotos((prev) => [...prev, ...compressed]);
    toast.dismiss();
    toast.success(`${files.length} photo(s) added`);
    e.target.value = "";
  };

  const removePhoto = (idx: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== idx));
  };

  // ── Garment image upload ───────────────────────────────────────────────────
  const handleGarmentImageChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    toast.loading("Processing garment image...");
    const compressed = await compressImage(file);
    setGarmentImage(compressed);
    toast.dismiss();
    toast.success("Garment image added");
    e.target.value = "";
  };

  // ── Filtered challans ──────────────────────────────────────────────────────
  const filteredChallans = challans.filter((ch) => {
    if (!searchQ.trim()) return true;
    const q = searchQ.toLowerCase();
    return (
      ch.challanNo.toLowerCase().includes(q) ||
      ch.senderParty.toLowerCase().includes(q) ||
      ch.receiverParty.toLowerCase().includes(q) ||
      ch.date.includes(q)
    );
  });

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-0 pb-2">
      {/* Off-screen print area — always rendered when activePrint is set */}
      {activePrint && (
        <div
          id="print-area"
          ref={printAreaRef}
          style={{
            position: "fixed",
            left: "-9999px",
            top: 0,
            width: "800px",
            backgroundColor: "#ffffff",
            zIndex: -1,
          }}
        >
          <div id="challan-print-area">
            <PrintTemplate
              challan={activePrint.challan}
              garmentImage={activePrint.challan.garmentImage}
            />
          </div>
        </div>
      )}

      {/* View toggle header */}
      <div
        className="sticky top-[60px] z-30 flex gap-0 border-b"
        style={{
          background: "oklch(var(--card))",
          borderColor: "oklch(var(--border))",
        }}
      >
        <button
          type="button"
          data-ocid="challan.form.tab"
          onClick={() => (view === "history" ? openNewForm() : undefined)}
          className="flex-1 py-3 text-sm font-semibold transition-colors"
          style={{
            borderBottom:
              view === "form"
                ? "2px solid oklch(var(--primary))"
                : "2px solid transparent",
            color:
              view === "form"
                ? "oklch(var(--primary))"
                : "oklch(var(--muted-foreground))",
          }}
        >
          {editingId ? "Edit Challan" : "New Challan"}
        </button>
        <button
          type="button"
          data-ocid="challan.history.tab"
          onClick={() => setView("history")}
          className="flex-1 py-3 text-sm font-semibold transition-colors"
          style={{
            borderBottom:
              view === "history"
                ? "2px solid oklch(var(--primary))"
                : "2px solid transparent",
            color:
              view === "history"
                ? "oklch(var(--primary))"
                : "oklch(var(--muted-foreground))",
          }}
        >
          Challan History ({challans.length})
        </button>
      </div>

      {/* ── FORM VIEW ────────────────────────────────────────────────────── */}
      {view === "form" && (
        <div className="flex flex-col gap-4 p-4">
          {/* Challan Details */}
          <Card>
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle
                className="text-sm font-bold uppercase tracking-wide"
                style={{ color: "oklch(var(--primary))" }}
              >
                Challan Details
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 flex flex-col gap-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <Label className="text-xs font-semibold">Date</Label>
                  <Input
                    data-ocid="challan.form.input"
                    type="date"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="h-11"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <Label className="text-xs font-semibold">Challan No</Label>
                  <Input
                    data-ocid="challan.challanno.input"
                    value={formNo}
                    readOnly
                    className="h-11 font-mono font-bold"
                    style={{ background: "oklch(var(--muted) / 0.5)" }}
                  />
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <Label className="text-xs font-semibold">
                  Sender Party Name
                </Label>
                <Input
                  data-ocid="challan.sender.input"
                  placeholder="Enter sender party name"
                  value={senderParty}
                  onChange={(e) => setSenderParty(e.target.value)}
                  className="h-11"
                />
              </div>
              <div className="flex flex-col gap-1">
                <Label className="text-xs font-semibold">
                  Receiver Party Name
                </Label>
                <Input
                  data-ocid="challan.receiver.input"
                  placeholder="Enter receiver party name"
                  value={receiverParty}
                  onChange={(e) => setReceiverParty(e.target.value)}
                  className="h-11"
                />
              </div>
              <div className="flex flex-col gap-1">
                <Label className="text-xs font-semibold">Job Type</Label>
                <Select value={jobType} onValueChange={setJobType}>
                  <SelectTrigger
                    data-ocid="challan.jobtype.select"
                    className="h-11"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {JOB_TYPES.map((jt) => (
                      <SelectItem key={jt} value={jt}>
                        {jt}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Garment Image Upload */}
          <Card>
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle
                className="text-sm font-bold uppercase tracking-wide"
                style={{ color: "oklch(var(--primary))" }}
              >
                Garment Image{" "}
                <span
                  className="text-xs font-normal normal-case"
                  style={{ color: "oklch(var(--muted-foreground))" }}
                >
                  (Optional)
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 flex flex-col gap-3">
              {garmentImage ? (
                <div className="relative">
                  <img
                    src={garmentImage}
                    alt="Garment"
                    style={{
                      maxHeight: "200px",
                      objectFit: "contain",
                      width: "100%",
                      borderRadius: "8px",
                      border: "1px solid oklch(var(--border))",
                    }}
                  />
                  <button
                    type="button"
                    data-ocid="challan.garment_image.delete_button"
                    onClick={() => setGarmentImage("")}
                    className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center shadow"
                    style={{
                      background: "oklch(var(--destructive))",
                      color: "white",
                    }}
                    aria-label="Remove garment image"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <label
                    data-ocid="challan.garment_image.upload_button"
                    className="flex-1 flex flex-col items-center justify-center gap-2 h-24 rounded-xl border-2 border-dashed cursor-pointer transition-colors hover:border-primary"
                    style={{ borderColor: "oklch(var(--border))" }}
                  >
                    <ImageIcon
                      className="w-6 h-6"
                      style={{ color: "oklch(var(--muted-foreground))" }}
                    />
                    <span
                      className="text-xs font-medium"
                      style={{ color: "oklch(var(--muted-foreground))" }}
                    >
                      Upload Garment Image
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleGarmentImageChange}
                    />
                  </label>
                  <label
                    data-ocid="challan.garment_camera.upload_button"
                    className="flex-1 flex flex-col items-center justify-center gap-2 h-24 rounded-xl border-2 border-dashed cursor-pointer transition-colors hover:border-primary"
                    style={{ borderColor: "oklch(var(--border))" }}
                  >
                    <Camera
                      className="w-6 h-6"
                      style={{ color: "oklch(var(--muted-foreground))" }}
                    />
                    <span
                      className="text-xs font-medium"
                      style={{ color: "oklch(var(--muted-foreground))" }}
                    >
                      Camera Capture
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      className="hidden"
                      onChange={handleGarmentImageChange}
                    />
                  </label>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Items section */}
          <Card>
            <CardHeader className="pb-2 pt-4 px-4">
              <div className="flex items-center justify-between">
                <CardTitle
                  className="text-sm font-bold uppercase tracking-wide"
                  style={{ color: "oklch(var(--primary))" }}
                >
                  Items
                </CardTitle>
                <Button
                  data-ocid="challan.select_item.button"
                  size="sm"
                  variant="outline"
                  className="h-9 gap-1.5 text-xs font-semibold"
                  onClick={() => setItemDialogOpen(true)}
                >
                  <Package className="w-3.5 h-3.5" />
                  Select from Item Master
                </Button>
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              {items.length === 0 ? (
                <div
                  data-ocid="challan.items.empty_state"
                  className="flex flex-col items-center gap-2 py-8 rounded-lg"
                  style={{ background: "oklch(var(--muted) / 0.4)" }}
                >
                  <Package
                    className="w-8 h-8"
                    style={{ color: "oklch(var(--muted-foreground))" }}
                  />
                  <p
                    className="text-sm"
                    style={{ color: "oklch(var(--muted-foreground))" }}
                  >
                    No items added. Select from Item Master.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <div
                    className="grid gap-2 text-xs font-bold uppercase tracking-wide px-2 py-1.5 rounded"
                    style={{
                      gridTemplateColumns: "3fr 2fr 2fr 2fr auto",
                      background: "oklch(var(--muted) / 0.5)",
                      color: "oklch(var(--muted-foreground))",
                    }}
                  >
                    <span>Article</span>
                    <span>Color</span>
                    <span>Qty</span>
                    <span>Job Type</span>
                    <span />
                  </div>
                  {items.map((it, idx) => (
                    <div
                      key={`${it.articleNo}-${it.color}-${idx}`}
                      data-ocid={`challan.items.item.${idx + 1}`}
                      className="grid gap-2 items-center px-1"
                      style={{ gridTemplateColumns: "3fr 2fr 2fr 2fr auto" }}
                    >
                      <span className="text-xs font-semibold truncate">
                        {it.articleNo}
                      </span>
                      <span
                        className="text-xs truncate"
                        style={{ color: "oklch(var(--muted-foreground))" }}
                      >
                        {it.color || "—"}
                      </span>
                      <Input
                        data-ocid={`challan.items.input.${idx + 1}`}
                        type="number"
                        min="0"
                        value={it.qty}
                        onChange={(e) =>
                          updateItemQty(
                            idx,
                            Number.parseInt(e.target.value) || 0,
                          )
                        }
                        className="h-8 text-sm text-center px-1"
                      />
                      <Select
                        value={it.jobType}
                        onValueChange={(v) => updateItemJobType(idx, v)}
                      >
                        <SelectTrigger
                          data-ocid={`challan.items.select.${idx + 1}`}
                          className="h-8 text-xs px-1.5"
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {JOB_TYPES.map((jt) => (
                            <SelectItem key={jt} value={jt} className="text-xs">
                              {jt}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <button
                        type="button"
                        data-ocid={`challan.items.delete_button.${idx + 1}`}
                        onClick={() => removeItem(idx)}
                        className="p-1 rounded hover:bg-destructive/10 transition-colors"
                        style={{ color: "oklch(var(--destructive))" }}
                        aria-label="Remove item"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                  <Separator />
                  {/* Color subtotals */}
                  {groupByColor(items).length > 1 && (
                    <div className="flex flex-col gap-1">
                      {groupByColor(items).map((g) => (
                        <div
                          key={g.color}
                          className="flex justify-between text-xs px-2"
                          style={{ color: "oklch(var(--muted-foreground))" }}
                        >
                          <span>{g.color}</span>
                          <span className="font-semibold">
                            {g.subtotal} pcs
                          </span>
                        </div>
                      ))}
                      <Separator />
                    </div>
                  )}
                  <div className="flex justify-end">
                    <span className="text-sm font-bold">
                      Grand Total Qty:{" "}
                      <span style={{ color: "oklch(var(--primary))" }}>
                        {totalQty(items)}
                      </span>
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Custom Details */}
          <Card>
            <CardHeader className="pb-2 pt-4 px-4">
              <div className="flex items-center justify-between">
                <CardTitle
                  className="text-sm font-bold uppercase tracking-wide"
                  style={{ color: "oklch(var(--primary))" }}
                >
                  Custom Details
                </CardTitle>
                <Button
                  data-ocid="challan.add_custom_field.button"
                  size="sm"
                  variant="outline"
                  className="h-9 gap-1.5 text-xs font-semibold"
                  onClick={() => setAddingField(true)}
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Custom Field
                </Button>
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-4 flex flex-col gap-3">
              <div className="flex flex-wrap gap-2">
                {COMMON_FIELDS.filter(
                  (f) => !customFields.find((cf) => cf.name === f),
                ).map((f) => (
                  <button
                    key={f}
                    type="button"
                    data-ocid="challan.field_chip.button"
                    onClick={() => addCustomField(f, "text")}
                    className="px-2.5 py-1 rounded-full text-xs font-medium border transition-colors hover:border-primary"
                    style={{
                      borderColor: "oklch(var(--border))",
                      color: "oklch(var(--foreground))",
                    }}
                  >
                    + {f}
                  </button>
                ))}
              </div>

              {addingField && (
                <div
                  className="flex flex-col gap-3 p-3 rounded-lg border"
                  style={{
                    background: "oklch(var(--muted) / 0.3)",
                    borderColor: "oklch(var(--border))",
                  }}
                >
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex flex-col gap-1">
                      <Label className="text-xs">Field Name</Label>
                      <Input
                        data-ocid="challan.new_field_name.input"
                        placeholder="e.g. Fabric Type"
                        value={newFieldName}
                        onChange={(e) => setNewFieldName(e.target.value)}
                        className="h-9"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <Label className="text-xs">Field Type</Label>
                      <Select
                        value={newFieldType}
                        onValueChange={(v) =>
                          setNewFieldType(v as "text" | "number" | "dropdown")
                        }
                      >
                        <SelectTrigger
                          data-ocid="challan.new_field_type.select"
                          className="h-9"
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="text">Text</SelectItem>
                          <SelectItem value="number">Number</SelectItem>
                          <SelectItem value="dropdown">Dropdown</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  {newFieldType === "dropdown" && (
                    <div className="flex flex-col gap-1">
                      <Label className="text-xs">
                        Options (comma-separated)
                      </Label>
                      <Input
                        data-ocid="challan.new_field_opts.input"
                        placeholder="Option 1, Option 2, Option 3"
                        value={newFieldOpts}
                        onChange={(e) => setNewFieldOpts(e.target.value)}
                        className="h-9"
                      />
                    </div>
                  )}
                  <div className="flex gap-2">
                    <Button
                      data-ocid="challan.confirm_add_field.button"
                      size="sm"
                      className="flex-1 h-9"
                      disabled={!newFieldName.trim()}
                      onClick={() =>
                        addCustomField(newFieldName, newFieldType, newFieldOpts)
                      }
                    >
                      Add Field
                    </Button>
                    <Button
                      data-ocid="challan.cancel_add_field.button"
                      size="sm"
                      variant="outline"
                      className="flex-1 h-9"
                      onClick={() => {
                        setAddingField(false);
                        setNewFieldName("");
                        setNewFieldOpts("");
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              {customFields.length === 0 && !addingField ? (
                <p
                  className="text-xs py-2"
                  style={{ color: "oklch(var(--muted-foreground))" }}
                >
                  No custom fields yet. Tap a suggestion above or "Add Custom
                  Field".
                </p>
              ) : (
                <div className="flex flex-col gap-3">
                  {customFields.map((field) => (
                    <div key={field.id} className="flex items-end gap-2">
                      <div className="flex-1 flex flex-col gap-1">
                        <Label className="text-xs font-semibold">
                          {field.name}
                        </Label>
                        {field.fieldType === "text" && (
                          <Input
                            data-ocid="challan.custom_field.input"
                            placeholder={`Enter ${field.name}`}
                            value={field.value}
                            onChange={(e) =>
                              updateFieldValue(field.id, e.target.value)
                            }
                            className="h-10"
                          />
                        )}
                        {field.fieldType === "number" && (
                          <Input
                            data-ocid="challan.custom_field.input"
                            type="number"
                            placeholder="0"
                            value={field.value}
                            onChange={(e) =>
                              updateFieldValue(field.id, e.target.value)
                            }
                            className="h-10"
                          />
                        )}
                        {field.fieldType === "dropdown" && (
                          <Select
                            value={field.value}
                            onValueChange={(v) => updateFieldValue(field.id, v)}
                          >
                            <SelectTrigger
                              data-ocid="challan.custom_field.select"
                              className="h-10"
                            >
                              <SelectValue
                                placeholder={`Select ${field.name}`}
                              />
                            </SelectTrigger>
                            <SelectContent>
                              {(field.options || []).map((opt) => (
                                <SelectItem key={opt} value={opt}>
                                  {opt}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      </div>
                      <button
                        type="button"
                        data-ocid="challan.custom_field.delete_button"
                        onClick={() => removeCustomField(field.id)}
                        className="mb-0.5 p-1.5 rounded hover:bg-destructive/10 transition-colors"
                        style={{ color: "oklch(var(--destructive))" }}
                        aria-label="Remove field"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Photo Upload */}
          <Card>
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle
                className="text-sm font-bold uppercase tracking-wide"
                style={{ color: "oklch(var(--primary))" }}
              >
                Reference Photos
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 flex flex-col gap-3">
              <div className="flex gap-2">
                <label
                  data-ocid="challan.photos.upload_button"
                  className="flex-1 flex flex-col items-center justify-center gap-2 h-20 rounded-xl border-2 border-dashed cursor-pointer transition-colors hover:border-primary"
                  style={{ borderColor: "oklch(var(--border))" }}
                >
                  <FileText
                    className="w-5 h-5"
                    style={{ color: "oklch(var(--muted-foreground))" }}
                  />
                  <span
                    className="text-xs"
                    style={{ color: "oklch(var(--muted-foreground))" }}
                  >
                    Upload Photos
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </label>
                <label
                  data-ocid="challan.photos.camera_button"
                  className="flex-1 flex flex-col items-center justify-center gap-2 h-20 rounded-xl border-2 border-dashed cursor-pointer transition-colors hover:border-primary"
                  style={{ borderColor: "oklch(var(--border))" }}
                >
                  <Camera
                    className="w-5 h-5"
                    style={{ color: "oklch(var(--muted-foreground))" }}
                  />
                  <span
                    className="text-xs"
                    style={{ color: "oklch(var(--muted-foreground))" }}
                  >
                    Camera Capture
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </label>
              </div>

              {photos.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  {photos.map((src, idx) => (
                    <div
                      key={src.slice(-20)}
                      data-ocid={`challan.photos.item.${idx + 1}`}
                      className="relative aspect-square rounded-lg overflow-hidden"
                      style={{ border: "1px solid oklch(var(--border))" }}
                    >
                      <img
                        src={src}
                        alt={`Ref ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        data-ocid={`challan.photos.delete_button.${idx + 1}`}
                        onClick={() => removePhoto(idx)}
                        className="absolute top-1 right-1 w-5 h-5 rounded-full flex items-center justify-center"
                        style={{
                          background: "oklch(var(--destructive))",
                          color: "white",
                        }}
                        aria-label="Remove photo"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Action buttons */}
          <div className="flex gap-3">
            <Button
              data-ocid="challan.save.primary_button"
              className="flex-1 h-12 font-bold text-base"
              onClick={handleSave}
            >
              {editingId ? "Update Challan" : "Save Challan"}
            </Button>
            <Button
              data-ocid="challan.cancel.secondary_button"
              variant="outline"
              className="flex-1 h-12 font-semibold"
              onClick={() => setView("history")}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* ── HISTORY VIEW ─────────────────────────────────────────────────── */}
      {view === "history" && (
        <div className="flex flex-col gap-3 p-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
                style={{ color: "oklch(var(--muted-foreground))" }}
              />
              <Input
                data-ocid="challan.search.search_input"
                placeholder="Search by party, date, challan no..."
                value={searchQ}
                onChange={(e) => setSearchQ(e.target.value)}
                className="pl-9 h-11"
              />
            </div>
            <Button
              data-ocid="challan.new.primary_button"
              className="h-11 gap-2 font-bold shrink-0"
              onClick={openNewForm}
            >
              <Plus className="w-4 h-4" />
              New
            </Button>
          </div>

          {filteredChallans.length === 0 ? (
            <div
              data-ocid="challan.history.empty_state"
              className="flex flex-col items-center gap-3 py-16 rounded-xl"
              style={{ background: "oklch(var(--muted) / 0.3)" }}
            >
              <FileText
                className="w-12 h-12"
                style={{ color: "oklch(var(--muted-foreground))" }}
              />
              <p
                className="font-semibold"
                style={{ color: "oklch(var(--muted-foreground))" }}
              >
                {searchQ ? "No challans match your search" : "No challans yet"}
              </p>
              {!searchQ && (
                <Button
                  data-ocid="challan.history.primary_button"
                  className="gap-2"
                  onClick={openNewForm}
                >
                  <Plus className="w-4 h-4" />
                  Create First Challan
                </Button>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {filteredChallans.map((ch, idx) => (
                <Card
                  key={ch.id}
                  data-ocid={`challan.history.item.${idx + 1}`}
                  className="overflow-hidden"
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span
                            className="font-mono font-bold text-base"
                            style={{ color: "oklch(var(--primary))" }}
                          >
                            {ch.challanNo}
                          </span>
                          <Badge variant="secondary" className="text-xs">
                            {ch.jobType}
                          </Badge>
                        </div>
                        <p
                          className="text-xs mt-0.5"
                          style={{ color: "oklch(var(--muted-foreground))" }}
                        >
                          {ch.date}
                        </p>
                      </div>
                      <div className="text-right">
                        <p
                          className="text-lg font-bold"
                          style={{ color: "oklch(var(--foreground))" }}
                        >
                          {totalQty(ch.items)}
                          <span
                            className="text-xs font-normal ml-1"
                            style={{ color: "oklch(var(--muted-foreground))" }}
                          >
                            pcs
                          </span>
                        </p>
                      </div>
                    </div>

                    <div
                      className="flex items-center gap-1.5 mb-3 p-2 rounded-lg text-sm"
                      style={{ background: "oklch(var(--muted) / 0.4)" }}
                    >
                      <span className="font-medium truncate flex-1">
                        {ch.senderParty}
                      </span>
                      <span style={{ color: "oklch(var(--muted-foreground))" }}>
                        →
                      </span>
                      <span className="font-medium truncate flex-1 text-right">
                        {ch.receiverParty}
                      </span>
                    </div>

                    {/* Color totals summary */}
                    {ch.items.length > 0 && (
                      <div className="mb-3">
                        <p
                          className="text-xs font-semibold mb-1"
                          style={{ color: "oklch(var(--muted-foreground))" }}
                        >
                          ARTICLES & COLOR TOTALS
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {groupByColor(ch.items).map((g) => (
                            <Badge
                              key={g.color}
                              variant="outline"
                              className="text-xs"
                            >
                              {g.color}: {g.subtotal}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Export action row */}
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      <Button
                        data-ocid={`challan.print.button.${idx + 1}`}
                        variant="outline"
                        size="sm"
                        className="h-10 gap-1.5 font-semibold text-xs"
                        onClick={() => handlePrint(ch)}
                      >
                        <Printer className="w-3.5 h-3.5" />
                        Print
                      </Button>
                      <Button
                        data-ocid={`challan.download.button.${idx + 1}`}
                        variant="outline"
                        size="sm"
                        className="h-10 gap-1.5 font-semibold text-xs"
                        onClick={() => handleDownloadPdf(ch)}
                      >
                        <Download className="w-3.5 h-3.5" />
                        Download PDF
                      </Button>
                      <Button
                        data-ocid={`challan.share.button.${idx + 1}`}
                        variant="outline"
                        size="sm"
                        className="h-10 gap-1.5 font-semibold text-xs"
                        onClick={() => handleSharePdf(ch)}
                        style={{ color: "#25D366" }}
                      >
                        <Share2 className="w-3.5 h-3.5" />
                        Share PDF
                      </Button>
                      <Button
                        data-ocid={`challan.edit.edit_button.${idx + 1}`}
                        variant="outline"
                        size="sm"
                        className="h-10 gap-1.5 font-semibold text-xs"
                        onClick={() => openEditForm(ch)}
                      >
                        <Edit className="w-3.5 h-3.5" />
                        Edit
                      </Button>
                    </div>
                    <Button
                      data-ocid={`challan.delete.delete_button.${idx + 1}`}
                      variant="outline"
                      size="sm"
                      className="w-full h-9 mt-2 gap-1.5 font-semibold text-xs"
                      style={{ color: "oklch(var(--destructive))" }}
                      onClick={() => {
                        if (confirm(`Delete challan ${ch.challanNo}?`)) {
                          handleDelete(ch.id);
                        }
                      }}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Delete
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Item Master Dialog */}
      <Dialog open={itemDialogOpen} onOpenChange={setItemDialogOpen}>
        <DialogContent
          data-ocid="challan.item_master.dialog"
          className="w-[95vw] max-w-sm rounded-xl max-h-[80vh] flex flex-col"
        >
          <DialogHeader>
            <DialogTitle>Select Item from Item Master</DialogTitle>
          </DialogHeader>
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
              style={{ color: "oklch(var(--muted-foreground))" }}
            />
            <Input
              data-ocid="challan.item_search.search_input"
              placeholder="Search article..."
              value={itemSearch}
              onChange={(e) => setItemSearch(e.target.value)}
              className="pl-9 h-10"
            />
          </div>
          <div className="flex-1 overflow-y-auto flex flex-col gap-1 -mx-1 px-1">
            {itemMasters
              .filter(
                (it) =>
                  !itemSearch.trim() ||
                  it.articleNo.toLowerCase().includes(itemSearch.toLowerCase()),
              )
              .map((item) => (
                <button
                  key={item.id}
                  type="button"
                  data-ocid="challan.item_master_row.button"
                  onClick={() => handleSelectItem(item)}
                  className="flex items-start gap-3 p-3 rounded-lg text-left transition-colors hover:bg-muted"
                  style={{ border: "1px solid oklch(var(--border))" }}
                >
                  <Package
                    className="w-5 h-5 mt-0.5 shrink-0"
                    style={{ color: "oklch(var(--primary))" }}
                  />
                  <div className="flex flex-col min-w-0">
                    <span className="font-bold text-sm">{item.articleNo}</span>
                    {item.colors && (
                      <span
                        className="text-xs truncate"
                        style={{ color: "oklch(var(--muted-foreground))" }}
                      >
                        Colors: {item.colors}
                      </span>
                    )}
                    <span
                      className="text-xs"
                      style={{ color: "oklch(var(--muted-foreground))" }}
                    >
                      Total Qty: {item.totalQuantity ?? 0}
                    </span>
                  </div>
                </button>
              ))}
            {itemMasters.filter(
              (it) =>
                !itemSearch.trim() ||
                it.articleNo.toLowerCase().includes(itemSearch.toLowerCase()),
            ).length === 0 && (
              <div
                data-ocid="challan.item_master.empty_state"
                className="py-8 text-center text-sm"
                style={{ color: "oklch(var(--muted-foreground))" }}
              >
                {itemMasters.length === 0
                  ? "No items in Item Master yet"
                  : "No items match your search"}
              </div>
            )}
          </div>
          <Button
            data-ocid="challan.item_master.close_button"
            variant="outline"
            className="w-full h-10"
            onClick={() => setItemDialogOpen(false)}
          >
            Cancel
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Print Template (inline styles for html2canvas compatibility) ──────────────

function PrintTemplate({
  challan,
  garmentImage,
}: {
  challan: Challan;
  garmentImage?: string;
}) {
  const colorGroups = groupByColor(challan.items);
  const grand = totalQty(challan.items);

  return (
    <div
      style={{
        fontFamily: "Arial, sans-serif",
        padding: "32px",
        maxWidth: "700px",
        margin: "0 auto",
        color: "#111",
        background: "#fff",
      }}
    >
      {/* Header */}
      <div
        style={{
          textAlign: "center",
          marginBottom: "20px",
          borderBottom: "2px solid #111",
          paddingBottom: "16px",
        }}
      >
        <h1
          style={{
            fontSize: "24px",
            fontWeight: 900,
            letterSpacing: "0.05em",
            margin: 0,
          }}
        >
          SHIVA GARMENTS
        </h1>
        <h2
          style={{
            fontSize: "16px",
            fontWeight: 700,
            letterSpacing: "0.12em",
            margin: "4px 0 0",
            textTransform: "uppercase",
          }}
        >
          Job Work Challan
        </h2>
      </div>

      {/* Garment Image */}
      {garmentImage && (
        <div
          style={{
            textAlign: "center",
            marginBottom: "20px",
          }}
        >
          <img
            src={garmentImage}
            alt="Garment"
            style={{
              maxWidth: "400px",
              maxHeight: "300px",
              objectFit: "contain",
              display: "block",
              margin: "0 auto",
              borderRadius: "6px",
              border: "1px solid #ddd",
            }}
          />
          <p
            style={{
              fontSize: "11px",
              color: "#888",
              marginTop: "6px",
            }}
          >
            Garment Reference Photo
          </p>
        </div>
      )}

      {/* Meta */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "8px",
          marginBottom: "20px",
          fontSize: "13px",
        }}
      >
        <div>
          <strong>Date:</strong> {challan.date}
        </div>
        <div>
          <strong>Challan No:</strong> {challan.challanNo}
        </div>
        <div>
          <strong>Sender:</strong> {challan.senderParty}
        </div>
        <div>
          <strong>Receiver:</strong> {challan.receiverParty}
        </div>
        <div style={{ gridColumn: "1 / -1" }}>
          <strong>Job Type:</strong> {challan.jobType}
        </div>
      </div>

      {/* Items Table */}
      {challan.items.length > 0 && (
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: "13px",
            marginBottom: "16px",
          }}
        >
          <thead>
            <tr
              style={{
                background: "#1a1a1a",
                color: "#fff",
              }}
            >
              <th
                style={{
                  padding: "8px 10px",
                  textAlign: "left",
                  fontWeight: 700,
                }}
              >
                Article
              </th>
              <th
                style={{
                  padding: "8px 10px",
                  textAlign: "left",
                  fontWeight: 700,
                }}
              >
                Color
              </th>
              <th
                style={{
                  padding: "8px 10px",
                  textAlign: "right",
                  fontWeight: 700,
                }}
              >
                Qty
              </th>
              <th
                style={{
                  padding: "8px 10px",
                  textAlign: "left",
                  fontWeight: 700,
                }}
              >
                Job Type
              </th>
            </tr>
          </thead>
          <tbody>
            {colorGroups.map((group) => (
              <React.Fragment key={group.color}>
                {group.items.map((it, i) => (
                  <tr
                    key={`${it.color}-${i}`}
                    style={{
                      background: i % 2 === 0 ? "#f9f9f9" : "#fff",
                    }}
                  >
                    <td style={{ padding: "7px 10px" }}>{it.articleNo}</td>
                    <td style={{ padding: "7px 10px" }}>{it.color || "—"}</td>
                    <td style={{ padding: "7px 10px", textAlign: "right" }}>
                      {it.qty}
                    </td>
                    <td style={{ padding: "7px 10px" }}>{it.jobType}</td>
                  </tr>
                ))}
                {/* Color subtotal row */}
                {colorGroups.length > 1 && (
                  <tr
                    style={{
                      background: "#e8f4e8",
                      borderTop: "1px solid #bbb",
                    }}
                  >
                    <td
                      colSpan={2}
                      style={{
                        padding: "6px 10px",
                        fontWeight: 700,
                        fontSize: "12px",
                      }}
                    >
                      Color Total — {group.color}
                    </td>
                    <td
                      style={{
                        padding: "6px 10px",
                        textAlign: "right",
                        fontWeight: 700,
                        fontSize: "12px",
                      }}
                    >
                      {group.subtotal}
                    </td>
                    <td />
                  </tr>
                )}
              </React.Fragment>
            ))}
            {/* Grand total row */}
            <tr
              style={{
                background: "#1a1a1a",
                color: "#fff",
                fontWeight: 700,
              }}
            >
              <td colSpan={2} style={{ padding: "9px 10px", fontSize: "14px" }}>
                Grand Total Quantity
              </td>
              <td
                style={{
                  padding: "9px 10px",
                  textAlign: "right",
                  fontSize: "14px",
                }}
              >
                {grand}
              </td>
              <td />
            </tr>
          </tbody>
        </table>
      )}

      {/* Custom Fields */}
      {challan.customFields.length > 0 && (
        <div
          style={{
            marginBottom: "16px",
            padding: "12px",
            background: "#f5f5f5",
            borderRadius: "6px",
          }}
        >
          <p
            style={{
              fontWeight: 700,
              fontSize: "12px",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              marginBottom: "8px",
            }}
          >
            Custom Details
          </p>
          {challan.customFields.map((f) => (
            <div key={f.id} style={{ fontSize: "13px", marginBottom: "4px" }}>
              <strong>{f.name}:</strong> {f.value || "—"}
            </div>
          ))}
        </div>
      )}

      {/* Reference Photos */}
      {challan.photos.length > 0 && (
        <div>
          <p
            style={{
              fontWeight: 700,
              fontSize: "12px",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              marginBottom: "8px",
            }}
          >
            Reference Photos
          </p>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: "8px",
            }}
          >
            {challan.photos.slice(0, 6).map((src, _i) => (
              <img
                key={src.slice(-20)}
                src={src}
                alt={"Reference"}
                style={{
                  width: "100%",
                  aspectRatio: "1",
                  objectFit: "cover",
                  borderRadius: "4px",
                  border: "1px solid #ddd",
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <div
        style={{
          marginTop: "32px",
          borderTop: "1px solid #ddd",
          paddingTop: "12px",
          textAlign: "center",
          fontSize: "11px",
          color: "#999",
        }}
      >
        Generated by Production Master Pro —{" "}
        {new Date().toLocaleDateString("en-IN")}
      </div>
    </div>
  );
}
