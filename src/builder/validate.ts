import { contractKeys, getContract } from "@/contracts";
import type { TemplateRecord } from "./types";
import {
  generateFiles,
  generateManifest,
  humanize,
  isLuxuryRealEstate,
  usageBuckets,
  usedFields,
} from "./runtime/generate";
import { REAL_ESTATE_LUXURY_EXTRAS } from "./demo-data";

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
