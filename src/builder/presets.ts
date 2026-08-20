import { getContract } from "@/contracts";
import { generateDemoData } from "./demo-data";
import { DEFAULT_THEME, type FieldUsage, type TemplateRecord, type ThemeConfig } from "./types";

/** Shared luxury Z Card tokens (white canvas, #F8F8F8 cards, gold accent, 28px radii). */
export const LUXURY_THEME: ThemeConfig = {
  ...DEFAULT_THEME,
  style: "Luxury",
  background: "#ffffff",
  surface: "#f8f8f8",
  text: "#111111",
  muted: "#777777",
  accent: "#d4af37",
  accentText: "#111111",
  border: "#ececec",
  headingFont: "'Playfair Display', Georgia, serif",
  bodyFont: "'Inter', system-ui, sans-serif",
  radius: 28,
  density: "roomy",
  heroStyle: "cover",
  contactStyle: "floating",
  uppercaseLabels: false,
};

/** Every contract field is rendered by the luxury layouts; required stays required. */
function luxuryFieldUsage(cardType: "cars" | "real-estate"): Record<string, FieldUsage> {
  const contract = getContract(cardType);
  const usage: Record<string, FieldUsage> = {};
  for (const field of contract.fields) {
    usage[field.key] = field.is_required ? "required" : "recommended";
  }
  return usage;
}

const STAMP = "2026-01-01T00:00:00.000Z";

/** Built-in luxury automotive card, always available in the library. */
export function carsLuxuryPreset(): TemplateRecord {
  const contract = getContract("cars");
  const fieldUsage = luxuryFieldUsage("cars");
  return {
    id: "cars-luxury-v1",
    slug: "cars-luxury",
    name: "Cars Luxury",
    version: "1.0.0",
    cardType: "cars",
    schemaVersion: contract.schema_version,
    styleDescription:
      "Premium automotive digital card: white canvas, soft #F8F8F8 cards, luxury gold accent, collapsing hero into a glass-blur sticky header, floating action bar and single-open accordions.",
    reference: { notes: "Apple / Porsche Configurator / Linear / Airbnb inspired." },
    direction: "ltr",
    languages: ["en", "ar"],
    fieldUsage,
    sectionOrder: contract.sections.map((s) => s.id),
    hiddenSections: [],
    theme: LUXURY_THEME,
    demoData: generateDemoData("cars", fieldUsage),
    createdAt: STAMP,
    updatedAt: STAMP,
  };
}

/** Presets seeded into the library so every card type ships with a reference design. */
export function builtInPresets(): TemplateRecord[] {
  return [carsLuxuryPreset()];
}
