import { useMemo, useState } from "react";
import { Monitor, RefreshCw, Smartphone, Tablet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { generatePreviewDocument } from "@/builder/runtime/generate";
import type { TemplateRecord } from "@/builder/types";

const DEVICES = {
  mobile: { label: "375", width: 375, icon: Smartphone },
  tablet: { label: "768", width: 768, icon: Tablet },
  desktop: { label: "1024", width: 1024, icon: Monitor },
} as const;

type DeviceKey = keyof typeof DEVICES;

export function PreviewFrame({
  template,
  data,
}: {
  template: TemplateRecord;
  data: Record<string, unknown>;
}) {
  const [device, setDevice] = useState<DeviceKey>("mobile");
  const [nonce, setNonce] = useState(0);

  const doc = useMemo(
    () => generatePreviewDocument(template, data),
    // nonce forces a fresh document so the runtime re-executes
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [template, data, nonce],
  );

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b border-border px-3 py-2">
        <span className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
          live preview · export runtime
        </span>
        <div className="ml-auto flex items-center gap-1">
          {(Object.keys(DEVICES) as DeviceKey[]).map((key) => {
            const Icon = DEVICES[key].icon;
            return (
              <button
                key={key}
                onClick={() => setDevice(key)}
                aria-label={key}
                className={`flex items-center gap-1 rounded-md border px-2 py-1 font-mono text-[11px] transition-colors ${
                  device === key
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted-foreground hover:bg-accent"
                }`}
              >
                <Icon className="size-3" />
                {DEVICES[key].label}
              </button>
            );
          })}
          <Button
            variant="ghost"
            size="icon"
            className="size-7"
            aria-label="Reload preview"
            onClick={() => setNonce((n) => n + 1)}
          >
            <RefreshCw className="size-3.5" />
          </Button>
        </div>
      </div>

      <div className="grid-bg flex flex-1 justify-center overflow-auto bg-background p-6">
        <div
          className="h-[720px] shrink-0 overflow-hidden rounded-[26px] border border-border bg-card shadow-2xl"
          style={{ width: DEVICES[device].width }}
        >
          <iframe
            key={`${device}-${nonce}`}
            title="Template preview"
            srcDoc={doc}
            sandbox="allow-scripts allow-popups"
            className="size-full border-0 bg-white"
          />
        </div>
      </div>
    </div>
  );
}
