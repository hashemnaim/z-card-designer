import { contractKeys, getContract } from "@/contracts";
import type { TemplateRecord } from "./types";
import {
  generateFiles,
  generateManifest,
  humanize,
  isLuxuryCars,
  isLuxuryRealEstate,
  usageBuckets,
  usedFields,
} from "./runtime/generate";
import { CARS_LUXURY_EXTRAS, REAL_ESTATE_LUXURY_EXTRAS } from "./demo-data";

const MANIFEST_HINTS: Record<string, string> = {
  id: "Template id is empty — set it in the template identity.",
  name: "Template name is empty — set it in the template identity.",
  version: "Version is empty — use a semantic version like 1.0.0.",
  card_type: "Card type is missing — pick a card type for this template.",
  schema_version: "schema_version must come from the official contract.",
  entry: "Entry file (index.html) is not being generated.",
  style: "Stylesheet (styles.css) is not being generated.",
  script: "Runtime file (template.js) is not being generated.",
  demo_data: "Demo file (demo.json) is not being generated.",
};


/** Contract keys plus any extra keys the selected layout renders natively. */
export function allowedKeys(template: TemplateRecord): Set<string> {
  const keys = new Set(contractKeys(template.cardType));
  if (isLuxuryRealEstate(template)) {
    for (const key of Object.keys(REAL_ESTATE_LUXURY_EXTRAS)) keys.add(key);
  }
  if (isLuxuryCars(template)) {
    for (const key of Object.keys(CARS_LUXURY_EXTRAS)) keys.add(key);
  }
  return keys;
}


export type CheckLevel = "pass" | "warn" | "fail";

export interface FieldIssue {
  key: string;
  reason: string;
  hint?: string | undefined;
}

export interface CheckResult {
  id: string;
  group: "manifest" | "files" | "demo" | "runtime" | "security";
  level: CheckLevel;
  message: string;
  detail?: string | undefined;
  fields?: FieldIssue[] | undefined;
}


export interface ValidationReport {
  checks: CheckResult[];
  ok: boolean;
  warnings: number;
}

const REQUIRED_MANIFEST_KEYS = [
  "id",
  "name",
  "version",
  "card_type",
  "schema_version",
  "entry",
  "style",
  "script",
  "demo_data",
] as const;

export function validateTemplate(template: TemplateRecord): ValidationReport {
  const checks: CheckResult[] = [];
  const files = generateFiles(template);
  const manifest = generateManifest(template) as unknown as Record<string, unknown>;
  const allowed = allowedKeys(template);
  const contract = getContract(template.cardType);
  const label = (key: string) =>
    contract.fields.find((f) => f.key === key)?.name ?? humanize(key);

  // Manifest
  const missing = REQUIRED_MANIFEST_KEYS.filter((k) => {
    const value = manifest[k];
    return value === undefined || value === null || value === "";
  });
  checks.push({
    id: "manifest-keys",
    group: "manifest",
    level: missing.length ? "fail" : "pass",
    message: missing.length ? "Manifest is missing required keys" : "Manifest contains all required keys",
    detail: missing.join(", ") || undefined,
    fields: missing.map((key) => ({
      key,
      reason: `manifest.json has no value for "${key}"`,
      hint: MANIFEST_HINTS[key] ?? "Fill this value in the template properties before exporting.",
    })),
  });

  checks.push({
    id: "manifest-version",
    group: "manifest",
    level: /^\d+\.\d+\.\d+$/.test(template.version) ? "pass" : "fail",
    message: `Version format ${template.version}`,
    detail: "Expected semantic version like 1.0.0",
  });
  checks.push({
    id: "manifest-schema",
    group: "manifest",
    level: template.schemaVersion === contract.schema_version ? "pass" : "fail",
    message: `schema_version matches official contract (${contract.schema_version})`,
  });

  // Files
  const expected: Array<keyof typeof files> = ["index.html", "styles.css", "template.js", "manifest.json"];
  const emptyFiles = expected.filter((name) => !String(files[name] ?? "").trim());
  checks.push({
    id: "files-present",
    group: "files",
    level: emptyFiles.length ? "fail" : "pass",
    message: emptyFiles.length
      ? `Generated files missing content: ${emptyFiles.join(", ")}`
      : "index.html, styles.css, template.js, manifest.json generated",
  });
  const packageFiles: Array<[string, string]> = [
    ["schema.json", files["schema.json"]],
    [files.contractFileName, files.contractJson],
    ["demo-data.js", files["demo-data.js"]],
  ];
  const emptyPackage = packageFiles.filter(([, body]) => !String(body ?? "").trim());
  checks.push({
    id: "files-package",
    group: "files",
    level: emptyPackage.length ? "fail" : "pass",
    message: emptyPackage.length
      ? `Package files missing content: ${emptyPackage.map(([name]) => name).join(", ")}`
      : `schema.json, ${files.contractFileName}, demo-data.js generated`,
    fields: emptyPackage.map(([name]) => ({
      key: name,
      reason: `${name} was generated empty`,
      hint: "Check the card type contract and field usage before exporting.",
    })),
  });
  checks.push({
    id: "files-demo-js",
    group: "files",
    level: files["demo-data.js"].includes("window.ZCARD_DEMO_DATA") ? "pass" : "fail",
    message: "demo-data.js exposes window.ZCARD_DEMO_DATA",
  });

  checks.push({
    id: "files-demo",
    group: "files",
    level: files.demoFileName === "demo.json" ? "pass" : "fail",
    message: `Demo file name ${files.demoFileName}`,
  });

  // Demo data
  let demoParsed: Record<string, unknown> | null = null;
  try {
    demoParsed = JSON.parse(files.demoJson) as Record<string, unknown>;
    checks.push({ id: "demo-json", group: "demo", level: "pass", message: "Demo JSON is valid JSON" });
  } catch (error) {
    checks.push({
      id: "demo-json",
      group: "demo",
      level: "fail",
      message: "Demo JSON is not valid JSON",
      detail: String(error),
    });
  }

  if (demoParsed) {
    const invented = Object.keys(demoParsed).filter((k) => !allowed.has(k));
    checks.push({
      id: "demo-keys",
      group: "demo",
      level: invented.length ? "fail" : "pass",
      message: invented.length
        ? "Demo JSON contains keys that are not in the official data contract"
        : "Demo JSON uses official contract API keys only",
      detail: invented.join(", ") || undefined,
      fields: invented.map((key) => ({
        key,
        reason: `"${key}" is not an API key of the ${template.cardType} contract, and not an extra key this layout renders`,
        hint: "Remove it from the demo JSON, or replace it with the matching official contract key.",
      })),
    });

    const requiredKeys = usageBuckets(template).required;
    const missingRequired = requiredKeys.filter((k) => !hasValue(demoParsed?.[k]));
    checks.push({
      id: "demo-required",
      group: "demo",
      level: missingRequired.length ? "fail" : "pass",
      message: missingRequired.length
        ? "Demo JSON is missing values for fields this design marks as required"
        : "Demo JSON covers every required field of this design",
      detail: missingRequired.join(", ") || undefined,
      fields: missingRequired.map((key) => ({
        key,
        reason: `${label(key)} is marked Required by this design but has no value in the demo JSON`,
        hint: "Add a demo value, or lower the field to Recommended/Optional in the Fields pane.",
      })),
    });

    const contractRequired = contract.field_usage.required.filter(
      (k) => (template.fieldUsage[k] ?? "unused") === "unused",
    );
    checks.push({
      id: "contract-required-used",
      group: "demo",
      level: contractRequired.length ? "warn" : "pass",
      message: contractRequired.length
        ? "Contract-required fields are not used by this design"
        : "All contract-required fields are used by this design",
      detail: contractRequired.join(", ") || undefined,
      fields: contractRequired.map((key) => ({
        key,
        reason: `${label(key)} is required by the official contract but this design marks it as Not used`,
        hint: "Enable the field in the Fields pane so real API data is never dropped.",
      })),
    });
  }

  // Assets: every image reference must be localizable into assets/ at export time
  if (demoParsed) {
    const images = collectImageRefs(demoParsed);
    const unresolvable = images.filter(({ value }) => !isLocalizableImage(value));
    checks.push({
      id: "assets-resolvable",
      group: "demo",
      level: unresolvable.length ? "fail" : "pass",
      message: unresolvable.length
        ? "Some image references cannot be packaged into assets/"
        : `${images.length} image references can be packaged into assets/ (WebP + JPG fallback)`,
      detail: unresolvable.map((i) => i.key).join(", ") || undefined,
      fields: unresolvable.map(({ key, value }) => ({
        key,
        reason: `"${value.slice(0, 60)}" is not an absolute http(s)/data URL, so the exporter cannot download it`,
        hint: "Use a full https:// URL (or a data: URL) so the image lands in assets/ with local paths.",
      })),
    });

    /* dry-run of the exported manifest asset map: names must line up with packaged files */
    const plan = planAssetManifest(images.map((i) => i.value).filter(isLocalizableImage));
    const planIssues = validateAssetManifest(plan.manifest, plan.packaged);
    checks.push({
      id: "assets-manifest",
      group: "manifest",
      level: planIssues.length ? "fail" : "pass",
      message: planIssues.length
        ? "manifest.json asset references would not match the packaged files"
        : "manifest.json asset references (WebP + JPG fallback) all resolve to packaged files",
      detail: planIssues.map((i) => i.message).join("; ") || undefined,
      fields: planIssues.flatMap((i) => i.fields ?? []),
    });
  }


  // Runtime
  const hasRenderApi =
    files["template.js"].includes("window.ZCardTemplate") &&
    files["template.js"].includes("render: render");
  checks.push({
    id: "runtime-api",
    group: "runtime",
    level: hasRenderApi ? "pass" : "fail",
    message: "template.js exposes window.ZCardTemplate.render(data)",
  });
  checks.push({
    id: "runtime-data",
    group: "runtime",
    level: files["template.js"].includes("window.ZCARD_DATA") ? "pass" : "fail",
    message: "Runtime consumes window.ZCARD_DATA",
  });
  const fieldCount = usedFields(template).length;
  checks.push({
    id: "runtime-fields",
    group: "runtime",
    level: fieldCount > 0 ? "pass" : "fail",
    message: `${fieldCount} contract fields used by this design`,
  });

  // Security
  checks.push({
    id: "security-innerhtml",
    group: "security",
    level: /\.innerHTML\s*=/.test(files["template.js"]) ? "fail" : "pass",
    message: "Runtime never assigns user content through innerHTML",
  });
  checks.push({
    id: "security-urls",
    group: "security",
    level: files["template.js"].includes("SAFE_SCHEMES") ? "pass" : "warn",
    message: "URLs are scheme-checked before being rendered",
  });

  return {
    checks,
    ok: checks.every((c) => c.level !== "fail"),
    warnings: checks.filter((c) => c.level === "warn").length,
  };
}

function hasValue(value: unknown) {
  if (value === null || value === undefined) return false;
  if (typeof value === "string") return value.trim() !== "";
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === "boolean") return value === true;
  return true;
}

export interface PayloadCheck {
  valid: boolean;
  error?: string | undefined;
  unknownKeys: string[];
  missingRequired: string[];
  data?: Record<string, unknown> | undefined;
}

/** Validates a pasted JSON payload against the selected card type contract. */
export function validatePayload(raw: string, template: TemplateRecord): PayloadCheck {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    return { valid: false, error: String(error), unknownKeys: [], missingRequired: [] };
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    return {
      valid: false,
      error: "Payload must be a JSON object of contract fields.",
      unknownKeys: [],
      missingRequired: [],
    };
  }
  const data = parsed as Record<string, unknown>;
  const allowed = allowedKeys(template);
  const unknownKeys = Object.keys(data).filter((k) => !allowed.has(k));
  const missingRequired = usageBuckets(template).required.filter((k) => !hasValue(data[k]));
  return { valid: true, unknownKeys, missingRequired, data };
}

/* ---------------------------------------------------------------- assets --- */

const IMAGE_LIKE = /\.(png|jpe?g|webp|gif|avif|svg)(\?|$)|images\.unsplash\.com|__l5e\/assets/i;

/** Flat list of image-looking values in demo data, keyed by their dotted path. */
export function collectImageRefs(
  data: Record<string, unknown>,
): { key: string; value: string }[] {
  const out: { key: string; value: string }[] = [];
  const walk = (value: unknown, path: string) => {
    if (typeof value === "string") {
      if (value.startsWith("data:image/") || IMAGE_LIKE.test(value)) out.push({ key: path, value });
      return;
    }
    if (Array.isArray(value)) {
      value.forEach((item, i) => walk(item, `${path}[${i}]`));
      return;
    }
    if (value && typeof value === "object") {
      for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
        walk(v, path ? `${path}.${k}` : k);
      }
    }
  };
  walk(data, "");
  return out;
}

/** True when the exporter can fetch this reference and rewrite it to assets/. */
export function isLocalizableImage(value: string) {
  return (
    /^https?:\/\//i.test(value) ||
    value.startsWith("data:image/") ||
    /* root-relative CDN asset paths resolve against the app origin at export time */
    value.startsWith("/") ||
    value.startsWith("assets/")
  );
}

export const ASSET_VARIANT_LABELS = ["thumb", "medium", "large"] as const;

/** Mirrors the exporter's naming so validation can dry-run the manifest asset map. */
export function planAssetManifest(urls: string[]) {
  const packaged = new Set<string>();
  const seen = new Map<string, number>();
  const images = urls
    .filter((url) => {
      if (seen.has(url)) return false;
      seen.set(url, seen.size + 1);
      return true;
    })
    .map((url) => {
      const base = `image-${String(seen.get(url)).padStart(2, "0")}`;
      const fallback = `assets/${base}.jpg`;
      const file = `assets/${base}.webp`;
      packaged.add(fallback);
      packaged.add(file);
      const variants: Record<string, { webp: string; jpg: string }> = {};
      for (const label of ASSET_VARIANT_LABELS) {
        const jpg = `assets/${base}-${label}.jpg`;
        const webp = `assets/${base}-${label}.webp`;
        packaged.add(jpg);
        packaged.add(webp);
        variants[label] = { webp, jpg };
      }
      return { source: url, file, fallback, variants };
    });
  return {
    manifest: {
      assets: { folder: "assets/", preferred_format: "webp", fallback_format: "jpg", images },
    } as Record<string, unknown>,
    packaged,
  };
}

/**
 * Checks that every asset path referenced by manifest.json exists in the package,
 * and that each responsive step keeps a JPG fallback next to its WebP.
 */
export function validateAssetManifest(
  manifest: Record<string, unknown>,
  packaged: Set<string> | string[],
): CheckResult[] {
  const present = packaged instanceof Set ? packaged : new Set(packaged);
  const issues: CheckResult[] = [];
  const section = manifest["assets"] as
    | { images?: { source?: string; file?: string; fallback?: string; variants?: Record<string, { webp?: string; jpg?: string }> }[] }
    | undefined;
  if (!section || !Array.isArray(section.images)) return issues;

  const missing: FieldIssue[] = [];
  const noFallback: FieldIssue[] = [];

  section.images.forEach((entry, index) => {
    const id = entry.source ?? `image[${index}]`;
    const check = (path: string | undefined, what: string) => {
      if (!path) return;
      if (!present.has(path)) {
        missing.push({
          key: path,
          reason: `manifest.json references ${what} "${path}" but that file is not in the package`,
          hint: "Re-export the template so the assets folder and manifest are regenerated together.",
        });
      }
    };
    check(entry.file, "preferred image");
    check(entry.fallback, "fallback image");
    if (!entry.fallback) {
      noFallback.push({
        key: id,
        reason: "asset entry has no JPG fallback",
        hint: "Every WebP asset must ship a JPG fallback for clients without WebP support.",
      });
    }
    for (const [label, pair] of Object.entries(entry.variants ?? {})) {
      check(pair.webp, `${label} WebP variant`);
      check(pair.jpg, `${label} JPG variant`);
      if (pair.webp && !pair.jpg) {
        noFallback.push({
          key: `${id} · ${label}`,
          reason: `${label} variant has a WebP file but no JPG fallback`,
          hint: "Keep the JPG variant alongside the WebP one.",
        });
      }
    }
  });

  if (missing.length) {
    issues.push({
      id: "assets-missing-files",
      group: "manifest",
      level: "fail",
      message: `${missing.length} asset reference(s) in manifest.json do not exist in assets/`,
      detail: missing.map((m) => m.key).join(", "),
      fields: missing,
    });
  }
  if (noFallback.length) {
    issues.push({
      id: "assets-missing-fallback",
      group: "manifest",
      level: "fail",
      message: `${noFallback.length} asset entr(ies) are missing a JPG fallback`,
      detail: noFallback.map((m) => m.key).join(", "),
      fields: noFallback,
    });
  }
  return issues;
}
