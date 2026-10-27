import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { ChevronRight, Cpu, MapPin, Warehouse, Wifi, WifiOff } from "lucide-react";
import { displayCode } from "../../utils/greenhouses";
import { METRIC_GROUPS, METRIC_META, METRIC_ORDER, TONE_STYLES, formatMetricValue, healthLevel, toneFor } from "../../utils/metrics";
import { formatDateTime } from "../../utils/format";

const HEALTH_CHIP = {
  good: "bg-leaf-600 text-white",
  fair: "bg-gold-500 text-white",
  poor: "bg-red-600 text-white"
};

// One reading: icon, name, value with unit and a status chip
export const MetricTile = ({ metric, evaluation }) => {
  const { t } = useTranslation();
  const tone = TONE_STYLES[toneFor(evaluation)];
  const Icon = METRIC_META[metric].icon;
  const status = evaluation?.status || "stale";

  return (
    <div className={`flex items-center gap-3 rounded-xl border bg-white/90 p-3 ${tone.border}`}>
      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${tone.icon}`}>
        <Icon className="h-5 w-5" aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-medium text-gray-500">{t(`metrics.${metric}`)}</p>
        <p className={`text-lg font-extrabold leading-tight ${tone.value}`}>
          {formatMetricValue(metric, evaluation?.value)}
          <span className="ml-1 text-xs font-semibold text-gray-500">{evaluation?.unit}</span>
        </p>
      </div>
      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ring-1 ring-inset ${tone.chip}`}>
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
    <article className="glass overflow-hidden rounded-3xl shadow-xl shadow-tea-900/10">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-white/70 bg-white/50 px-5 py-4">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-cyan-50 text-cyan-600">
            <Cpu className="h-6 w-6" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <h3 className="truncate text-lg font-extrabold text-gray-900">{node.name}</h3>
            <p className="flex flex-wrap items-center gap-x-2 text-xs text-gray-500">
              <span className="font-semibold text-gray-700">{node.nodeId}</span>
              <span className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 font-semibold ${node.greenhouse ? "bg-leaf-50 text-leaf-700" : "bg-gray-100 text-gray-500"}`}>
                <Warehouse className="h-3 w-3" aria-hidden="true" />
                {node.greenhouse ? displayCode(t, node.greenhouse) : t("greenhouses.unplaced")}
              </span>
              <span>· {t(`crops.${node.cropProfile}`)}</span>
              {node.location && (
                <span className="flex items-center gap-1"><MapPin className="h-3 w-3" aria-hidden="true" />{node.location}</span>
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {node.online ? (
            <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${HEALTH_CHIP[healthLevel(healthScore)]}`}>{healthScore}/100</span>
          ) : null}
          <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${node.online ? "bg-leaf-50 text-leaf-700" : "bg-gray-100 text-gray-500"}`}>
            {node.online ? <Wifi className="h-3.5 w-3.5" aria-hidden="true" /> : <WifiOff className="h-3.5 w-3.5" aria-hidden="true" />}
            {node.online ? t("telemetry.online") : t("telemetry.offline")}
          </span>
        </div>
      </div>

      <div className="space-y-4 p-5">
        {METRIC_GROUPS.map((group) => {
          const groupMetrics = reported.filter((metric) => METRIC_META[metric].group === group);
          if (groupMetrics.length === 0) return null;
          return (
            <div key={group}>
              <p className="mb-2 text-xs font-bold uppercase tracking-wide text-gray-500">{t(`metricGroups.${group}`)}</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {groupMetrics.map((metric) => (
                  <MetricTile key={metric} metric={metric} evaluation={metrics[metric]} />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-white/70 bg-white/40 px-5 py-3 text-xs text-gray-500">
        <span>{node.lastSeenAt && t("telemetry.lastSeen", { time: formatDateTime(node.lastSeenAt, i18n.language) })}</span>
        <Link
          to={`/nodes/${encodeURIComponent(node.nodeId)}`}
          className="inline-flex items-center gap-1 font-bold text-leaf-700 hover:text-leaf-600"
        >
          {t("telemetry.details")}
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>
    </article>
  );
};

export default NodeCard;
