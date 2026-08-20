import { getContract, type CardType } from "@/contracts";
import { generateDemoData } from "./demo-data";
import { themeForStyle, type Direction, type FieldUsage, type TemplateRecord } from "./types";

const KEY = "zcard.template-builder.v1";

interface StoreShape {
  version: 1;
  templates: TemplateRecord[];
}

function read(): StoreShape {
  if (typeof window === "undefined") return { version: 1, templates: [] };
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return { version: 1, templates: [] };
    const parsed = JSON.parse(raw) as StoreShape;
    if (!parsed || !Array.isArray(parsed.templates)) return { version: 1, templates: [] };
    return { version: 1, templates: parsed.templates };
  } catch {
    return { version: 1, templates: [] };
  }
}

function write(shape: StoreShape) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(shape));
  window.dispatchEvent(new Event("zcard-store-change"));
}

export function listTemplates(): TemplateRecord[] {
  return read().templates.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function getTemplate(id: string): TemplateRecord | undefined {
  return read().templates.find((t) => t.id === id);
}

export function saveTemplate(template: TemplateRecord) {
  const store = read();
  const next = { ...template, updatedAt: new Date().toISOString() };
  const index = store.templates.findIndex((t) => t.id === template.id);
  if (index >= 0) store.templates[index] = next;
  else store.templates.push(next);
  write(store);
  return next;
}

export function deleteTemplate(id: string) {
  const store = read();
  write({ version: 1, templates: store.templates.filter((t) => t.id !== id) });
}

export function idExists(id: string) {
  return read().templates.some((t) => t.id === id);
}

export function uniqueId(base: string) {
  if (!idExists(base)) return base;
  let n = 2;
  while (idExists(`${base}-${n}`)) n += 1;
  return `${base}-${n}`;
}

export function duplicateTemplate(id: string): TemplateRecord | undefined {
  const source = getTemplate(id);
  if (!source) return undefined;
  const bumped = bumpVersionId(source.id);
  const newId = uniqueId(bumped);
  const copy: TemplateRecord = {
    ...source,
    id: newId,
    name: `${source.name} Copy`,
    slug: newId.replace(/-v\d+$/, ""),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  return saveTemplate(copy);
}

function bumpVersionId(id: string) {
  const match = id.match(/^(.*)-v(\d+)$/);
  if (!match) return `${id}-v2`;
  return `${match[1]}-v${Number(match[2]) + 1}`;
}

export interface DraftInput {
  cardType: CardType;
  name: string;
  id: string;
  slug: string;
  version: string;
  style: string;
  styleDescription: string;
  direction: Direction;
  languages: string[];
  fieldUsage: Record<string, FieldUsage>;
  reference: TemplateRecord["reference"];
  theme?: TemplateRecord["theme"];
}

export function createTemplate(input: DraftInput): TemplateRecord {
  const contract = getContract(input.cardType);
  const record: TemplateRecord = {
    id: uniqueId(input.id),
    slug: input.slug,
    name: input.name,
    version: input.version || "1.0.0",
    cardType: input.cardType,
    schemaVersion: contract.schema_version,
    styleDescription: input.styleDescription,
    reference: input.reference,
    direction: input.direction,
    languages: input.languages,
    fieldUsage: input.fieldUsage,
    sectionOrder: contract.sections.map((s) => s.id),
    hiddenSections: [],
    theme: input.theme ?? themeForStyle(input.style),
    demoData: generateDemoData(input.cardType, input.fieldUsage),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  return saveTemplate(record);
}

/** Default usage: contract-required -> required, everything else -> recommended. */
export function defaultFieldUsage(cardType: CardType): Record<string, FieldUsage> {
  const contract = getContract(cardType);
  const usage: Record<string, FieldUsage> = {};
  for (const field of contract.fields) {
    usage[field.key] = field.is_required ? "required" : "recommended";
  }
  return usage;
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
