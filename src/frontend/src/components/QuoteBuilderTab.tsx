import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Download,
  FileText,
  Plus,
  Printer,
  Share2,
  Trash2,
} from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

interface WorkItem {
  id: string;
  name: string;
  price: string;
}

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

function formatDateForFilename(date: Date): string {
  return date.toISOString().split("T")[0].replace(/-/g, "");
}

export function QuoteBuilderTab() {
  const [clientName, setClientName] = useState("");
  const [articleName, setArticleName] = useState("");
  const [works, setWorks] = useState<WorkItem[]>(DEFAULT_WORKS);
  const [showPreview, setShowPreview] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);
  const today = new Date();

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

  function generatePreview() {
    if (!validateForm()) return;
    setShowPreview(true);
    setTimeout(() => {
      previewRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  }

  function buildPrintableHTML(): string {
    const worksRows = works
      .filter((w) => w.name.trim())
      .map((w) => {
        const price = Number.parseFloat(w.price);
        const display = Number.isNaN(price) ? "-" : `₹${price}`;
        return `<tr><td>${w.name}</td><td style="text-align:right">${display}</td></tr>`;
      })
      .join("");

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
<div class="meta">
  <div><span>Date:</span> ${formatDate(today)}</div>
  <div><span>Client Name:</span> ${clientName}</div>
  <div><span>Article Name:</span> ${articleName}</div>
</div>
<table>
  <thead><tr><th>Work</th><th style="text-align:right">Rate (₹)</th></tr></thead>
  <tbody>
    ${worksRows}
    <tr class="total-row">
      <td>Total CMT per piece</td>
      <td style="text-align:right">₹${totalCMT.toFixed(2)}</td>
    </tr>
  </tbody>
</table>
<div class="footer">Shiva Garment &mdash; Quotation generated on ${formatDate(today)}</div>
</body>
</html>`;
  }

  function downloadPDF() {
    if (!validateForm()) return;
    const html = buildPrintableHTML();
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const filename = `Shiva_Garment_Quotation_${clientName.replace(/\s+/g, "_")}_${formatDateForFilename(today)}.html`;

    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);

    toast.success(
      "Quotation downloaded. Open the file and use Print → Save as PDF.",
    );
  }

  function shareWhatsApp() {
    if (!validateForm()) return;

    const validWorks = works.filter((w) => w.name.trim());
    const lines = validWorks.map((w) => {
      const price = Number.parseFloat(w.price);
      return `${w.name}: ₹${Number.isNaN(price) ? "0" : price}`;
    });

    const text = `*SHIVA GARMENT – QUOTATION*\nDate: ${formatDate(today)}\nClient: ${clientName}\nArticle: ${articleName}\n\n*Work Breakdown:*\n${lines.join("\n")}\n\n*Total CMT per piece: ₹${totalCMT.toFixed(2)}*`;

    const encoded = encodeURIComponent(text);
    window.open(`https://wa.me/?text=${encoded}`, "_blank");
  }

  const validWorks = works.filter((w) => w.name.trim());

  return (
    <div className="p-4 space-y-5 max-w-2xl mx-auto pb-24">
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
          {/* Column headers */}
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
              RATE (₹/pc)
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

          {/* Total CMT */}
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
              ₹{totalCMT.toFixed(2)}
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

        <div className="grid grid-cols-2 gap-3">
          <Button
            type="button"
            variant="outline"
            data-ocid="quote.download.button"
            onClick={downloadPDF}
            className="gap-2 h-11 font-semibold"
          >
            <Download className="w-4 h-4" />
            Download PDF
          </Button>
          <Button
            type="button"
            data-ocid="quote.whatsapp.button"
            onClick={shareWhatsApp}
            className="gap-2 h-11 font-semibold"
            style={{ background: "#25D366", color: "#fff" }}
          >
            <Share2 className="w-4 h-4" />
            Share on WhatsApp
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
            <div className="flex items-center justify-between">
              <h3
                className="font-bold text-base"
                style={{ color: "oklch(var(--foreground))" }}
              >
                Quotation Preview
              </h3>
              <button
                type="button"
                data-ocid="quote.print.button"
                onClick={() => {
                  const html = buildPrintableHTML();
                  const win = window.open("", "_blank");
                  if (win) {
                    win.document.write(html);
                    win.document.close();
                    win.focus();
                    setTimeout(() => win.print(), 300);
                  }
                }}
                className="flex items-center gap-1 text-xs px-3 py-1 rounded-lg font-semibold"
                style={{
                  background: "oklch(var(--primary) / 0.1)",
                  color: "oklch(var(--primary))",
                }}
              >
                <Printer className="w-3.5 h-3.5" />
                Print
              </button>
            </div>
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
                          background:
                            i % 2 === 0
                              ? "oklch(var(--muted) / 0.4)"
                              : "transparent",
                        }}
                      >
                        <td className="px-3 py-2">{w.name}</td>
                        <td className="px-3 py-2 text-right">
                          {Number.isNaN(price) ? "-" : `₹${price}`}
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
                      ₹{totalCMT.toFixed(2)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
