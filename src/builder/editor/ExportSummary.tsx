import { AlertTriangle, CheckCircle2, XCircle } from "lucide-react";
import { validateTemplate, type CheckResult } from "@/builder/validate";
import type { TemplateRecord } from "@/builder/types";
import { useI18n } from "@/lib/i18n";

function IssueGroup({
  checks,
  tone,
}: {
  checks: CheckResult[];
  tone: "fail" | "warn";
}) {
  const Icon = tone === "fail" ? XCircle : AlertTriangle;
  const color = tone === "fail" ? "text-destructive" : "text-warning";
  const border = tone === "fail" ? "border-destructive/30" : "border-warning/30";

  return (
    <ul className={`divide-y divide-border rounded-lg border ${border}`}>
      {checks.map((check) => (
        <li key={check.id} className="flex gap-2 px-3 py-2">
          <Icon className={`mt-0.5 size-3.5 shrink-0 ${color}`} />
          <div className="min-w-0 flex-1">
            <p className="text-xs">{check.message}</p>
            {check.fields?.length ? (
              <ul className="mt-1 space-y-1">
                {check.fields.map((field) => (
                  <li key={field.key} className="min-w-0">
                    <p className="break-words text-[11px]">
                      <span className={`font-mono ${color}`}>{field.key}</span>
                      <span className="text-muted-foreground"> — {field.reason}</span>
                    </p>
                    {field.hint && (
                      <p className="break-words text-[10px] text-muted-foreground">{field.hint}</p>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              check.detail && (
                <p className="mt-0.5 break-words font-mono text-[10px] text-muted-foreground">
                  {check.detail}
                </p>
              )
            )}
          </div>
          <span className="shrink-0 font-mono text-[10px] uppercase text-muted-foreground">
            {check.group}
          </span>
        </li>
      ))}
    </ul>
  );
}

/** Pre-export summary of every blocking error and warning, per failing field. */
export function ExportSummary({ template }: { template: TemplateRecord }) {
  const { t } = useI18n();
  const report = validateTemplate(template);
  const failures = report.checks.filter((c) => c.level === "fail");
  const warnings = report.checks.filter((c) => c.level === "warn");

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={`rounded-md border px-2 py-1 font-mono text-[11px] ${
            report.ok
              ? "border-primary/40 bg-primary/10 text-primary"
              : "border-destructive/40 bg-destructive/10 text-destructive"
          }`}
        >
          {report.ok ? t("readyToExport") : t("blocked")}
        </span>
        <span className="text-xs text-muted-foreground">
          {report.checks.length} {t("checks")} · {failures.length} {t("blockingErrors")} ·{" "}
          {warnings.length} {t("warningsLabel")}
        </span>
      </div>

      {failures.length === 0 && warnings.length === 0 ? (
        <div className="flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 px-3 py-2">
          <CheckCircle2 className="size-3.5 shrink-0 text-primary" />
          <p className="text-xs text-muted-foreground">{t("noIssues")}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {failures.length > 0 && (
            <div className="space-y-1">
              <p className="font-mono text-[10px] uppercase text-destructive">
                {t("blockingErrors")}
              </p>
              <IssueGroup checks={failures} tone="fail" />
            </div>
          )}
          {warnings.length > 0 && (
            <div className="space-y-1">
              <p className="font-mono text-[10px] uppercase text-warning">{t("warningsLabel")}</p>
              <IssueGroup checks={warnings} tone="warn" />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
