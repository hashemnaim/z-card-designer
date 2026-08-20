import JSZip from "jszip";
import type { TemplateRecord } from "./types";
import { generateDemoDataJs, generateFiles, generateManifest } from "./runtime/generate";
import { validateAssetManifest } from "./validate";

/** One responsive step: WebP first, JPG kept as the universal fallback. */
export interface AssetVariantPair {
  webp?: string;
  jpg: string;
}

export interface AssetVariantEntry {
  source: string;
  /** Preferred file (WebP when it could be encoded). */
  file: string;
  /** Always-safe original download. */
  fallback: string;
  variants: Partial<Record<keyof typeof VARIANT_WIDTHS, AssetVariantPair>>;
}

export interface ExportResult {
  fileName: string;
  files: string[];
  bytes: number;
  assets: number;
  assetsFailed: number;
  variants: number;
  webp: number;
}


const IMAGE_EXT = /\.(png|jpe?g|webp|gif|avif|svg)$/i;

/** Responsive widths generated next to every downloaded asset. */
export const VARIANT_WIDTHS = { thumb: 240, medium: 720, large: 1280 } as const;

function isImageUrl(value: string) {
  if (value.startsWith("data:image/")) return true;
  /* root-relative CDN asset path (e.g. /__l5e/assets-v1/...) — fetchable from the app origin */
  if (value.startsWith("/") && IMAGE_EXT.test(value.split("?")[0] ?? "")) return true;
  if (!/^https?:\/\//i.test(value)) return false;
  try {
    const url = new URL(value);
    if (IMAGE_EXT.test(url.pathname)) return true;
    return /images\.unsplash\.com|photo-|\/image|cdn|__l5e/i.test(value);
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

/** Rescales a blob to `width` px (or 0 = keep size) and encodes it to `type`. */
async function encodeBlob(
  blob: Blob,
  width: number,
  type: "image/jpeg" | "image/webp",
): Promise<ArrayBuffer | null> {
  try {
    if (typeof createImageBitmap !== "function") return null;
    const bitmap = await createImageBitmap(blob);
    const targetWidth = width > 0 ? Math.min(width, bitmap.width) : bitmap.width;
    if (width > 0 && bitmap.width <= width && type === "image/jpeg") return null;
    const height = Math.max(1, Math.round((bitmap.height / bitmap.width) * targetWidth));
    const canvas = document.createElement("canvas");
    canvas.width = targetWidth;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(bitmap, 0, 0, targetWidth, height);
    const out = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob((b) => resolve(b), type, type === "image/webp" ? 0.82 : 0.86),
    );
    /* browsers without WebP encoding silently fall back to PNG — reject those */
    if (!out || (type === "image/webp" && out.type !== "image/webp")) return null;
    return await out.arrayBuffer();
  } catch {
    return null;
  }
}

/** Walks demo data, downloads every image (plus WebP/JPG responsive variants) into assets/. */
async function localizeImages(data: unknown, assetsFolder: JSZip | null) {
  const cache = new Map<string, string>();
  const manifestAssets: AssetVariantEntry[] = [];
  const packaged = new Set<string>();
  let downloaded = 0;
  let failed = 0;
  let variants = 0;
  let webp = 0;

  let counter = 0;

  function put(name: string, bytes: ArrayBuffer) {
    assetsFolder?.file(name, bytes);
    packaged.add(`assets/${name}`);
    return `assets/${name}`;
  }

  async function fetchOne(url: string): Promise<string | null> {
    if (cache.has(url)) return cache.get(url) ?? null;
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      counter += 1;
      const ext = extFromType(blob.type || url);
      const base = `image-${String(counter).padStart(2, "0")}`;
      const original = put(`${base}.${ext}`, await blob.arrayBuffer());
      const entry: AssetVariantEntry = {
        source: url,
        file: original,
        fallback: original,
        variants: {},
      };

      const rasterizable = ext !== "svg" && ext !== "gif";
      if (rasterizable) {
        /* full-size WebP becomes the preferred file, the download stays as fallback */
        if (ext !== "webp") {
          const fullWebp = await encodeBlob(blob, 0, "image/webp");
          if (fullWebp) {
            entry.file = put(`${base}.webp`, fullWebp);
            webp += 1;
          }
        }
        for (const [label, width] of Object.entries(VARIANT_WIDTHS)) {
          const jpgBytes = await encodeBlob(blob, width, "image/jpeg");
          if (!jpgBytes) continue;
          const pair: AssetVariantPair = { jpg: put(`${base}-${label}.jpg`, jpgBytes) };
          variants += 1;
          const webpBytes = await encodeBlob(blob, width, "image/webp");
          if (webpBytes) {
            pair.webp = put(`${base}-${label}.webp`, webpBytes);
            webp += 1;
          }
          entry.variants[label as keyof typeof VARIANT_WIDTHS] = pair;
        }
      }

      manifestAssets.push(entry);
      /* demo data points at the fallback so any consumer can load it without WebP support */
      cache.set(url, entry.fallback);
      downloaded += 1;
      return entry.fallback;
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
  return { localized, downloaded, failed, variants, webp, manifestAssets, packaged };
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
  folder.file("schema.json", generated["schema.json"]);
  folder.file(generated.contractFileName, generated.contractJson);

  const assets = folder.folder("assets");
  assets?.file(
    "README.txt",
    "Template assets. Demo images are downloaded here and referenced with relative paths (assets/...).\n" +
      `Responsive variants: thumb ${VARIANT_WIDTHS.thumb}px, medium ${VARIANT_WIDTHS.medium}px, large ${VARIANT_WIDTHS.large}px.\n` +
      "Each step ships as .webp (preferred) plus .jpg (fallback); see manifest.json -> assets.images.\n",
  );


  const { localized, downloaded, failed, variants, webp, manifestAssets, packaged } =
    await localizeImages(template.demoData, assets);
  folder.file(generated.demoFileName, JSON.stringify(localized, null, 2));
  folder.file("demo-data.js", generateDemoDataJs(localized));

  /** manifest carries the localized asset map so consumers can pick a responsive size */
  const manifest = {
    ...generateManifest(template),
    assets: {
      folder: "assets/",
      variant_widths: VARIANT_WIDTHS,
      preferred_format: "webp",
      fallback_format: "jpg",
      images: manifestAssets,
    },
  };
  folder.file("manifest.json", JSON.stringify(manifest, null, 2));

  /* every asset path in the manifest must exist in the ZIP before we hand it to the user */
  const assetIssues = validateAssetManifest(manifest, packaged);
  if (assetIssues.length) {
    throw new Error(`Asset manifest mismatch: ${assetIssues.map((i) => i.message).join("; ")}`);
  }



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
      `${template.id}/schema.json`,
      `${template.id}/${generated.contractFileName}`,
      `${template.id}/${generated.demoFileName}`,
      `${template.id}/demo-data.js`,
      `${template.id}/assets/`,
    ],
    bytes: blob.size,
    assets: downloaded,
    assetsFailed: failed,
    variants,
    webp,
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
