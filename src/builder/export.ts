import JSZip from "jszip";
import type { TemplateRecord } from "./types";
import { generateFiles } from "./runtime/generate";

export interface ExportResult {
  fileName: string;
  files: string[];
  bytes: number;
  assets: number;
  assetsFailed: number;
}

const IMAGE_EXT = /\.(png|jpe?g|webp|gif|avif|svg)$/i;

function isImageUrl(value: string) {
  if (value.startsWith("data:image/")) return true;
  if (!/^https?:\/\//i.test(value)) return false;
  try {
    const url = new URL(value);
    if (IMAGE_EXT.test(url.pathname)) return true;
    return /images\.unsplash\.com|photo-|\/image|cdn/i.test(value);
  } catch {
    return false;
  }
}

function extFromType(type: string) {
  if (type.includes("png")) return "png";
  if (type.includes("webp")) return "webp";
  if (type.includes("gif")) return "gif";
  if (type.includes("avif")) return "avif";
  if (type.includes("svg")) return "svg";
  return "jpg";
}

/** Walks demo data, downloads every image and rewrites the value to a local assets/ path. */
async function localizeImages(data: unknown, assetsFolder: JSZip | null) {
  const cache = new Map<string, string>();
  let downloaded = 0;
  let failed = 0;
  let counter = 0;

  async function fetchOne(url: string): Promise<string | null> {
    if (cache.has(url)) return cache.get(url) ?? null;
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      counter += 1;
      const name = `image-${String(counter).padStart(2, "0")}.${extFromType(blob.type || url)}`;
      assetsFolder?.file(name, await blob.arrayBuffer());
      const relative = `assets/${name}`;
      cache.set(url, relative);
      downloaded += 1;
      return relative;
    } catch (error) {
      console.warn("Asset download failed", url, error);
      cache.set(url, url);
      failed += 1;
      return null;
    }
  }

  async function walk(value: unknown): Promise<unknown> {
    if (typeof value === "string") {
      if (!isImageUrl(value)) return value;
      return (await fetchOne(value)) ?? value;
    }
    if (Array.isArray(value)) {
      const out: unknown[] = [];
      for (const item of value) out.push(await walk(item));
      return out;
    }
    if (value && typeof value === "object") {
      const out: Record<string, unknown> = {};
      for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
        out[key] = await walk(item);
      }
      return out;
    }
    return value;
  }

  const localized = await walk(data);
  return { localized, downloaded, failed };
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

  const assets = folder.folder("assets");
  assets?.file(
    "README.txt",
    "Template assets. Demo images are downloaded here and referenced with relative paths (assets/...).\n",
  );

  const { localized, downloaded, failed } = await localizeImages(template.demoData, assets);
  folder.file(generated.demoFileName, JSON.stringify(localized, null, 2));

  const referenceImage = template.reference.imageDataUrl;
  if (referenceImage?.startsWith("data:image/")) {
    const [meta, base64] = referenceImage.split(",");
    const ext = extFromType(meta ?? "");
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
    assets: downloaded,
    assetsFailed: failed,
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
