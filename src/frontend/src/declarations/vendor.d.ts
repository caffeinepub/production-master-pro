declare module "html2canvas" {
  interface Options {
    scale?: number;
    useCORS?: boolean;
    allowTaint?: boolean;
    backgroundColor?: string | null;
    logging?: boolean;
    width?: number;
    height?: number;
    onclone?: (doc: Document, el: HTMLElement) => void;
    [key: string]: unknown;
  }
  function html2canvas(
    element: HTMLElement,
    options?: Options,
  ): Promise<HTMLCanvasElement>;
  export default html2canvas;
}

declare module "jspdf" {
  class jsPDF {
    constructor(
      orientation?: "portrait" | "landscape" | "p" | "l",
      unit?: "pt" | "mm" | "cm" | "in" | "px",
      format?: string | [number, number],
    );
    addImage(
      imageData: string | HTMLCanvasElement,
      format: string,
      x: number,
      y: number,
      width: number,
      height: number,
    ): this;
    addPage(): this;
    save(filename: string): this;
    output(type: "blob"): Blob;
    output(type: "datauristring" | "dataunknown" | string): string;
    internal: { pageSize: { getWidth: () => number; getHeight: () => number } };
  }
  export default jsPDF;
}
