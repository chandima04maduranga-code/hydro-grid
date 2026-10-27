import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { ChevronRight } from "lucide-react";
import { METRIC_GROUPS, METRIC_META, METRIC_ORDER, TONE_STYLES, formatMetricValue, healthLevel, toneFor } from "../../utils/metrics";
import { formatDateTime } from "../../utils/format";
import { displayCode } from "../../utils/greenhouses";

const HEALTH_TEXT = { good: "text-emerald-700", fair: "text-amber-700", poor: "text-red-700" };

// One reading as a table row: icon, name, value and status
export const MetricTile = ({ metric, evaluation }) => {
  const { t } = useTranslation();
  const tone = TONE_STYLES[toneFor(evaluation)];
  const Icon = METRIC_META[metric].icon;
  const status = evaluation?.status || "stale";

  return (
    <div className="flex items-center gap-3 py-1.5 text-sm">
      <Icon className="h-4 w-4 shrink-0 text-gray-400" aria-hidden="true" />
      <span className="min-w-0 flex-1 truncate text-gray-600">{t(`metrics.${metric}`)}</span>
      <span className={`font-medium tabular-nums ${tone.value}`}>
        {formatMetricValue(metric, evaluation?.value)}
        <span className="ml-1 text-xs font-normal text-gray-400">{evaluation?.unit}</span>
      </span>
      <span className={`flex w-24 items-center justify-end gap-1.5 text-xs ${tone.text}`}>
        <span className={`h-2 w-2 shrink-0 rounded-full ${tone.dot}`} aria-hidden="true" />
        {t(`readingStatus.${status}`)}
      </span>
    </div>
  );
};

const NodeCard = ({ node }) => {
  const { t, i18n } = useTranslation();
  const { metrics, healthScore } = node.assessment;
  const reported = METRIC_ORDER.filter((metric) => metrics[metric]);

  return (
    <article className="panel flex flex-col">
      <header className="flex flex-wrap items-start justify-between gap-3 border-b border-gray-200 px-4 py-3">
        <div className="min-w-0">
          <h3 className="truncate text-sm font-semibold text-gray-900">{node.name}</h3>
          <p className="mt-0.5 flex flex-wrap gap-x-2 text-xs text-gray-500">
            <span className="font-mono">{node.nodeId}</span>
            <span>·</span>
            {/* On a greenhouse page the node only carries the greenhouse id, so the code is skipped */}
            {node.greenhouse?.district
              ? <span>{displayCode(t, node.greenhouse)}</span>
              : !node.greenhouse && <span>{t("greenhouses.unplaced")}</span>}
            <span>·</span>
            <span>{t(`crops.${node.cropProfile}`)}</span>
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs">
          {node.online && (
            <span className="text-gray-500">
              {t("telemetry.healthScore")}{" "}
              <strong className={`font-semibold tabular-nums ${HEALTH_TEXT[healthLevel(healthScore)]}`}>{healthScore}</strong>
            </span>
          )}
          <span className={`flex items-center gap-1.5 font-medium ${node.online ? "text-emerald-700" : "text-gray-400"}`}>
            <span className={`h-2 w-2 rounded-full ${node.online ? "bg-emerald-500" : "bg-gray-300"}`} aria-hidden="true" />
            {node.online ? t("telemetry.online") : t("telemetry.offline")}
          </span>
        </div>
      </header>

      <div className="grid flex-1 gap-x-6 px-4 py-2 md:grid-cols-2">
        {METRIC_GROUPS.map((group) => {
          const groupMetrics = reported.filter((metric) => METRIC_META[metric].group === group);
          if (groupMetrics.length === 0) return null;
          return (
            <div key={group} className="py-1">
              <p className="pb-1 pt-1.5 text-[11px] font-medium uppercase tracking-wide text-gray-400">{t(`metricGroups.${group}`)}</p>
              <div className="divide-y divide-gray-100">
                {groupMetrics.map((metric) => <MetricTile key={metric} metric={metric} evaluation={metrics[metric]} />)}
              </div>
            </div>
          );
        })}
      </div>

      <footer className="flex items-center justify-between gap-3 border-t border-gray-200 px-4 py-2.5 text-xs text-gray-500">
        <span>{node.lastSeenAt && t("telemetry.lastSeen", { time: formatDateTime(node.lastSeenAt, i18n.language) })}</span>
        <Link to={`/nodes/${encodeURIComponent(node.nodeId)}`} className="inline-flex items-center gap-0.5 font-medium text-leaf-700 hover:underline">
          {t("telemetry.details")}
          <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
        </Link>
      </footer>
    </article>
  );
};

export default NodeCard;
