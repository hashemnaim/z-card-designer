import { describe, expect, it } from "vitest";
import { CARD_TYPES, getContract, type CardType } from "@/contracts";
import { allowedKeys, validatePayload, validateTemplate } from "@/builder/validate";
import { generateDemoData, REAL_ESTATE_LUXURY_EXTRAS } from "@/builder/demo-data";
import { generateFiles, usageBuckets } from "@/builder/runtime/generate";
import { themeForStyle, type FieldUsage, type TemplateRecord } from "@/builder/types";

/** Builds a template record without touching localStorage (store.ts is browser-only). */
function makeTemplate(cardType: CardType, overrides: Partial<TemplateRecord> = {}): TemplateRecord {
  const contract = getContract(cardType);
  const fieldUsage: Record<string, FieldUsage> = {};
  for (const field of contract.fields) {
    fieldUsage[field.key] = field.is_required ? "required" : "recommended";
  }
  const now = new Date("2026-01-01T00:00:00.000Z").toISOString();
  return {
    id: `${cardType}-test-v1`,
    slug: `${cardType}-test`,
    name: `${cardType} test`,
    version: "1.0.0",
    cardType,
    schemaVersion: contract.schema_version,
    styleDescription: "Luxury minimal card",
    reference: {},
    direction: "auto",
    languages: ["en", "ar"],
    fieldUsage,
    sectionOrder: contract.sections.map((s) => s.id),
    hiddenSections: [],
    theme: themeForStyle("Luxury"),
    demoData: generateDemoData(cardType, fieldUsage),
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

function failures(template: TemplateRecord) {
  return validateTemplate(template).checks.filter((c) => c.level === "fail");
}

describe("validateTemplate — regression guard", () => {
  for (const cardType of CARD_TYPES) {
    it(`${cardType}: default demo data has zero blocking failures`, () => {
      const report = validateTemplate(makeTemplate(cardType));
      const failed = report.checks.filter((c) => c.level === "fail");
      expect(failed.map((c) => `${c.id}: ${c.detail ?? ""}`)).toEqual([]);
      expect(report.ok).toBe(true);
    });
  }
});

describe("design-specific keys", () => {
  const template = makeTemplate("real-estate");

  it("accepts luxury real-estate layout extras as allowed keys", () => {
    const allowed = allowedKeys(template);
    for (const key of Object.keys(REAL_ESTATE_LUXURY_EXTRAS)) {
      expect(allowed.has(key), `${key} should be allowed`).toBe(true);
    }
  });

  it("does not report layout extras as unknown demo keys", () => {
    const check = validateTemplate(template).checks.find((c) => c.id === "demo-keys");
    expect(check?.level).toBe("pass");
    expect(check?.fields ?? []).toEqual([]);
  });

  it("layout extras are not allowed for other card types", () => {
    const allowed = allowedKeys(makeTemplate("personal"));
    expect(allowed.has("verified_badge")).toBe(false);
  });
});

describe("field-level failure reporting", () => {
  it("names an invented key with a reason and a hint", () => {
    const base = makeTemplate("personal");
    const template = makeTemplate("personal", {
      demoData: { ...base.demoData, totally_made_up: "nope" },
    });
    const check = failures(template).find((c) => c.id === "demo-keys");
    expect(check).toBeDefined();
    const issue = check?.fields?.find((f) => f.key === "totally_made_up");
    expect(issue?.reason).toContain("totally_made_up");
    expect(issue?.hint).toBeTruthy();
  });

  it("names a required field that has no demo value", () => {
    const base = makeTemplate("personal");
    const requiredKey = usageBuckets(base).required[0]!;
    const demoData = { ...base.demoData, [requiredKey]: "" };
    const check = failures(makeTemplate("personal", { demoData })).find(
      (c) => c.id === "demo-required",
    );
    expect(check?.fields?.map((f) => f.key)).toContain(requiredKey);
  });

  it("warns when a contract-required field is unused by the design", () => {
    const base = makeTemplate("personal");
    const contractRequired = getContract("personal").field_usage.required[0]!;
    const fieldUsage = { ...base.fieldUsage, [contractRequired]: "unused" as FieldUsage };
    const report = validateTemplate(makeTemplate("personal", { fieldUsage }));
    const check = report.checks.find((c) => c.id === "contract-required-used");
    expect(check?.level).toBe("warn");
    expect(check?.fields?.map((f) => f.key)).toContain(contractRequired);
  });

  it("fails a non-semantic version", () => {
    const check = failures(makeTemplate("cars", { version: "1.0" })).find(
      (c) => c.id === "manifest-version",
    );
    expect(check).toBeDefined();
  });
});

describe("validatePayload", () => {
  const template = makeTemplate("cars");

  it("rejects invalid JSON", () => {
    const result = validatePayload("{ nope", template);
    expect(result.valid).toBe(false);
    expect(result.error).toBeTruthy();
  });

  it("rejects a non-object payload", () => {
    expect(validatePayload("[1,2]", template).valid).toBe(false);
  });

  it("reports unknown keys and missing required keys", () => {
    const requiredKey = usageBuckets(template).required[0]!;
    const payload = { ...template.demoData, invented_key: 1, [requiredKey]: "" };
    const result = validatePayload(JSON.stringify(payload), template);
    expect(result.valid).toBe(true);
    expect(result.unknownKeys).toContain("invented_key");
    expect(result.missingRequired).toContain(requiredKey);
  });

  it("accepts the generated demo payload as-is", () => {
    const result = validatePayload(JSON.stringify(template.demoData), template);
    expect(result.unknownKeys).toEqual([]);
    expect(result.missingRequired).toEqual([]);
  });
});

describe("generated package contract", () => {
  for (const cardType of CARD_TYPES) {
    it(`${cardType}: runtime API and demo file name are stable`, () => {
      const files = generateFiles(makeTemplate(cardType));
      expect(files.demoFileName).toBe("demo.json");
      expect(files["template.js"]).toContain("window.ZCardTemplate");
      expect(files["template.js"]).toContain("render: render");
      expect(files["template.js"]).toContain("window.ZCARD_DATA");
      expect(files["template.js"]).not.toMatch(/\.innerHTML\s*=/);
      expect(() => JSON.parse(files.demoJson)).not.toThrow();
      expect(() => JSON.parse(files["manifest.json"])).not.toThrow();
    });
  }
});
