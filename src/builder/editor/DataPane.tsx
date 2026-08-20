import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { regenerateDemo } from "@/builder/demo-data";
import { validatePayload } from "@/builder/validate";
import type { TemplateRecord } from "@/builder/types";
import { useI18n } from "@/lib/i18n";

export function DataPane({
  template,
  onPatch,
  payload,
  onPayload,
}: {
  template: TemplateRecord;
  onPatch: (patch: Partial<TemplateRecord>) => void;
  payload: string | null;
  onPayload: (value: string | null) => void;
}) {
  const { t } = useI18n();
  const [draft, setDraft] = useState(() => JSON.stringify(template.demoData, null, 2));
  const check = validatePayload(draft, template);

  function apply() {
    if (!check.valid || !check.data) {
      toast.error(check.error ?? "Invalid JSON payload");
      return;
    }
    onPayload(draft);
    toast.success("Payload applied to preview");
  }

  function regenerate() {
    const data = regenerateDemo(template);
    onPatch({ demoData: data });
    setDraft(JSON.stringify(data, null, 2));
    onPayload(null);
    toast.success("Demo data regenerated");
  }

  return (
    <div className="flex h-full flex-col gap-2 p-3">
      <div className="flex items-center gap-2">
        <p className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
          {t("apiPayload")}
        </p>
        <div className="ml-auto flex gap-2">
          <Button size="sm" variant="outline" className="h-7 gap-1.5" onClick={regenerate}>
            <RefreshCw className="size-3" />
            {t("demoData")}
          </Button>
          <Button size="sm" className="h-7" onClick={apply}>
            Apply to preview
          </Button>
        </div>
      </div>

      <Textarea
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        spellCheck={false}
        className="min-h-0 flex-1 resize-none font-mono text-[11px] leading-relaxed"
      />

      <div className="space-y-1 text-[11px]">
        {!check.valid && <p className="text-destructive">{check.error}</p>}
        {check.valid && check.unknownKeys.length > 0 && (
          <p className="text-destructive">
            Keys not in contract: <span className="font-mono">{check.unknownKeys.join(", ")}</span>
          </p>
        )}
        {check.valid && check.missingRequired.length > 0 && (
          <p className="text-warning">
            Missing required values:{" "}
            <span className="font-mono">{check.missingRequired.join(", ")}</span>
          </p>
        )}
        {check.valid && !check.unknownKeys.length && !check.missingRequired.length && (
          <p className="text-primary">Payload matches the {template.cardType} contract.</p>
        )}
        {payload && <p className="text-muted-foreground">Preview is using the custom payload.</p>}
      </div>
    </div>
  );
}
