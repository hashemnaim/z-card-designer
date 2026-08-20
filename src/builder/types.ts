import type { CardType } from "@/contracts";

export type FieldUsage = "required" | "recommended" | "optional" | "unused";

export type Direction = "rtl" | "ltr" | "both" | "auto";

export interface ThemeConfig {
  style: string;
  /** hex colors — kept as plain hex because they are emitted into standalone CSS */
  background: string;
  surface: string;
  text: string;
  muted: string;
  accent: string;
  accentText: string;
  border: string;
  headingFont: string;
  bodyFont: string;
  radius: number;
  density: "compact" | "regular" | "roomy";
  heroStyle: "cover" | "portrait" | "framed" | "none";
  contactStyle: "floating" | "inline" | "list";
  /** how the hero image fills its frame */
  heroImageFit?: "cover" | "contain";
  /** vertical focal point used when the hero image is cropped */
  heroImageFocus?: "top" | "center" | "bottom";
  /** extra scale applied to the hero image (1 = no zoom) */
  heroImageZoom?: number;
  uppercaseLabels: boolean;

}

export interface TemplateReference {
  imageDataUrl?: string | undefined;
  url?: string | undefined;
  notes?: string | undefined;
}

export interface TemplateRecord {
  id: string;
  slug: string;
  name: string;
  version: string;
  cardType: CardType;
  schemaVersion: string;
  styleDescription: string;
  reference: TemplateReference;
  direction: Direction;
  languages: string[];
  /** key -> usage; keys are official contract API keys, never renamed */
  fieldUsage: Record<string, FieldUsage>;
  /** ordered section ids that this design renders */
  sectionOrder: string[];
  hiddenSections: string[];
  theme: ThemeConfig;
  demoData: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export const STYLE_PRESETS = [
  "Luxury",
  "Minimal",
  "Modern",
  "Premium",
  "Corporate",
  "Elegant",
  "Dark",
  "Light",
  "Editorial",
  "Bold",
  "Futuristic",
  "Clean",
] as const;

export const PRESET_THEMES: Record<string, Partial<ThemeConfig>> = {
  Luxury: {
    background: "#0b0b0c",
    surface: "#141416",
    text: "#f5f1e8",
    muted: "#a3a09a",
    accent: "#c9a227",
    accentText: "#12100a",
    border: "#26262a",
    headingFont: "'Playfair Display', Georgia, serif",
    radius: 18,
    density: "roomy",
    heroStyle: "cover",
    uppercaseLabels: true,
  },
  Minimal: {
    background: "#ffffff",
    surface: "#f6f6f6",
    text: "#111111",
    muted: "#6b7280",
    accent: "#111111",
    accentText: "#ffffff",
    border: "#e5e5e5",
    radius: 10,
    density: "compact",
    heroStyle: "framed",
  },
  Modern: {
    background: "#ffffff",
    surface: "#f2f5ff",
    text: "#0f172a",
    muted: "#5b6478",
    accent: "#2f6bff",
    accentText: "#ffffff",
    border: "#e2e8f5",
    radius: 20,
    heroStyle: "cover",
  },
  Premium: {
    background: "#0f1115",
    surface: "#171a21",
    text: "#f2f4f8",
    muted: "#9aa3b2",
    accent: "#e7c66b",
    accentText: "#14161b",
    border: "#242833",
    radius: 22,
    density: "roomy",
    heroStyle: "cover",
  },
  Corporate: {
    background: "#ffffff",
    surface: "#f4f6f8",
    text: "#101828",
    muted: "#5f6b7a",
    accent: "#0b4a8f",
    accentText: "#ffffff",
    border: "#dde3ea",
    radius: 8,
    heroStyle: "framed",
    contactStyle: "list",
  },
  Elegant: {
    background: "#fbf8f4",
    surface: "#ffffff",
    text: "#231f1b",
    muted: "#7a7168",
    accent: "#8a6b4a",
    accentText: "#ffffff",
    border: "#eae2d8",
    headingFont: "'Cormorant Garamond', Georgia, serif",
    radius: 16,
    density: "roomy",
  },
  Dark: {
    background: "#0a0a0a",
    surface: "#141414",
    text: "#fafafa",
    muted: "#9c9c9c",
    accent: "#ffffff",
    accentText: "#0a0a0a",
    border: "#232323",
    radius: 14,
  },
  Light: {
    background: "#ffffff",
    surface: "#fafafa",
    text: "#141414",
    muted: "#707070",
    accent: "#1f6feb",
    accentText: "#ffffff",
    border: "#ececec",
    radius: 14,
  },
  Editorial: {
    background: "#fffdf8",
    surface: "#f6f1e7",
    text: "#1a1a1a",
    muted: "#6e6a62",
    accent: "#b3271e",
    accentText: "#ffffff",
    headingFont: "'Libre Baskerville', Georgia, serif",
    radius: 4,
    density: "roomy",
    heroStyle: "portrait",
    uppercaseLabels: true,
  },
  Bold: {
    background: "#111111",
    surface: "#1d1d1d",
    text: "#ffffff",
    muted: "#b0b0b0",
    accent: "#ff4d1c",
    accentText: "#ffffff",
    border: "#2b2b2b",
    radius: 6,
    heroStyle: "cover",
    uppercaseLabels: true,
  },
  Futuristic: {
    background: "#05070d",
    surface: "#0d1220",
    text: "#e6f1ff",
    muted: "#8798b5",
    accent: "#35e0d0",
    accentText: "#04131a",
    border: "#1a2437",
    radius: 26,
    heroStyle: "cover",
  },
  Clean: {
    background: "#ffffff",
    surface: "#f7f9fa",
    text: "#15202b",
    muted: "#657786",
    accent: "#12a594",
    accentText: "#ffffff",
    border: "#e6ecf0",
    radius: 12,
  },
};

export const DEFAULT_THEME: ThemeConfig = {
  style: "Modern",
  background: "#ffffff",
  surface: "#f5f5f5",
  text: "#111111",
  muted: "#6b7280",
  accent: "#2f6bff",
  accentText: "#ffffff",
  border: "#e5e7eb",
  headingFont: "'Inter', system-ui, sans-serif",
  bodyFont: "'Inter', system-ui, sans-serif",
  radius: 16,
  density: "regular",
  heroStyle: "cover",
  contactStyle: "floating",
  heroImageFit: "cover",
  heroImageFocus: "center",
  heroImageZoom: 1,
  uppercaseLabels: false,
};


export function themeForStyle(style: string): ThemeConfig {
  return { ...DEFAULT_THEME, style, ...(PRESET_THEMES[style] ?? {}) };
}
