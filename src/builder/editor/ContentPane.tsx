import { useMemo, useState } from "react";
import { ImagePlus, Plus, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { fieldsBySection, SECTION_LABELS, type ContractField } from "@/contracts";
import type { TemplateRecord } from "@/builder/types";

const IMAGE_TYPES = new Set(["image", "avatar", "logo", "file"]);
const GALLERY_TYPES = new Set(["gallery", "multiselect"]);

async function readAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Could not read file"));
    reader.readAsDataURL(file);
  });
}

/** Visual editor for the template payload: text, numbers, switches, images and galleries. */
export function ContentPane({
  template,
  onPatch,
  onPayload,
}: {
  template: TemplateRecord;
  onPatch: (patch: Partial<TemplateRecord>) => void;
  onPayload: (value: string | null) => void;
}) {
  const groups = useMemo(() => fieldsBySection(template.cardType), [template.cardType]);
  const [query, setQuery] = useState("");
  const data = template.demoData ?? {};

  function setValue(key: string, value: unknown) {
    const next = { ...data };
    if (value === "" || value === undefined || value === null) delete next[key];
    else next[key] = value;
    onPatch({ demoData: next });
    onPayload(null);
  }

  async function uploadImage(key: string, file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file");
      return;
    }
    if (file.size > 6 * 1024 * 1024) {
      toast.error("Image is larger than 6MB");
      return;
    }
    setValue(key, await readAsDataUrl(file));
    toast.success("Image added");
  }

  async function appendGalleryImages(key: string, files: FileList | null) {
    if (!files?.length) return;
    const list = Array.isArray(data[key]) ? [...(data[key] as string[])] : [];
    for (const file of Array.from(files)) {
      if (!file.type.startsWith("image/")) continue;
      list.push(await readAsDataUrl(file));
    }
    setValue(key, list);
    toast.success("Gallery updated");
  }

  const matches = (f: ContractField) =>
    !query ||
    f.key.toLowerCase().includes(query.toLowerCase()) ||
    f.name.toLowerCase().includes(query.toLowerCase());

  function renderField(field: ContractField) {
    const usage = template.fieldUsage[field.key] ?? "optional";
    if (usage === "unused") return null;
    const value = data[field.key];
    const type = field.type;

    return (
      <div key={field.key} className="space-y-1.5 rounded-md border border-border/70 p-2.5">
        <div className="flex items-center gap-2">
          <p className="text-xs font-medium">{field.name}</p>
          <span className="font-mono text-[10px] text-muted-foreground">{field.key}</span>
          {usage === "required" && <span className="text-[10px] text-destructive">*</span>}
        </div>

        {IMAGE_TYPES.has(type) ? (
          <div className="space-y-1.5">
            {typeof value === "string" && value ? (
              <img
                src={value}
                alt={field.name}
                className="h-24 w-full rounded-md border border-border object-cover"
              />
            ) : (
              <div className="flex h-24 items-center justify-center rounded-md border border-dashed border-border text-[11px] text-muted-foreground">
                <ImagePlus className="mr-1.5 size-3.5" /> No image
              </div>
            )}
            <div className="flex items-center gap-1.5">
              <Input
                value={typeof value === "string" ? value : ""}
                onChange={(e) => setValue(field.key, e.target.value)}
                placeholder="https://… or upload"
                className="h-7 font-mono text-[11px]"
              />
              <label>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => void uploadImage(field.key, e.target.files?.[0])}
                />
                <span className="inline-flex h-7 cursor-pointer items-center gap-1 rounded-md border border-border px-2 text-[11px] hover:bg-accent">
                  <Upload className="size-3" /> Upload
                </span>
              </label>
              {value ? (
                <Button
                  size="icon"
                  variant="ghost"
                  className="size-7"
                  onClick={() => setValue(field.key, "")}
                >
                  <Trash2 className="size-3" />
                </Button>
              ) : null}
            </div>
          </div>
        ) : GALLERY_TYPES.has(type) ? (
          <GalleryEditor
            items={Array.isArray(value) ? (value as string[]) : []}
            onChange={(items) => setValue(field.key, items.length ? items : "")}
            onUpload={(files) => void appendGalleryImages(field.key, files)}
          />
        ) : type === "checkbox" || type === "switch" ? (
          <Switch checked={Boolean(value)} onCheckedChange={(v) => setValue(field.key, v)} />
        ) : type === "select" && field.options?.length ? (
          <select
            value={typeof value === "string" ? value : ""}
            onChange={(e) => setValue(field.key, e.target.value)}
            className="h-7 w-full rounded-md border border-border bg-background px-2 text-[11px]"
          >
            <option value="">—</option>
            {field.options.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        ) : type === "textarea" ? (
          <Textarea
            value={typeof value === "string" ? value : ""}
            onChange={(e) => setValue(field.key, e.target.value)}
            className="min-h-[70px] text-[11px]"
          />
        ) : (
          <Input
            type={type === "integer" || type === "currency" ? "number" : "text"}
            value={value === undefined || value === null ? "" : String(value)}
            onChange={(e) =>
              setValue(
                field.key,
                type === "integer" || type === "currency"
                  ? e.target.value === ""
                    ? ""
                    : Number(e.target.value)
                  : e.target.value,
              )
            }
            className="h-7 text-[11px]"
          />
        )}
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-2 p-3">
      <div className="flex items-center gap-2">
        <p className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
          Content
        </p>
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search fields…"
          className="ml-auto h-7 max-w-[220px] text-[11px]"
        />
      </div>

      <div className="min-h-0 flex-1 overflow-auto pr-1">
        <div className="space-y-4">
          {groups.map((group) => {
            const fields = group.fields.filter(matches);
            if (!fields.length) return null;
            return (
              <section key={group.id} className="space-y-2">
                <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  {SECTION_LABELS[group.id]?.en ?? group.id}
                </p>
                <div className="grid gap-2 sm:grid-cols-2">{fields.map(renderField)}</div>
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function GalleryEditor({
  items,
  onChange,
  onUpload,
}: {
  items: string[];
  onChange: (items: string[]) => void;
  onUpload: (files: FileList | null) => void;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex flex-wrap gap-1.5">
        {items.map((src, i) => (
          <div key={`${src}-${i}`} className="relative">
            <img
              src={src}
              alt={`Gallery item ${i + 1}`}
              className="size-14 rounded-md border border-border object-cover"
            />
            <button
              onClick={() => onChange(items.filter((_, idx) => idx !== i))}
              className="absolute -right-1 -top-1 rounded-full bg-destructive p-0.5 text-destructive-foreground"
              aria-label="Remove image"
            >
              <Trash2 className="size-2.5" />
            </button>
          </div>
        ))}
        <label className="flex size-14 cursor-pointer items-center justify-center rounded-md border border-dashed border-border hover:bg-accent">
          <input
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => onUpload(e.target.files)}
          />
          <Plus className="size-4 text-muted-foreground" />
        </label>
      </div>
      <Input
        placeholder="Add image URL and press Enter"
        className="h-7 font-mono text-[11px]"
        onKeyDown={(e) => {
          if (e.key !== "Enter") return;
          const v = e.currentTarget.value.trim();
          if (!v) return;
          onChange([...items, v]);
          e.currentTarget.value = "";
        }}
      />
    </div>
  );
}
