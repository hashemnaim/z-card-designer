import JSZip from "jszip";
import type { TemplateRecord } from "./types";
import { generateFiles } from "./runtime/generate";

export interface ExportResult {
  fileName: string;
  files: string[];
  bytes: number;
}

/** Builds the standalone template package and triggers a browser download. */
export async function exportTemplateZip(template: TemplateRecord): Promise<ExportResult> {
  const generated = generateFiles(template);
  const zip = new JSZip();
  const folder = zip.folder(template.id);
  if (!folder) throw new Error("Could not create template folder");

  folder.file("index.html", generated["index.html"]);
  folder.file("styles.css", generated["styles.css"]);
  folder.file("template.js", generated["template.js"]);
  folder.file("manifest.json", generated["manifest.json"]);
  folder.file(generated.demoFileName, generated.demoJson);

  const assets = folder.folder("assets");
  assets?.file(
    "README.txt",
    "Local template assets go here. Referenced with relative paths from styles.css or template.js.\n",
  );

  const referenceImage = template.reference.imageDataUrl;
  if (referenceImage?.startsWith("data:image/")) {
    const [meta, base64] = referenceImage.split(",");
    const ext = meta?.includes("png") ? "png" : meta?.includes("webp") ? "webp" : "jpg";
    if (base64) assets?.file(`reference.${ext}`, base64, { base64: true });
  }

  const blob = await zip.generateAsync({ type: "blob" });
  const fileName = `${template.id}.zip`;
  downloadBlob(blob, fileName);

  return {
    fileName,
    files: [
      `${template.id}/index.html`,
      `${template.id}/styles.css`,
      `${template.id}/template.js`,
      `${template.id}/manifest.json`,
      `${template.id}/${generated.demoFileName}`,
      `${template.id}/assets/`,
    ],
    bytes: blob.size,
  };
}

function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
}
