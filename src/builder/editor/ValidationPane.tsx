import { AlertTriangle, CheckCircle2, XCircle } from "lucide-react";
import { validateTemplate, type CheckLevel } from "@/builder/validate";
import type { TemplateRecord } from "@/builder/types";

const ICONS: Record<CheckLevel, typeof CheckCircle2> = {
  pass: CheckCircle2,
  warn: AlertTriangle,
  fail: XCircle,
};

const TONE: Record<CheckLevel, string> = {
  pass: "text-primary",
  warn: "text-warning",
  fail: "text-destructive",
};

export function ValidationPane({ template }: { template: TemplateRecord }) {
  const report = validateTemplate(template);
  const failures = report.checks.filter((c) => c.level === "fail").length;

  return (
    <div className="flex h-full flex-col gap-3 overflow-auto p-3">
      <div className="flex items-center gap-3">
        <span
          className={`rounded-md border px-2 py-1 font-mono text-[11px] ${
            report.ok
              ? "border-primary/40 bg-primary/10 text-primary"
              : "border-destructive/40 bg-destructive/10 text-destructive"
          }`}
        >
          {report.ok ? "READY TO EXPORT" : "BLOCKED"}
        </span>
        <span className="text-xs text-muted-foreground">
          {report.checks.length} checks · {failures} failed · {report.warnings} warnings
        </span>
      </div>

      <div className="divide-y divide-border overflow-hidden rounded-lg border border-border">
        {report.checks.map((check) => {
          const Icon = ICONS[check.level];
          return (
            <div key={check.id} className="flex gap-2 px-3 py-2">
              <Icon className={`mt-0.5 size-3.5 shrink-0 ${TONE[check.level]}`} />
              <div className="min-w-0">
                <p className="text-xs">{check.message}</p>
                {check.detail && (
                  <p className="mt-0.5 break-words font-mono text-[10px] text-muted-foreground">
                    {check.detail}
                  </p>
                )}
              </div>
              <span className="ml-auto shrink-0 font-mono text-[10px] uppercase text-muted-foreground">
                {check.group}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
