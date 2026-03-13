import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { toast } from "sonner";

/** CSS variable overrides to replace oklch-based design tokens with plain hex */
const CSS_VAR_OVERRIDES: Record<string, string> = {
  "--background": "#ffffff",
  "--foreground": "#111111",
  "--card": "#ffffff",
  "--card-foreground": "#111111",
  "--popover": "#ffffff",
  "--popover-foreground": "#111111",
  "--primary": "#1a56db",
  "--primary-foreground": "#ffffff",
  "--secondary": "#f3f4f6",
  "--secondary-foreground": "#111111",
  "--muted": "#f3f4f6",
  "--muted-foreground": "#6b7280",
  "--accent": "#f3f4f6",
  "--accent-foreground": "#111111",
  "--destructive": "#ef4444",
  "--destructive-foreground": "#ffffff",
  "--border": "#e5e7eb",
  "--input": "#e5e7eb",
  "--ring": "#1a56db",
};

/**
 * Patch the cloned document so that html2canvas never encounters oklch().
 * 1. Override CSS custom properties on :root with plain hex values.
 * 2. Walk all inline styles and replace any remaining oklch() calls.
 */
function patchClonedDoc(doc: Document, el: HTMLElement): void {
  // 1. Inject override <style> into cloned document head
  const style = doc.createElement("style");
  const rules = Object.entries(CSS_VAR_OVERRIDES)
    .map(([k, v]) => `${k}: ${v}`)
    .join("; ");
  style.textContent = `:root { ${rules} }`;
  doc.head.appendChild(style);

  // 2. Walk all elements and fix inline style oklch values
  const allEls = [el, ...Array.from(el.querySelectorAll("*"))] as HTMLElement[];
  for (const node of allEls) {
    if (!(node instanceof HTMLElement)) continue;
    const st = node.style;
    for (const prop of Array.from(st)) {
      const val = st.getPropertyValue(prop);
      if (!val.includes("oklch")) continue;
      // Try computed value first
      const computed = getComputedStyle(node).getPropertyValue(prop);
      if (computed && !computed.includes("oklch")) {
        st.setProperty(prop, computed);
        continue;
      }
      // Fallback by property type
      const p = prop.toLowerCase();
      if (p.includes("background") || p === "background") {
        st.setProperty(prop, "#ffffff");
      } else if (p.includes("border") || p.includes("outline")) {
        st.setProperty(prop, "#e5e7eb");
      } else if (p.includes("color")) {
        st.setProperty(prop, "#111111");
      } else {
        st.setProperty(prop, "#111111");
      }
    }
  }
}

/**
 * Generate a PDF Blob from a DOM element by id.
 */
export async function generatePdfFromElement(
  elementId: string,
  _filename: string,
): Promise<Blob> {
  const element = document.getElementById(elementId);
  if (!element) throw new Error(`Element #${elementId} not found`);

  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    allowTaint: true,
    logging: false,
    backgroundColor: "#ffffff",
    onclone: (clonedDoc, clonedEl) => {
      patchClonedDoc(clonedDoc, clonedEl);
    },
  });

  const imgData = canvas.toDataURL("image/jpeg", 0.95);
  const pdf = new jsPDF("portrait", "mm", "a4");

  const pdfWidth = 210;
  const pdfHeight = 297;
  const imgWidth = pdfWidth;
  const imgHeight = (canvas.height * pdfWidth) / canvas.width;

  if (imgHeight <= pdfHeight) {
    pdf.addImage(imgData, "JPEG", 0, 0, imgWidth, imgHeight);
  } else {
    let yOffset = 0;
    while (yOffset < imgHeight) {
      if (yOffset > 0) pdf.addPage();
      pdf.addImage(imgData, "JPEG", 0, -yOffset, imgWidth, imgHeight);
      yOffset += pdfHeight;
    }
  }

  return pdf.output("blob");
}

/**
 * Download a PDF generated from a DOM element.
 */
export async function downloadPdf(
  elementId: string,
  filename: string,
): Promise<void> {
  const blob = await generatePdfFromElement(elementId, filename);
  const safeFilename = filename.endsWith(".pdf") ? filename : `${filename}.pdf`;
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = safeFilename;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Share PDF via Web Share API (with file) if supported,
 * otherwise download the PDF and open WhatsApp with a fallback message.
 */
export async function sharePdfWhatsApp(
  elementId: string,
  filename: string,
  text?: string,
): Promise<void> {
  const blob = await generatePdfFromElement(elementId, filename);
  const safeFilename = filename.endsWith(".pdf") ? filename : `${filename}.pdf`;
  const file = new File([blob], safeFilename, { type: "application/pdf" });

  if (
    typeof navigator.share === "function" &&
    typeof navigator.canShare === "function" &&
    navigator.canShare({ files: [file] })
  ) {
    await navigator.share({
      files: [file],
      title: safeFilename,
      text: text ?? safeFilename,
    });
  } else {
    // Fallback: download PDF, then open WhatsApp
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = safeFilename;
    a.click();
    URL.revokeObjectURL(url);
    toast.info("PDF downloaded. Please share the file manually via WhatsApp.", {
      duration: 5000,
    });
    setTimeout(() => {
      const waText = text || `Please find the attached PDF: ${safeFilename}`;
      window.open(
        `https://wa.me/?text=${encodeURIComponent(waText)}`,
        "_blank",
        "noopener",
      );
    }, 800);
  }
}
