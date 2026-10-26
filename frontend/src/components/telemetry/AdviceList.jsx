import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { ChevronDown, CircleAlert, CircleCheck, TriangleAlert } from "lucide-react";
import { METRIC_META, formatMetricValue, formatRange } from "../../utils/metrics";

const SEVERITY_STYLES = {
  critical: { card: "border-red-300 bg-red-50/70", badge: "bg-red-600 text-white", icon: CircleAlert, iconColor: "text-red-600" },
  warning: { card: "border-gold-300 bg-gold-100/50", badge: "bg-gold-500 text-white", icon: TriangleAlert, iconColor: "text-gold-600" }
};

// One problem with plain-language explanation and numbered steps to fix it
export const AdviceCard = ({ issue, node, showNode = true }) => {
  const { t } = useTranslation();
  const style = SEVERITY_STYLES[issue.severity];
  const SeverityIcon = style.icon;
  const MetricIcon = METRIC_META[issue.metric]?.icon;
  const steps = t(`advice.${issue.code}.steps`, { returnObjects: true });

  return (
    <details open={issue.severity === "critical"} className={`group rounded-2xl border p-4 ${style.card}`}>
      <summary className="flex cursor-pointer list-none items-start gap-3">
        <SeverityIcon className={`mt-0.5 h-5 w-5 shrink-0 ${style.iconColor}`} aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${style.badge}`}>
              {t(`severity.${issue.severity}`)}
            </span>
            <h3 className="font-bold text-gray-900">{t(`advice.${issue.code}.title`)}</h3>
          </div>
          <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-600">
            {MetricIcon && <MetricIcon className="h-3.5 w-3.5" aria-hidden="true" />}
            <span>
              {t(`metrics.${issue.metric}`)}: <strong className="text-gray-900">{formatMetricValue(issue.metric, issue.value)} {issue.unit}</strong>
            </span>
            <span>{t("telemetry.target", { range: formatRange(t, issue.metric, issue.optimal, issue.unit) })}</span>
            {showNode && node && (
              <Link to={`/nodes/${encodeURIComponent(node.nodeId)}`} className="font-semibold text-leaf-700 hover:underline">
                {node.name} · {t(`crops.${node.cropProfile}`)}
              </Link>
            )}
          </p>
        </div>
        <ChevronDown className="mt-1 h-4 w-4 shrink-0 text-gray-400 transition group-open:rotate-180" aria-hidden="true" />
      </summary>

      <div className="mt-3 grid gap-3 pl-8 text-sm sm:grid-cols-2">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-gray-500">{t("telemetry.whyItMatters")}</p>
          <p className="mt-1 text-gray-700">{t(`advice.${issue.code}.why`)}</p>
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-gray-500">{t("telemetry.whatToDo")}</p>
          <ol className="mt-1 list-decimal space-y-1 pl-4 text-gray-800">
            {Array.isArray(steps) && steps.map((step) => <li key={step}>{step}</li>)}
          </ol>
        </div>
      </div>
    </details>
  );
};

// "Action needed": every problem across the farm, most urgent first
const AdviceList = ({ nodes }) => {
  const { t } = useTranslation();
  const items = nodes
    .filter((node) => node.online)
    .flatMap((node) => node.assessment.issues.map((issue) => ({ issue, node })))
    .sort((a, b) => (a.issue.severity === b.issue.severity ? 0 : a.issue.severity === "critical" ? -1 : 1));

  return (
    <section className="glass flex h-full flex-col rounded-3xl p-6 shadow-xl shadow-tea-900/10">
      <h2 className="flex items-center gap-2 text-lg font-extrabold text-gray-900">
        <TriangleAlert className="h-5 w-5 text-gold-600" aria-hidden="true" />
        {t("telemetry.actionNeeded")}
        {items.length > 0 && (
          <span className="rounded-full bg-red-600 px-2 py-0.5 text-xs font-bold text-white">{items.length}</span>
        )}
      </h2>

      {items.length === 0 ? (
        <div className="mt-4 flex flex-1 items-center gap-3 rounded-2xl bg-leaf-50/80 p-5 text-sm text-leaf-700">
          <CircleCheck className="h-6 w-6 shrink-0" aria-hidden="true" />
          {t("telemetry.allGood")}
        </div>
      ) : (
        <ul className="mt-4 max-h-[28rem] space-y-3 overflow-y-auto pr-1">
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
