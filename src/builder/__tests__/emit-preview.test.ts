import { it } from "vitest";
import { writeFileSync } from "node:fs";
import { getContract } from "@/contracts";
import { generateDemoData } from "@/builder/demo-data";
import { generatePreviewDocument } from "@/builder/runtime/generate";
import { themeForStyle, type FieldUsage, type TemplateRecord } from "@/builder/types";

it("emit", () => {
  const contract = getContract("cars");
  const fieldUsage: Record<string, FieldUsage> = {};
  for (const f of contract.fields) fieldUsage[f.key] = f.is_required ? "required" : "recommended";
  const now = new Date().toISOString();
  const t: TemplateRecord = {
    id: "cars-luxury-v", slug: "cars-luxury", name: "Cars Luxury", version: "1.0.0",
    cardType: "cars", schemaVersion: contract.schema_version, styleDescription: "Luxury",
    reference: {}, direction: "ltr", languages: ["en"], fieldUsage,
    sectionOrder: contract.sections.map((s) => s.id), hiddenSections: [],
    theme: themeForStyle("Luxury"), demoData: generateDemoData("cars", fieldUsage),
    createdAt: now, updatedAt: now,
  };
  writeFileSync("/tmp/browser/cars/card.html", generatePreviewDocument(t, t.demoData));
});
