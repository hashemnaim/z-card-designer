import runtimeSource from "./template-runtime.js?raw";
import luxuryRuntimeSource from "./real-estate-luxury.js?raw";
import carsRuntimeSource from "./cars-luxury.js?raw";
import { generateRealEstateLuxuryCss } from "./real-estate-luxury-css";
import { generateCarsLuxuryCss } from "./cars-luxury-css";
import { getContract, SECTION_LABELS, type ContractField } from "@/contracts";
import type { TemplateRecord } from "../types";

/** The real-estate card type ships the dedicated luxury mobile-card layout. */
export function isLuxuryRealEstate(template: TemplateRecord): boolean {
  return template.cardType === "real-estate";
}

/** The cars card type ships the dedicated luxury automotive mobile-card layout. */
export function isLuxuryCars(template: TemplateRecord): boolean {
  return template.cardType === "cars";
}


export interface GeneratedFiles {
  "index.html": string;
  "styles.css": string;
  "template.js": string;
  "manifest.json": string;
  demoFileName: string;
  demoJson: string;
}

const HERO_PRIMARY: Record<
  string,
  { image?: string; fallbackGallery?: string; title?: string; subtitle: string[]; badges: string[] }
> = {
  personal: {
    fallbackGallery: "gallery_images",
    title: "full_name",
    subtitle: ["job_title", "company_name"],
    badges: [],
  },
  "real-estate": {
    fallbackGallery: "gallery_images",
    title: "property_name",
    subtitle: ["property_type", "city"],
    badges: ["ready_to_move"],
  },
  cars: {
    image: "featured_image",
    fallbackGallery: "gallery_images",
    title: "title",
    subtitle: ["brand", "model"],
    badges: ["verified"],
  },
};

export function usedFields(template: TemplateRecord): ContractField[] {
  const contract = getContract(template.cardType);
  return contract.fields.filter((f) => (template.fieldUsage[f.key] ?? "unused") !== "unused");
}

export function usageBuckets(template: TemplateRecord) {
  const buckets = { required: [] as string[], recommended: [] as string[], optional: [] as string[] };
  for (const field of usedFields(template)) {
    const usage = template.fieldUsage[field.key];
    if (usage === "required") buckets.required.push(field.key);
    else if (usage === "recommended") buckets.recommended.push(field.key);
    else buckets.optional.push(field.key);
  }
  return buckets;
}

export function buildRuntimeConfig(template: TemplateRecord) {
  const contract = getContract(template.cardType);
  const used = new Set(usedFields(template).map((f) => f.key));
  const order = template.sectionOrder.length
    ? template.sectionOrder
    : contract.sections.map((s) => s.id);

  const sections = order
    .filter((id) => !template.hiddenSections.includes(id))
    .map((id) => {
      const section = contract.sections.find((s) => s.id === id);
      const fields = (section?.fields ?? [])
        .filter((key) => used.has(key))
        .map((key) => contract.fields.find((f) => f.key === key))
        .filter((f): f is ContractField => Boolean(f))
        .map((f) => ({
          key: f.key,
          type: f.type,
          label: { ar: f.name, en: humanize(f.key) },
        }));
      return {
        id,
        label: SECTION_LABELS[id] ?? { en: humanize(id), ar: id },
        fields,
      };
    })
    .filter((s) => s.fields.length > 0);

  const primary = HERO_PRIMARY[template.cardType];
  return {
    id: template.id,
    cardType: template.cardType,
    schemaVersion: template.schemaVersion,
    direction: template.direction === "auto" ? "rtl" : template.direction === "both" ? "rtl" : template.direction,
    heroStyle: template.theme.heroStyle,
    contactStyle: template.theme.contactStyle,
    primary: primary
      ? {
          image: primary.image && used.has(primary.image) ? primary.image : undefined,
          fallbackGallery:
            primary.fallbackGallery && used.has(primary.fallbackGallery)
              ? primary.fallbackGallery
              : undefined,
          title: primary.title && used.has(primary.title) ? primary.title : undefined,
          subtitle: primary.subtitle.filter((k) => used.has(k)),
          badges: primary.badges.filter((k) => used.has(k)),
        }
      : { subtitle: [], badges: [] },
    sections,
  };
}

export function humanize(key: string): string {
  return key
    .replace(/_/g, " ")
    .replace(/\burl\b/gi, "")
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function densityScale(density: TemplateRecord["theme"]["density"]) {
  if (density === "compact") return { gap: 12, pad: 14, section: 18 };
  if (density === "roomy") return { gap: 22, pad: 24, section: 34 };
  return { gap: 16, pad: 18, section: 26 };
}

export function generateCss(template: TemplateRecord): string {
  if (isLuxuryRealEstate(template)) return generateRealEstateLuxuryCss(template);
  if (isLuxuryCars(template)) return generateCarsLuxuryCss(template);

  const t = template.theme;
  const d = densityScale(t.density);
  return `/* ${template.id} — Z Card template styles (standalone) */
:root {
  --zc-bg: ${t.background};
  --zc-surface: ${t.surface};
  --zc-text: ${t.text};
  --zc-muted: ${t.muted};
  --zc-accent: ${t.accent};
  --zc-accent-text: ${t.accentText};
  --zc-border: ${t.border};
  --zc-radius: ${t.radius}px;
  --zc-gap: ${d.gap}px;
  --zc-pad: ${d.pad}px;
  --zc-section-gap: ${d.section}px;
  --zc-heading-font: ${t.headingFont};
  --zc-body-font: ${t.bodyFont};
}

* { box-sizing: border-box; }
html, body { margin: 0; padding: 0; background: var(--zc-bg); }
body { font-family: var(--zc-body-font); color: var(--zc-text); -webkit-font-smoothing: antialiased; }

.zc-root { max-width: 480px; margin: 0 auto; padding: 0 0 48px; background: var(--zc-bg); }
.zc-card { display: flex; flex-direction: column; gap: var(--zc-section-gap); }

.zc-hero { position: relative; display: flex; flex-direction: column; gap: var(--zc-gap); }
.zc-hero__media { width: 100%; display: block; object-fit: cover; }
.zc-hero--cover .zc-hero__media { height: 320px; }
.zc-hero--portrait .zc-hero__media { height: 420px; }
.zc-hero--framed { padding: var(--zc-pad); }
.zc-hero--framed .zc-hero__media { height: 260px; border-radius: var(--zc-radius); }
.zc-hero__text { padding: 0 var(--zc-pad); display: flex; flex-direction: column; gap: 6px; }
.zc-hero__title { font-family: var(--zc-heading-font); font-size: 30px; line-height: 1.15; margin: 0; letter-spacing: -0.01em; }
.zc-hero__subtitle { margin: 0; color: var(--zc-muted); font-size: 15px; }
.zc-badge { align-self: flex-start; margin-top: 6px; background: var(--zc-accent); color: var(--zc-accent-text); border-radius: 999px; padding: 3px 10px; font-size: 11px; letter-spacing: 0.04em; }

.zc-section { padding: 0 var(--zc-pad); display: flex; flex-direction: column; gap: var(--zc-gap); }
.zc-section__title { font-family: var(--zc-heading-font); font-size: 13px; margin: 0; color: var(--zc-muted); ${
    t.uppercaseLabels ? "text-transform: uppercase; letter-spacing: 0.12em;" : "letter-spacing: 0.02em;"
  } }
.zc-section__body { display: flex; flex-direction: column; gap: var(--zc-gap); }

.zc-paragraph { margin: 0; font-size: 15px; line-height: 1.75; color: var(--zc-text); }
.zc-image { width: 100%; border-radius: var(--zc-radius); display: block; }

.zc-gallery { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; }
.zc-gallery__cell { overflow: hidden; border-radius: var(--zc-radius); background: var(--zc-surface); aspect-ratio: 4 / 3; }
.zc-gallery__img { width: 100%; height: 100%; object-fit: cover; display: block; }

.zc-specs { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; }
.zc-specs__item { background: var(--zc-surface); border: 1px solid var(--zc-border); border-radius: var(--zc-radius); padding: 10px 12px; display: flex; flex-direction: column; gap: 3px; }
.zc-label { font-size: 11px; color: var(--zc-muted); ${
    t.uppercaseLabels ? "text-transform: uppercase; letter-spacing: 0.08em;" : ""
  } }
.zc-value { font-size: 15px; font-weight: 600; }

.zc-flags { display: flex; flex-wrap: wrap; gap: 6px; }
.zc-chip { border: 1px solid var(--zc-border); background: var(--zc-surface); border-radius: 999px; padding: 5px 11px; font-size: 12px; }

.zc-btn { display: inline-flex; align-items: center; justify-content: center; gap: 6px; text-decoration: none; color: var(--zc-text); border: 1px solid var(--zc-border); background: var(--zc-surface); border-radius: var(--zc-radius); padding: 12px 16px; font-size: 14px; font-weight: 600; }
.zc-btn--accent { background: var(--zc-accent); color: var(--zc-accent-text); border-color: transparent; }

.zc-contact { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; }
.zc-contact--list { grid-template-columns: 1fr; }
.zc-contact--floating { position: sticky; bottom: 12px; z-index: 5; padding: 8px; background: color-mix(in oklab, var(--zc-bg) 88%, transparent); backdrop-filter: blur(10px); border-radius: calc(var(--zc-radius) + 6px); border: 1px solid var(--zc-border); }
.zc-contact__meta { display: flex; flex-direction: column; gap: 2px; padding: 10px 12px; border: 1px solid var(--zc-border); border-radius: var(--zc-radius); }

.zc-social { display: flex; flex-wrap: wrap; gap: 8px; }
.zc-social__item { width: 40px; height: 40px; display: inline-flex; align-items: center; justify-content: center; border-radius: 999px; border: 1px solid var(--zc-border); background: var(--zc-surface); color: var(--zc-text); text-decoration: none; font-size: 14px; font-weight: 700; }

.zc-video .zc-btn { width: 100%; }

[dir="rtl"] .zc-hero__title, [dir="rtl"] .zc-paragraph { text-align: right; }
[dir="ltr"] .zc-hero__title, [dir="ltr"] .zc-paragraph { text-align: left; }
`;
}

export function generateTemplateJs(template: TemplateRecord): string {
  const config = buildRuntimeConfig(template);
  const luxury = isLuxuryRealEstate(template);
  const cars = isLuxuryCars(template);
  const source = luxury ? luxuryRuntimeSource : cars ? carsRuntimeSource : runtimeSource;
  const payload =
    luxury || cars
      ? {
          ...config,
          layout: luxury ? "real-estate-luxury" : "cars-luxury",
          ctaUrl: "https://zcard.app",
        }
      : config;

  return `/* ${template.id} — Z Card standalone renderer. Generated by Z Card Template Builder. */
var ZC_CONFIG = ${JSON.stringify(payload, null, 2)};

${source}`;
}

const FONT_LINKS = `    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Playfair+Display:wght@500;600;700&display=swap"
      rel="stylesheet"
    />`;

export function generateIndexHtml(template: TemplateRecord): string {
  const dir = template.direction === "ltr" ? "ltr" : "rtl";
  const lang = dir === "ltr" ? "en" : "ar";
  return `<!doctype html>
<html lang="${lang}" dir="${dir}">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(template.name)}</title>
${FONT_LINKS}
    <link rel="stylesheet" href="styles.css" />
  </head>
  <body>
    <div id="zcard-root"></div>
    <script>
      // Z Card Admin injects production data here:
      // window.ZCARD_DATA = CARD_DATA_FROM_API;
      window.ZCARD_DATA = window.ZCARD_DATA || null;
    </script>
    <script src="template.js"></script>
  </body>
</html>
`;
}

export function generateManifest(template: TemplateRecord) {
  const buckets = usageBuckets(template);
  return {
    id: template.id,
    slug: template.slug,
    name: template.name,
    version: template.version,
    card_type: template.cardType,
    schema_version: template.schemaVersion,
    entry: "index.html",
    style: "styles.css",
    script: "template.js",
    demo_data: "demo.json",
    supports: {
      rtl: template.direction !== "ltr",
      ltr: template.direction !== "rtl",
      languages: template.languages,
    },
    field_usage: buckets,
    style_direction: template.theme.style,
    generated_by: "z-card-template-builder",
    generated_at: new Date().toISOString(),
  };
}

export function generateFiles(template: TemplateRecord): GeneratedFiles {
  return {
    "index.html": generateIndexHtml(template),
    "styles.css": generateCss(template),
    "template.js": generateTemplateJs(template),
    "manifest.json": JSON.stringify(generateManifest(template), null, 2),
    demoFileName: "demo.json",
    demoJson: JSON.stringify(template.demoData, null, 2),
  };
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] as string,
  );
}

/** Single-file preview document used by the live preview iframe. */
export function generatePreviewDocument(
  template: TemplateRecord,
  data: Record<string, unknown>,
): string {
  return `<!doctype html>
<html lang="${template.direction === "ltr" ? "en" : "ar"}" dir="${template.direction === "ltr" ? "ltr" : "rtl"}">
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" />
${FONT_LINKS}
<style>${generateCss(template)}</style></head>
<body><div id="zcard-root"></div>
<script>window.ZCARD_DATA = ${JSON.stringify(data).replace(/</g, "\\u003c")};</script>
<script>${generateTemplateJs(template).replace(/<\/script>/gi, "<\\/script>")}</script>
</body></html>`;
}
