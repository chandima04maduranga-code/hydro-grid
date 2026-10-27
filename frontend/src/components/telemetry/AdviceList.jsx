import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { CircleCheck, Clock, Wrench, WifiOff } from "lucide-react";
import { METRIC_META, formatMetricValue, formatRange } from "../../utils/metrics";
import { formatDateTime } from "../../utils/format";

const VISIBLE_COUNT = 4;

const SEVERITY_STYLES = {
  critical: { card: "bg-red-50 ring-red-200", icon: "bg-red-600 text-white", label: "bg-red-600 text-white", step: "bg-red-600 text-white" },
  warning: { card: "bg-amber-50 ring-amber-200", icon: "bg-amber-500 text-white", label: "bg-amber-500 text-white", step: "bg-amber-500 text-white" }
};

// A node that stopped reporting is a problem the farmer has to fix as well
const offlineIssue = { code: "node.offline", severity: "warning" };

// One problem: what is wrong, how urgent it is, why it matters and numbered steps to fix it
export const AdviceCard = ({ issue, node, showNode = true }) => {
  const { t, i18n } = useTranslation();
  const style = SEVERITY_STYLES[issue.severity];
  const steps = t(`advice.${issue.code}.steps`, { returnObjects: true });
  const Icon = issue.metric ? METRIC_META[issue.metric].icon : WifiOff;

  return (
    <article className={`rounded-lg p-4 ring-1 ${style.card}`}>
      <div className="flex items-start gap-3">
        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${style.icon}`}>
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded px-1.5 py-0.5 text-[11px] font-bold uppercase tracking-wide ${style.label}`}>{t(`severity.${issue.severity}`)}</span>
            <span className="flex items-center gap-1 text-xs font-medium text-gray-700">
              <Clock className="h-3.5 w-3.5" aria-hidden="true" />
              {t(`telemetry.urgency.${issue.severity}`)}
            </span>
          </div>
          <h3 className="mt-1 font-semibold text-gray-900">{t(`advice.${issue.code}.title`)}</h3>
          <p className="mt-0.5 flex flex-wrap gap-x-3 text-xs text-gray-600">
            {issue.metric ? (
              <>
                <span>
                  {t(`metrics.${issue.metric}`)}{" "}
                  <strong className="font-bold tabular-nums text-gray-900">{formatMetricValue(issue.metric, issue.value)} {issue.unit}</strong>
                </span>
                <span>{t("telemetry.target", { range: formatRange(t, issue.metric, issue.optimal, issue.unit) })}</span>
              </>
            ) : (
              node?.lastSeenAt && <span>{t("telemetry.lastSeen", { time: formatDateTime(node.lastSeenAt, i18n.language) })}</span>
            )}
            {showNode && node && (
              <Link to={`/nodes/${encodeURIComponent(node.nodeId)}`} className="font-semibold text-leaf-700 hover:underline">
                {node.name}
              </Link>
            )}
          </p>
        </div>
      </div>

      <p className="mt-3 text-sm text-gray-700">{t(`advice.${issue.code}.why`)}</p>

      <div className="mt-3 rounded-md bg-white p-3 ring-1 ring-black/5">
        <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-gray-500">
          <Wrench className="h-3.5 w-3.5" aria-hidden="true" />
          {t("telemetry.whatToDo")}
        </p>
        <ol className="mt-2 space-y-2">
          {Array.isArray(steps) && steps.map((step, index) => (
            <li key={step} className="flex gap-2.5 text-sm text-gray-800">
              <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${style.step}`}>{index + 1}</span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
      </div>
    </article>
  );
};

// Every problem across the given nodes with its fix, most urgent first
const AdviceList = ({ nodes }) => {
  const { t } = useTranslation();
  const [showAll, setShowAll] = useState(false);

  const items = nodes
    .flatMap((node) => (node.online
      ? node.assessment.issues.map((issue) => ({ issue, node }))
      : [{ issue: offlineIssue, node }]))
    .sort((a, b) => (a.issue.severity === b.issue.severity ? 0 : a.issue.severity === "critical" ? -1 : 1));
  const visible = showAll ? items : items.slice(0, VISIBLE_COUNT);

  return (
    <section className="panel h-full p-4">
      <header className="mb-3 flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 font-semibold text-gray-900">
          <Wrench className="h-4 w-4 text-leaf-700" aria-hidden="true" />
          {t("telemetry.problemsAndFixes")}
        </h2>
        {items.length > 0 && <span className="rounded-full bg-gray-900 px-2 py-0.5 text-xs font-semibold tabular-nums text-white">{items.length}</span>}
      </header>

      {items.length === 0 ? (
        <div className="flex items-center gap-3 rounded-lg bg-emerald-50 p-4 ring-1 ring-emerald-100">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white">
            <CircleCheck className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <p className="font-semibold text-emerald-900">{t("telemetry.allGoodTitle")}</p>
            <p className="text-sm text-emerald-800">{t("telemetry.allGood")}</p>
          </div>
        </div>
      ) : (
        <>
          <ul className="grid gap-3 xl:grid-cols-2">
            {visible.map(({ issue, node }) => (
              <li key={`${node.nodeId}-${issue.code}`}>
                <AdviceCard issue={issue} node={node} />
              </li>
            ))}
          </ul>
          {items.length > VISIBLE_COUNT && (
            <button type="button" onClick={() => setShowAll((current) => !current)} className="btn btn-secondary mt-3 w-full">
              {showAll ? t("telemetry.showLess") : t("telemetry.showAll", { count: items.length })}
            </button>
          )}
        </>
      )}
    </section>
  );
};

export default AdviceList;
