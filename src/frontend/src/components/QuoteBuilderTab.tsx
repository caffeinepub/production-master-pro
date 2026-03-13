import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Camera,
  Download,
  FileText,
  History,
  ImageIcon,
  Plus,
  Printer,
  Share2,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { downloadPdf, sharePdfWhatsApp } from "../utils/pdfUtils";

interface WorkItem {
  id: string;
  name: string;
  price: string;
}

interface SavedQuote {
  id: string;
  clientName: string;
  articleName: string;
  works: WorkItem[];
  totalCMT: number;
  garmentImage?: string;
  createdAt: string;
}

const STORAGE_KEY = "sg9_saved_quotes";

const DEFAULT_WORKS: WorkItem[] = [
  { id: "1", name: "Cutting", price: "" },
  { id: "2", name: "Tailor / Stitching", price: "" },
  { id: "3", name: "Overlock", price: "" },
  { id: "4", name: "Thread Cutting", price: "" },
  { id: "5", name: "Folding", price: "" },
  { id: "6", name: "Press", price: "" },
  { id: "7", name: "Packing", price: "" },
];

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatDateFromISO(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatDateForFilename(date: Date): string {
  return date.toISOString().split("T")[0].replace(/-/g, "");
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

function loadSavedQuotes(): SavedQuote[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as SavedQuote[]) : [];
  } catch {
    return [];
  }
}

function persistSavedQuotes(quotes: SavedQuote[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(quotes));
}

export function QuoteBuilderTab() {
  const [clientName, setClientName] = useState("");
  const [articleName, setArticleName] = useState("");
  const [works, setWorks] = useState<WorkItem[]>(DEFAULT_WORKS);
  const [garmentImage, setGarmentImage] = useState<string>("");
  const [showPreview, setShowPreview] = useState(false);
  const [savedQuotes, setSavedQuotes] = useState<SavedQuote[]>([]);
  // For PDF generation — hidden off-screen print area
  const [printPayload, setPrintPayload] = useState<{
    cName: string;
    aName: string;
    wList: WorkItem[];
    cmt: number;
    img: string;
    action: "print" | "download" | "share";
  } | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const today = new Date();

  useEffect(() => {
    setSavedQuotes(loadSavedQuotes());
  }, []);

  // Trigger PDF action after printPayload renders off-screen
  useEffect(() => {
    if (!printPayload) return;
    const timeout = setTimeout(async () => {
      const cn = printPayload.cName;
      const an = printPayload.aName;
      const filename = `Shiva_Garment_Quotation_${cn.replace(/\s+/g, "_")}_${formatDateForFilename(today)}.pdf`;
      try {
        if (printPayload.action === "print") {
          window.print();
        } else if (printPayload.action === "download") {
          await downloadPdf("quote-print-area", filename);
          toast.success("Quotation PDF downloaded!");
        } else if (printPayload.action === "share") {
          const text = `SHIVA GARMENT - QUOTATION\nClient: ${cn}\nArticle: ${an}\nTotal CMT: \u20b9${printPayload.cmt.toFixed(2)}/pc`;
          await sharePdfWhatsApp("quote-print-area", filename, text);
        }
      } catch (err) {
        toast.error(
          `Export failed: ${
            err instanceof Error ? err.message : "Unknown error"
          }`,
        );
      } finally {
        setPrintPayload(null);
      }
    }, 600);
    return () => clearTimeout(timeout);
  }, [printPayload, today]);

  const totalCMT = works.reduce((sum, w) => {
    const val = Number.parseFloat(w.price);
    return sum + (Number.isNaN(val) ? 0 : val);
  }, 0);

  function addWork() {
    setWorks((prev) => [
      ...prev,
      { id: Date.now().toString(), name: "", price: "" },
    ]);
  }

  function removeWork(id: string) {
    setWorks((prev) => prev.filter((w) => w.id !== id));
  }

  function updateWork(id: string, field: "name" | "price", value: string) {
    setWorks((prev) =>
      prev.map((w) => (w.id === id ? { ...w, [field]: value } : w)),
    );
  }

  function validateForm(): boolean {
    if (!clientName.trim()) {
      toast.error("Please enter the Client Name.");
      return false;
    }
    if (!articleName.trim()) {
      toast.error("Please enter the Article Name.");
      return false;
    }
    return true;
  }

  function saveQuoteToHistory() {
    const newQuote: SavedQuote = {
      id: Date.now().toString(),
      clientName,
      articleName,
      works: works.map((w) => ({ ...w })),
      totalCMT,
      garmentImage,
      createdAt: new Date().toISOString(),
    };
    const updated = [newQuote, ...loadSavedQuotes()].slice(0, 50);
    persistSavedQuotes(updated);
    setSavedQuotes(updated);
  }

  function deleteQuote(id: string) {
    const updated = loadSavedQuotes().filter((q) => q.id !== id);
    persistSavedQuotes(updated);
    setSavedQuotes(updated);
    toast.success("Quote deleted.");
  }

  function loadQuote(q: SavedQuote) {
    setClientName(q.clientName);
    setArticleName(q.articleName);
    setWorks(q.works.map((w) => ({ ...w })));
    setGarmentImage(q.garmentImage || "");
    setShowPreview(false);
    toast.success("Quote loaded into form.");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function generatePreview() {
    if (!validateForm()) return;
    saveQuoteToHistory();
    setShowPreview(true);
    setTimeout(() => {
      previewRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  }

  const handleGarmentImageChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    toast.loading("Processing image...");
    const compressed = await compressImage(file);
    setGarmentImage(compressed);
    toast.dismiss();
    toast.success("Garment image added");
    e.target.value = "";
  };

  // Trigger print using off-screen div
  function triggerPrint(
    action: "print" | "download" | "share",
    cName?: string,
    aName?: string,
    wList?: WorkItem[],
    cmt?: number,
    img?: string,
  ) {
    const cn = cName ?? clientName;
    const an = aName ?? articleName;
    if (!cn.trim() || !an.trim()) {
      if (!validateForm()) return;
    }
    const toastId = action === "print" ? undefined : "pdf-action";
    if (toastId) toast.loading("Generating PDF...", { id: toastId });
    setPrintPayload({
      cName: cn,
      aName: an,
      wList: wList ?? works,
      cmt: cmt ?? totalCMT,
      img: img ?? garmentImage,
      action,
    });
    if (toastId) setTimeout(() => toast.dismiss(toastId), 5000);
  }

  // Legacy: print via new window (fallback)
  function openPrintWindow(
    cName?: string,
    aName?: string,
    wList?: WorkItem[],
    cmt?: number,
    img?: string,
  ) {
    const cn = cName ?? clientName;
    const an = aName ?? articleName;
    const wl = wList ?? works;
    const total = cmt ?? totalCMT;
    const image = img ?? garmentImage;
    const html = buildPrintableHTML(cn, an, wl, total, image);
    const win = window.open("", "_blank");
    if (win) {
      win.document.write(html);
      win.document.close();
      win.focus();
      setTimeout(() => win.print(), 300);
    }
  }

  function buildPrintableHTML(
    cName: string,
    aName: string,
    wList: WorkItem[],
    total: number,
    image?: string,
  ): string {
    const worksRows = wList
      .filter((w) => w.name.trim())
      .map((w) => {
        const price = Number.parseFloat(w.price);
        const display = Number.isNaN(price) ? "-" : `&#8377;${price}`;
        return `<tr><td>${w.name}</td><td style="text-align:right">${display}</td></tr>`;
      })
      .join("");

    const imgHtml = image
      ? `<div style="text-align:center;margin:20px 0">
           <img src="${image}" alt="Garment" style="max-width:400px;max-height:300px;object-fit:contain;border-radius:6px;border:1px solid #ddd" />
           <p style="font-size:11px;color:#888;margin-top:6px">Garment Reference Photo</p>
         </div>`
      : "";

    return `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8" />
<style>
  body { font-family: Arial, sans-serif; margin: 0; padding: 32px; color: #1a1a1a; }
  .header { text-align: center; margin-bottom: 24px; }
  .header h1 { font-size: 28px; font-weight: 900; letter-spacing: 2px; margin: 0 0 4px 0; text-transform: uppercase; }
  .header h2 { font-size: 18px; font-weight: 700; letter-spacing: 4px; margin: 0; text-transform: uppercase; color: #444; }
  .divider { border: none; border-top: 2px solid #222; margin: 16px 0; }
  .meta { font-size: 13px; margin-bottom: 20px; line-height: 1.8; }
  .meta span { font-weight: 700; }
  table { width: 100%; border-collapse: collapse; font-size: 14px; }
  th { background: #1a1a1a; color: #fff; padding: 10px 14px; text-align: left; }
  th:last-child { text-align: right; }
  td { padding: 9px 14px; border-bottom: 1px solid #e5e5e5; }
  .total-row td { font-size: 16px; font-weight: 900; background: #f5f5f5; border-top: 2px solid #1a1a1a; }
  .footer { text-align: center; margin-top: 40px; font-size: 11px; color: #888; }
</style>
</head>
<body>
<div class="header">
  <h1>SHIVA GARMENT</h1>
  <h2>QUOTATION</h2>
</div>
<hr class="divider" />
${imgHtml}
<div class="meta">
  <div><span>Date:</span> ${formatDate(today)}</div>
  <div><span>Client Name:</span> ${cName}</div>
  <div><span>Article Name:</span> ${aName}</div>
</div>
<table>
  <thead><tr><th>Work</th><th style="text-align:right">Rate (&#8377;)</th></tr></thead>
  <tbody>
    ${worksRows}
    <tr class="total-row">
      <td>Total CMT per piece</td>
      <td style="text-align:right">&#8377;${total.toFixed(2)}</td>
    </tr>
  </tbody>
</table>
<div class="footer">Shiva Garment &mdash; Quotation generated on ${formatDate(today)}</div>
</body>
</html>`;
  }

  const validWorks = works.filter((w) => w.name.trim());

  return (
    <div className="p-4 space-y-5 max-w-2xl mx-auto pb-24">
      {/* Off-screen print area for PDF generation */}
      {printPayload && (
        <div
          id="print-area"
          style={{
            position: "fixed",
            left: "-9999px",
            top: 0,
            width: "800px",
            backgroundColor: "#ffffff",
            zIndex: -1,
          }}
        >
          <div id="quote-print-area">
            <QuotePrintTemplate
              clientName={printPayload.cName}
              articleName={printPayload.aName}
              works={printPayload.wList}
              totalCMT={printPayload.cmt}
              garmentImage={printPayload.img}
              date={formatDate(today)}
            />
          </div>
        </div>
      )}

      {/* Header */}
      <div
        className="text-center rounded-xl py-5 px-4"
        style={{
          background: "oklch(var(--primary))",
          color: "oklch(var(--primary-foreground))",
        }}
        data-ocid="quote.header.panel"
      >
        <div className="text-2xl font-black tracking-widest uppercase">
          SHIVA GARMENT
        </div>
        <div className="text-sm font-bold tracking-[0.3em] uppercase mt-1 opacity-90">
          QUOTATION
        </div>
      </div>

      {/* Client Info */}
      <Card data-ocid="quote.info.card">
        <CardHeader className="pb-3 pt-4 px-4">
          <h3
            className="font-bold text-base"
            style={{ color: "oklch(var(--foreground))" }}
          >
            Client Information
          </h3>
        </CardHeader>
        <CardContent className="px-4 pb-4 space-y-3">
          <div className="space-y-1">
            <Label htmlFor="client-name">Client Name *</Label>
            <Input
              id="client-name"
              data-ocid="quote.client_name.input"
              placeholder="Enter client name"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="article-name">Article Name *</Label>
            <Input
              id="article-name"
              data-ocid="quote.article_name.input"
              placeholder="Enter article name"
              value={articleName}
              onChange={(e) => setArticleName(e.target.value)}
            />
          </div>
          <div
            className="text-sm rounded-lg px-3 py-2"
            style={{
              background: "oklch(var(--muted))",
              color: "oklch(var(--muted-foreground))",
            }}
          >
            Date: <span className="font-semibold">{formatDate(today)}</span>
          </div>
        </CardContent>
      </Card>

      {/* Garment Image Upload */}
      <Card data-ocid="quote.garment_image.card">
        <CardHeader className="pb-2 pt-4 px-4">
          <h3
            className="font-bold text-base"
            style={{ color: "oklch(var(--foreground))" }}
          >
            Garment Image{" "}
            <span
              className="text-sm font-normal"
              style={{ color: "oklch(var(--muted-foreground))" }}
            >
              (Optional)
            </span>
          </h3>
        </CardHeader>
        <CardContent className="px-4 pb-4">
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
                data-ocid="quote.garment_image.delete_button"
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
                data-ocid="quote.garment_image.upload_button"
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
                data-ocid="quote.garment_camera.upload_button"
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

      {/* Work Cost Fields */}
      <Card data-ocid="quote.works.card">
        <CardHeader className="pb-2 pt-4 px-4">
          <h3
            className="font-bold text-base"
            style={{ color: "oklch(var(--foreground))" }}
          >
            Work Cost Breakdown
          </h3>
          <p
            className="text-xs"
            style={{ color: "oklch(var(--muted-foreground))" }}
          >
            Enter price per piece for each work type
          </p>
        </CardHeader>
        <CardContent className="px-4 pb-4 space-y-2">
          <div className="grid grid-cols-[1fr_120px_36px] gap-2 px-1">
            <span
              className="text-xs font-semibold"
              style={{ color: "oklch(var(--muted-foreground))" }}
            >
              WORK NAME
            </span>
            <span
              className="text-xs font-semibold text-right"
              style={{ color: "oklch(var(--muted-foreground))" }}
            >
              RATE (&#8377;/pc)
            </span>
            <span />
          </div>

          {works.map((work, idx) => (
            <div
              key={work.id}
              className="grid grid-cols-[1fr_120px_36px] gap-2 items-center"
              data-ocid={`quote.work.item.${idx + 1}`}
            >
              <Input
                data-ocid={`quote.work.name.${idx + 1}`}
                placeholder="Work name"
                value={work.name}
                onChange={(e) => updateWork(work.id, "name", e.target.value)}
                className="text-sm"
              />
              <Input
                data-ocid={`quote.work.price.${idx + 1}`}
                placeholder="0.00"
                type="number"
                min="0"
                step="0.25"
                value={work.price}
                onChange={(e) => updateWork(work.id, "price", e.target.value)}
                className="text-sm text-right"
              />
              <button
                type="button"
                data-ocid={`quote.work.delete_button.${idx + 1}`}
                onClick={() => removeWork(work.id)}
                className="flex items-center justify-center w-9 h-9 rounded-lg transition-colors"
                style={{
                  color: "oklch(var(--destructive))",
                  background: "oklch(var(--destructive) / 0.08)",
                }}
                aria-label="Remove work"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}

          <Button
            type="button"
            variant="outline"
            size="sm"
            data-ocid="quote.add_work.button"
            onClick={addWork}
            className="w-full mt-2 gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Work
          </Button>

          <Separator className="my-3" />

          <div
            className="flex items-center justify-between rounded-xl px-4 py-3"
            style={{
              background: "oklch(var(--primary) / 0.1)",
              border: "2px solid oklch(var(--primary) / 0.3)",
            }}
          >
            <span
              className="font-bold text-base"
              style={{ color: "oklch(var(--foreground))" }}
            >
              Total CMT per piece
            </span>
            <span
              className="text-xl font-black"
              style={{ color: "oklch(var(--primary))" }}
              data-ocid="quote.total_cmt.panel"
            >
              &#8377;{totalCMT.toFixed(2)}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="grid grid-cols-1 gap-3" data-ocid="quote.actions.panel">
        <Button
          type="button"
          data-ocid="quote.generate.primary_button"
          onClick={generatePreview}
          className="gap-2 h-12 font-bold text-base"
          style={{
            background: "oklch(var(--primary))",
            color: "oklch(var(--primary-foreground))",
          }}
        >
          <FileText className="w-5 h-5" />
          Generate Quotation
        </Button>

        <div className="grid grid-cols-3 gap-2">
          <Button
            type="button"
            variant="outline"
            data-ocid="quote.print.button"
            onClick={() => openPrintWindow()}
            className="gap-1.5 h-11 font-semibold text-sm"
          >
            <Printer className="w-4 h-4" />
            Print
          </Button>
          <Button
            type="button"
            variant="outline"
            data-ocid="quote.download.button"
            onClick={() => triggerPrint("download")}
            className="gap-1.5 h-11 font-semibold text-sm"
          >
            <Download className="w-4 h-4" />
            PDF
          </Button>
          <Button
            type="button"
            data-ocid="quote.whatsapp.button"
            onClick={() => triggerPrint("share")}
            className="gap-1.5 h-11 font-semibold text-sm"
            style={{ background: "#25D366", color: "#fff" }}
          >
            <Share2 className="w-4 h-4" />
            Share
          </Button>
        </div>
      </div>

      {/* Quotation Preview */}
      {showPreview && (
        <Card
          ref={previewRef}
          data-ocid="quote.preview.card"
          className="overflow-hidden"
        >
          <CardHeader className="pb-2 pt-4 px-4">
            <h3
              className="font-bold text-base"
              style={{ color: "oklch(var(--foreground))" }}
            >
              Quotation Preview
            </h3>
          </CardHeader>
          <CardContent className="px-4 pb-5">
            {/* Preview Header */}
            <div
              className="text-center py-4 border-b-2 mb-4"
              style={{ borderColor: "oklch(var(--foreground))" }}
            >
              <div
                className="text-xl font-black tracking-widest uppercase"
                style={{ color: "oklch(var(--foreground))" }}
              >
                SHIVA GARMENT
              </div>
              <div
                className="text-sm font-bold tracking-[0.3em] uppercase mt-0.5"
                style={{ color: "oklch(var(--muted-foreground))" }}
              >
                QUOTATION
              </div>
            </div>

            {/* Garment Image in Preview */}
            {garmentImage && (
              <div className="flex justify-center mb-4">
                <img
                  src={garmentImage}
                  alt="Garment"
                  style={{
                    maxWidth: "400px",
                    maxHeight: "250px",
                    objectFit: "contain",
                    borderRadius: "8px",
                    border: "1px solid oklch(var(--border))",
                  }}
                />
              </div>
            )}

            {/* Meta */}
            <div
              className="text-sm space-y-1 mb-4"
              style={{ color: "oklch(var(--foreground))" }}
            >
              <div>
                <span className="font-bold">Date:</span> {formatDate(today)}
              </div>
              <div>
                <span className="font-bold">Client Name:</span> {clientName}
              </div>
              <div>
                <span className="font-bold">Article Name:</span> {articleName}
              </div>
            </div>

            {/* Table */}
            <div
              className="overflow-hidden rounded-lg border"
              style={{ borderColor: "oklch(var(--border))" }}
            >
              <table className="w-full text-sm">
                <thead>
                  <tr
                    style={{
                      background: "oklch(var(--foreground))",
                      color: "oklch(var(--background))",
                    }}
                  >
                    <th className="text-left px-3 py-2.5 font-bold">Work</th>
                    <th className="text-right px-3 py-2.5 font-bold">
                      Rate (&#8377;)
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {validWorks.map((w, i) => {
                    const price = Number.parseFloat(w.price);
                    return (
                      <tr
                        key={w.id}
                        style={{
                          background:
                            i % 2 === 0
                              ? "oklch(var(--muted) / 0.4)"
                              : "transparent",
                        }}
                      >
                        <td className="px-3 py-2">{w.name}</td>
                        <td className="px-3 py-2 text-right">
                          {Number.isNaN(price) ? "-" : `\u20B9${price}`}
                        </td>
                      </tr>
                    );
                  })}
                  <tr
                    style={{
                      background: "oklch(var(--primary) / 0.1)",
                      borderTop: "2px solid oklch(var(--primary) / 0.4)",
                    }}
                  >
                    <td
                      className="px-3 py-3 font-black text-base"
                      style={{ color: "oklch(var(--foreground))" }}
                    >
                      Total CMT per piece
                    </td>
                    <td
                      className="px-3 py-3 text-right font-black text-base"
                      style={{ color: "oklch(var(--primary))" }}
                    >
                      &#8377;{totalCMT.toFixed(2)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Saved Quotes History */}
      {savedQuotes.length > 0 && (
        <Card data-ocid="quote.history.card">
          <CardHeader className="pb-2 pt-4 px-4">
            <div className="flex items-center gap-2">
              <History
                className="w-4 h-4"
                style={{ color: "oklch(var(--primary))" }}
              />
              <h3
                className="font-bold text-base"
                style={{ color: "oklch(var(--foreground))" }}
              >
                Saved Quotes
              </h3>
              <span
                className="text-xs px-2 py-0.5 rounded-full font-semibold ml-1"
                style={{
                  background: "oklch(var(--primary) / 0.12)",
                  color: "oklch(var(--primary))",
                }}
              >
                {savedQuotes.length}
              </span>
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4 space-y-3">
            {savedQuotes.map((q, idx) => (
              <div
                key={q.id}
                data-ocid={`quote.history.item.${idx + 1}`}
                className="rounded-xl border p-3 space-y-2"
                style={{
                  borderColor: "oklch(var(--border))",
                  background: "oklch(var(--muted) / 0.3)",
                }}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div
                      className="font-semibold text-sm truncate"
                      style={{ color: "oklch(var(--foreground))" }}
                    >
                      {q.clientName} — {q.articleName}
                    </div>
                    <div
                      className="text-xs mt-0.5"
                      style={{ color: "oklch(var(--muted-foreground))" }}
                    >
                      {formatDateFromISO(q.createdAt)}
                    </div>
                  </div>
                  <div
                    className="text-sm font-black shrink-0"
                    style={{ color: "oklch(var(--primary))" }}
                  >
                    &#8377;{q.totalCMT.toFixed(2)}
                  </div>
                </div>

                <div className="flex gap-2 flex-wrap">
                  <button
                    type="button"
                    data-ocid={`quote.history.load.button.${idx + 1}`}
                    onClick={() => loadQuote(q)}
                    className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg font-semibold border transition-colors"
                    style={{
                      background: "oklch(var(--primary) / 0.1)",
                      color: "oklch(var(--primary))",
                      borderColor: "oklch(var(--primary) / 0.3)",
                    }}
                  >
                    <Upload className="w-3 h-3" />
                    Load
                  </button>
                  <button
                    type="button"
                    data-ocid={`quote.history.print.button.${idx + 1}`}
                    onClick={() =>
                      openPrintWindow(
                        q.clientName,
                        q.articleName,
                        q.works,
                        q.totalCMT,
                        q.garmentImage,
                      )
                    }
                    className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg font-semibold border transition-colors"
                    style={{
                      background: "oklch(var(--muted))",
                      color: "oklch(var(--foreground))",
                      borderColor: "oklch(var(--border))",
                    }}
                  >
                    <Printer className="w-3 h-3" />
                    Print
                  </button>
                  <button
                    type="button"
                    data-ocid={`quote.history.download.button.${idx + 1}`}
                    onClick={() =>
                      triggerPrint(
                        "download",
                        q.clientName,
                        q.articleName,
                        q.works,
                        q.totalCMT,
                        q.garmentImage,
                      )
                    }
                    className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg font-semibold border transition-colors"
                    style={{
                      background: "oklch(var(--muted))",
                      color: "oklch(var(--foreground))",
                      borderColor: "oklch(var(--border))",
                    }}
                  >
                    <Download className="w-3 h-3" />
                    Download PDF
                  </button>
                  <button
                    type="button"
                    data-ocid={`quote.history.whatsapp.button.${idx + 1}`}
                    onClick={() =>
                      triggerPrint(
                        "share",
                        q.clientName,
                        q.articleName,
                        q.works,
                        q.totalCMT,
                        q.garmentImage,
                      )
                    }
                    className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg font-semibold border transition-colors"
                    style={{
                      background: "#25D366",
                      color: "#fff",
                      borderColor: "#25D366",
                    }}
                  >
                    <Share2 className="w-3 h-3" />
                    Share PDF
                  </button>
                  <button
                    type="button"
                    data-ocid={`quote.history.delete_button.${idx + 1}`}
                    onClick={() => {
                      if (
                        window.confirm(`Delete quote for "${q.clientName}"?`)
                      ) {
                        deleteQuote(q.id);
                      }
                    }}
                    className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg font-semibold border transition-colors ml-auto"
                    style={{
                      background: "oklch(var(--destructive) / 0.08)",
                      color: "oklch(var(--destructive))",
                      borderColor: "oklch(var(--destructive) / 0.3)",
                    }}
                  >
                    <Trash2 className="w-3 h-3" />
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ── Inline-styled print template for html2canvas ─────────────────────────

function QuotePrintTemplate({
  clientName,
  articleName,
  works,
  totalCMT,
  garmentImage,
  date,
}: {
  clientName: string;
  articleName: string;
  works: WorkItem[];
  totalCMT: number;
  garmentImage?: string;
  date: string;
}) {
  const validWorks = works.filter((w) => w.name.trim());
  return (
    <div
      style={{
        fontFamily: "Arial, sans-serif",
        padding: "32px",
        maxWidth: "700px",
        margin: "0 auto",
        color: "#1a1a1a",
        background: "#fff",
      }}
    >
      {/* Header */}
      <div
        style={{
          textAlign: "center",
          marginBottom: "20px",
          borderBottom: "2px solid #222",
          paddingBottom: "16px",
        }}
      >
        <h1
          style={{
            fontSize: "28px",
            fontWeight: 900,
            letterSpacing: "2px",
            margin: "0 0 4px 0",
            textTransform: "uppercase",
          }}
        >
          SHIVA GARMENT
        </h1>
        <h2
          style={{
            fontSize: "18px",
            fontWeight: 700,
            letterSpacing: "4px",
            margin: 0,
            textTransform: "uppercase",
            color: "#444",
          }}
        >
          QUOTATION
        </h2>
      </div>

      {/* Garment Image */}
      {garmentImage && (
        <div style={{ textAlign: "center", marginBottom: "20px" }}>
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
          <p style={{ fontSize: "11px", color: "#888", marginTop: "6px" }}>
            Garment Reference Photo
          </p>
        </div>
      )}

      {/* Meta */}
      <div style={{ fontSize: "13px", marginBottom: "20px", lineHeight: 1.8 }}>
        <div>
          <strong>Date:</strong> {date}
        </div>
        <div>
          <strong>Client Name:</strong> {clientName}
        </div>
        <div>
          <strong>Article Name:</strong> {articleName}
        </div>
      </div>

      {/* Table */}
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          fontSize: "14px",
        }}
      >
        <thead>
          <tr style={{ background: "#1a1a1a", color: "#fff" }}>
            <th
              style={{
                padding: "10px 14px",
                textAlign: "left",
                fontWeight: 700,
              }}
            >
              Work
            </th>
            <th
              style={{
                padding: "10px 14px",
                textAlign: "right",
                fontWeight: 700,
              }}
            >
              Rate (₹)
            </th>
          </tr>
        </thead>
        <tbody>
          {validWorks.map((w, i) => {
            const price = Number.parseFloat(w.price);
            return (
              <tr
                key={w.id}
                style={{
                  background: i % 2 === 0 ? "#f5f5f5" : "#fff",
                  borderBottom: "1px solid #e5e5e5",
                }}
              >
                <td style={{ padding: "9px 14px" }}>{w.name}</td>
                <td style={{ padding: "9px 14px", textAlign: "right" }}>
                  {Number.isNaN(price) ? "-" : `₹${price}`}
                </td>
              </tr>
            );
          })}
          <tr
            style={{
              background: "#f5f5f5",
              borderTop: "2px solid #1a1a1a",
            }}
          >
            <td
              style={{
                padding: "10px 14px",
                fontWeight: 900,
                fontSize: "16px",
              }}
            >
              Total CMT per piece
            </td>
            <td
              style={{
                padding: "10px 14px",
                textAlign: "right",
                fontWeight: 900,
                fontSize: "16px",
              }}
            >
              ₹{totalCMT.toFixed(2)}
            </td>
          </tr>
        </tbody>
      </table>

      {/* Footer */}
      <div
        style={{
          marginTop: "40px",
          textAlign: "center",
          fontSize: "11px",
          color: "#888",
        }}
      >
        Shiva Garment — Quotation generated on {date}
      </div>
    </div>
  );
}
