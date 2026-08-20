import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const themeSchema = z.object({
  background: z.string(),
  surface: z.string(),
  text: z.string(),
  muted: z.string(),
  accent: z.string(),
  accentText: z.string(),
  border: z.string(),
  headingFont: z.string(),
  bodyFont: z.string(),
  radius: z.number().min(0).max(48),
  density: z.enum(["compact", "regular", "roomy"]),
  heroStyle: z.enum(["cover", "portrait", "framed", "none"]),
  contactStyle: z.enum(["floating", "inline", "list"]),
  uppercaseLabels: z.boolean(),
  sectionOrder: z.array(z.string()),
  rationale: z.string(),
});

const inputSchema = z.object({
  cardType: z.string(),
  styleDescription: z.string().min(1),
  stylePreset: z.string(),
  sectionIds: z.array(z.string()),
  usedFieldKeys: z.array(z.string()),
  referenceNotes: z.string().optional(),
  direction: z.string(),
});

export const generateThemeWithAi = createServerFn({ method: "POST" })
  .inputValidator((data) => inputSchema.parse(data))
  .handler(async ({ data }) => {
    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) return { ok: false as const, error: "AI is not configured for this project." };

    const system = [
      "You are a senior visual designer for the Z Card digital business-card platform.",
      "You output ONLY a JSON object describing a mobile card theme.",
      "Never invent, rename or return data field keys. You may only reorder the section ids given to you.",
      "Colors must be hex strings. Fonts must be CSS font-family stacks using widely available or Google fonts.",
      "Keep contrast accessible between text and background.",
      "Respond with JSON matching exactly these keys: background, surface, text, muted, accent, accentText, border, headingFont, bodyFont, radius (number), density (compact|regular|roomy), heroStyle (cover|portrait|framed|none), contactStyle (floating|inline|list), uppercaseLabels (boolean), sectionOrder (array of the given section ids), rationale (one short sentence).",
    ].join(" ");

    const user = JSON.stringify({
      card_type: data.cardType,
      style_preset: data.stylePreset,
      style_request: data.styleDescription,
      reference_notes: data.referenceNotes ?? "",
      direction: data.direction,
      available_section_ids: data.sectionIds,
      used_field_keys: data.usedFieldKeys,
    });

    try {
      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: "openai/gpt-5.6-sol",
          messages: [
            { role: "system", content: system },
            { role: "user", content: user },
          ],
          response_format: { type: "json_object" },
        }),
      });

      if (!response.ok) {
        const detail = await response.text();
        console.error("AI gateway error", response.status, detail);
        if (response.status === 429)
          return { ok: false as const, error: "AI rate limit reached. Try again shortly." };
        return { ok: false as const, error: "AI generation is unavailable right now." };
      }

      const payload = (await response.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
      };
      const content = payload.choices?.[0]?.message?.content;
      if (!content) return { ok: false as const, error: "AI returned an empty response." };

      const parsed = themeSchema.safeParse(JSON.parse(content));
      if (!parsed.success) {
        console.error("AI theme validation failed", parsed.error.issues);
        return { ok: false as const, error: "AI returned an unexpected shape." };
      }

      const allowed = new Set(data.sectionIds);
      const sectionOrder = parsed.data.sectionOrder.filter((id) => allowed.has(id));
      for (const id of data.sectionIds) if (!sectionOrder.includes(id)) sectionOrder.push(id);

      return { ok: true as const, theme: { ...parsed.data, sectionOrder } };
    } catch (error) {
      console.error("AI generation failed", error);
      return { ok: false as const, error: "AI generation failed." };
    }
  });
