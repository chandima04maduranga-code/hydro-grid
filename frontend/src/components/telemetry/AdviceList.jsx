import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { ChevronRight, CircleCheck } from "lucide-react";
import { formatMetricValue, formatRange } from "../../utils/metrics";

const SEVERITY_STYLES = {
  critical: { edge: "border-l-red-600", label: "text-red-700" },
  warning: { edge: "border-l-amber-500", label: "text-amber-700" }
};

// One problem: what is wrong, why it matters and numbered steps to fix it
export const AdviceCard = ({ issue, node, showNode = true }) => {
  const { t } = useTranslation();
  const style = SEVERITY_STYLES[issue.severity];
  const steps = t(`advice.${issue.code}.steps`, { returnObjects: true });

  return (
    <details open={issue.severity === "critical"} className={`group border-l-[3px] bg-white ${style.edge}`}>
      <summary className="flex cursor-pointer list-none items-start gap-3 px-4 py-3 hover:bg-gray-50">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-2">
            <span className={`text-[11px] font-semibold uppercase tracking-wide ${style.label}`}>{t(`severity.${issue.severity}`)}</span>
            <h3 className="text-sm font-semibold text-gray-900">{t(`advice.${issue.code}.title`)}</h3>
          </div>
          <p className="mt-0.5 flex flex-wrap gap-x-3 text-xs text-gray-500">
            <span>
              {t(`metrics.${issue.metric}`)}{" "}
              <strong className="font-semibold tabular-nums text-gray-900">{formatMetricValue(issue.metric, issue.value)} {issue.unit}</strong>
            </span>
            <span>{t("telemetry.target", { range: formatRange(t, issue.metric, issue.optimal, issue.unit) })}</span>
            {showNode && node && (
              <Link to={`/nodes/${encodeURIComponent(node.nodeId)}`} className="font-medium text-leaf-700 hover:underline" onClick={(event) => event.stopPropagation()}>
                {node.name}
              </Link>
            )}
          </p>
        </div>
        <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-gray-400 transition-transform group-open:rotate-90" aria-hidden="true" />
      </summary>

      <div className="grid gap-4 border-t border-gray-100 px-4 py-3 text-sm sm:grid-cols-2">
        <div>
          <p className="text-xs font-medium text-gray-500">{t("telemetry.whyItMatters")}</p>
          <p className="mt-1 text-gray-700">{t(`advice.${issue.code}.why`)}</p>
        </div>
        <div>
          <p className="text-xs font-medium text-gray-500">{t("telemetry.whatToDo")}</p>
          <ol className="mt-1 list-decimal space-y-1 pl-4 text-gray-800">
            {Array.isArray(steps) && steps.map((step) => <li key={step}>{step}</li>)}
          </ol>
        </div>
      </div>
    </details>
  );
};

// "Action needed": every problem across the given nodes, most urgent first
const AdviceList = ({ nodes }) => {
  const { t } = useTranslation();
  const items = nodes
    .filter((node) => node.online)
    .flatMap((node) => node.assessment.issues.map((issue) => ({ issue, node })))
    .sort((a, b) => (a.issue.severity === b.issue.severity ? 0 : a.issue.severity === "critical" ? -1 : 1));

  return (
    <section className="panel flex h-full flex-col overflow-hidden">
      <header className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
        <h2 className="text-sm font-semibold text-gray-900">{t("telemetry.actionNeeded")}</h2>
        {items.length > 0 && <span className="rounded bg-gray-100 px-1.5 text-xs font-semibold tabular-nums text-gray-700">{items.length}</span>}
      </header>

      {items.length === 0 ? (
        <p className="flex flex-1 items-center gap-2 px-4 py-6 text-sm text-gray-600">
          <CircleCheck className="h-4 w-4 shrink-0 text-emerald-600" aria-hidden="true" />
          {t("telemetry.allGood")}
        </p>
      ) : (
        <ul className="max-h-[26rem] divide-y divide-gray-100 overflow-y-auto">
          {items.map(({ issue, node }) => (
            <li key={`${node.nodeId}-${issue.code}`}>
              <AdviceCard issue={issue} node={node} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};

export default AdviceList;
