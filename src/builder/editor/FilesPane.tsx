import { useMemo, useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { generateFiles } from "@/builder/runtime/generate";
import { exportTemplateZip } from "@/builder/export";
import { validateTemplate } from "@/builder/validate";
import type { TemplateRecord } from "@/builder/types";
import { useI18n } from "@/lib/i18n";
import { ExportSummary } from "./ExportSummary";


export function FilesPane({ template }: { template: TemplateRecord }) {
  const files = useMemo(() => generateFiles(template), [template]);
  const entries = useMemo(
    () =>
      [
        ["index.html", files["index.html"]],
        ["styles.css", files["styles.css"]],
        ["template.js", files["template.js"]],
        ["manifest.json", files["manifest.json"]],
        [files.demoFileName, files.demoJson],
      ] as [string, string][],
    [files],
  );
  const [active, setActive] = useState(0);
  const [busy, setBusy] = useState(false);
  const report = validateTemplate(template);
  const { t } = useI18n();


  async function download() {
    if (!report.ok) {
      toast.error("Fix validation failures before exporting.");
      return;
    }
    setBusy(true);
    try {
      const result = await exportTemplateZip(template);
      toast.success(`${result.fileName} exported`, {
        description: `${result.files.length} files · ${result.assets} images in assets/${
          result.assetsFailed ? ` · ${result.assetsFailed} failed` : ""
        } · ${(result.bytes / 1024).toFixed(1)} KB`,
      });
    } catch (error) {
      console.error(error);
      toast.error("Export failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-2 overflow-auto p-3">
      <ExportSummary template={template} />

      <div className="flex items-center gap-1 overflow-x-auto pb-1">
        {entries.map(([name], index) => (
          <button
            key={name}
            onClick={() => setActive(index)}
            className={`shrink-0 rounded border px-2 py-1 font-mono text-[11px] transition-colors ${
              active === index
                ? "border-primary bg-primary/10 text-primary"
                : "border-border text-muted-foreground hover:bg-accent"
            }`}
          >
            {name}
          </button>
        ))}
        <Button
          size="sm"
          className="ml-auto h-7 gap-1.5"
          onClick={download}
          disabled={busy || !report.ok}
        >
          {busy ? <Loader2 className="size-3 animate-spin" /> : <Download className="size-3" />}
          Export ZIP
        </Button>
      </div>
      {!report.ok && <p className="text-[11px] text-destructive">{t("fixBeforeExport")}</p>}
      <pre className="min-h-[160px] flex-1 overflow-auto rounded-lg border border-border bg-card p-3 font-mono text-[11px] leading-relaxed text-muted-foreground">
        {entries[active]?.[1]}
      </pre>
    </div>
  );

}
