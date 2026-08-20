import { describe, expect, it } from "vitest";
import { CARD_TYPES, getContract, type CardType } from "@/contracts";
import { allowedKeys, validatePayload, validateTemplate } from "@/builder/validate";
import {
  CARS_LUXURY_EXTRAS,
  generateDemoData,
  REAL_ESTATE_LUXURY_EXTRAS,
} from "@/builder/demo-data";

import { generateFiles, generateSchema, usageBuckets } from "@/builder/runtime/generate";
import { builtInPresets, carsLuxuryPreset } from "@/builder/presets";
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
    expect(allowed.has("premium_sound")).toBe(false);
  });
});

describe("cars luxury layout", () => {
  const template = makeTemplate("cars");

  it("accepts cars layout extras as allowed keys", () => {
    const allowed = allowedKeys(template);
    for (const key of Object.keys(CARS_LUXURY_EXTRAS)) {
      expect(allowed.has(key), `${key} should be allowed`).toBe(true);
    }
  });

  it("does not report cars layout extras as unknown demo keys", () => {
    const check = validateTemplate(template).checks.find((c) => c.id === "demo-keys");
    expect(check?.level).toBe("pass");
    expect(check?.fields ?? []).toEqual([]);
  });

  it("ships the cars-luxury runtime and stylesheet", () => {
    const files = generateFiles(template);
    expect(files["template.js"]).toContain('layout: "cars-luxury"');
    expect(files["styles.css"]).toContain(".zc-hero__car");
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

describe("cars luxury preset", () => {
  const preset = carsLuxuryPreset();

  it("is exposed as a built-in library preset for the cars card type", () => {
    expect(builtInPresets().some((p) => p.id === preset.id)).toBe(true);
    expect(preset.cardType).toBe("cars");
    expect(preset.theme.accent.toLowerCase()).toBe("#d4af37");
    expect(preset.theme.radius).toBe(28);
  });

  it("validates with zero blocking failures", () => {
    const report = validateTemplate(preset);
    expect(report.checks.filter((c) => c.level === "fail").map((c) => c.id)).toEqual([]);
    expect(report.ok).toBe(true);
  });

  it("accepts the action-bar and share keys used by the layout", () => {
    const keys = allowedKeys(preset);
    for (const key of ["phone", "whatsapp", "share_card", "map_url", "location"]) {
      expect(keys.has(key)).toBe(true);
    }
    const result = validatePayload(JSON.stringify(preset.demoData), preset);
    expect(result.unknownKeys).toEqual([]);
  });

  it("manifest declares the cars-luxury layout with every rendered section and field", () => {
    const files = generateFiles(preset);
    const manifest = JSON.parse(files["manifest.json"]) as {
      layout: string;
      sections: { id: string; fields: string[] }[];
      fields: string[];
    };
    expect(manifest.layout).toBe("cars-luxury");
    expect(manifest.sections.length).toBeGreaterThan(0);
    const declared = manifest.sections.flatMap((s) => s.fields);
    for (const key of ["brand", "model", "year", "price", "phone", "WhatsApp"]) {
      if (manifest.fields.includes(key)) expect(declared).toContain(key);
    }
    for (const key of usageBuckets(preset).required) {
      expect(manifest.fields).toContain(key);
    }
  });

  it("generates the QR offline with no external QR service", () => {
    const js = generateFiles(preset)["template.js"];
    expect(js).toContain("function qrMatrix");
    expect(js).toContain("zc-qr__canvas");
    expect(js).not.toContain("api.qrserver.com");
    expect(js).toContain("share_card");
  });
});

describe("package parity with the standalone reference layout", () => {
  for (const cardType of CARD_TYPES) {
    const template = makeTemplate(cardType);

    it(`${cardType}: ships schema.json, the official contract and both demo files`, () => {
      const files = generateFiles(template);
      expect(files.contractFileName).toBe(`${cardType}.template.json`);
      expect(files.demoFileName).toBe("demo.json");
      expect(() => JSON.parse(files["schema.json"])).not.toThrow();
      expect(() => JSON.parse(files.contractJson)).not.toThrow();
      expect(files["demo-data.js"]).toContain("window.ZCARD_DEMO_DATA =");
      expect(JSON.parse(files.contractJson).card_type).toBe(getContract(cardType).card_type);
    });

    it(`${cardType}: schema matches the contract keys and required usage`, () => {
      const schema = generateSchema(template);
      expect(schema["x-schemaVersion"]).toBe(getContract(cardType).schema_version);
      expect(schema.additionalProperties).toBe(true);
      for (const key of usageBuckets(template).required) {
        expect(schema.required).toContain(key);
        expect(Object.keys(schema.properties)).toContain(key);
      }
      for (const key of Object.keys(schema.properties)) {
        expect(allowedKeys(template).has(key)).toBe(true);
      }
    });

    it(`${cardType}: manifest points at every packaged file`, () => {
      const manifest = JSON.parse(generateFiles(template)["manifest.json"]) as Record<string, unknown>;
      expect(manifest["schema"]).toBe("schema.json");
      expect(manifest["contract"]).toBe(`${cardType}.template.json`);
      expect(manifest["demo_data"]).toBe("demo.json");
      expect(manifest["demo_data_js"]).toBe("demo-data.js");
      expect(manifest["runtime"]).toMatchObject({
        globalData: "window.ZCARD_DATA",
        renderer: "window.ZCardTemplate.render(data)",
        dependencies: [],
      });
    });

    it(`${cardType}: index.html falls back to the demo bootstrap`, () => {
      const html = generateFiles(template)["index.html"];
      expect(html).toContain('<script src="demo-data.js"></script>');
      expect(html).toContain("window.ZCARD_DATA = window.ZCARD_DATA || window.ZCARD_DEMO_DATA");
      expect(html.indexOf("demo-data.js")).toBeLessThan(html.indexOf('src="template.js"'));
    });
  }
});
