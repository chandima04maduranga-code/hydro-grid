import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { ChevronRight, MapPin, Sprout } from "lucide-react";
import HealthRing from "./HealthRing";
import {
  GROUP_STYLES, METRIC_GROUPS, METRIC_META, METRIC_ORDER, TONE_STYLES, formatMetricValue, gaugeScale, toneFor
} from "../../utils/metrics";
import { formatDateTime } from "../../utils/format";
import { displayCode } from "../../utils/greenhouses";

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

// Reading with a gauge: green = target band, the marker = current value.
// The reservoir level is drawn as a tank filling up instead.
const MetricGauge = ({ metric, evaluation }) => {
  const { t } = useTranslation();
  const toneKey = toneFor(evaluation);
  const tone = TONE_STYLES[toneKey];
  const Icon = METRIC_META[metric].icon;
  const status = evaluation.status;
  const judged = ["optimal", "low", "high"].includes(status);

  let gauge = null;
  if (metric === "waterLevel") {
    const level = Math.min(100, Math.max(0, evaluation.value));
    gauge = (
      <div className="h-2 overflow-hidden rounded-full bg-sky-100">
        <div className={`h-full rounded-full ${toneKey === "good" ? "bg-sky-500" : tone.marker}`} style={{ width: `${level}%` }} />
      </div>
    );
  } else if (judged) {
    const { band, marker } = gaugeScale(evaluation.value, evaluation.optimal);
    gauge = (
      <div className="relative h-2 rounded-full bg-gray-200" aria-hidden="true">
        <div className="absolute inset-y-0 rounded-full bg-emerald-200" style={{ left: `${band[0]}%`, width: `${band[1] - band[0]}%` }} />
        <div className={`absolute -top-0.5 h-3 w-1.5 -translate-x-1/2 rounded-full ring-2 ring-white ${tone.marker}`} style={{ left: `${marker}%` }} />
      </div>
    );
  }

  return (
    <div className="rounded-md bg-white p-2.5 shadow-sm ring-1 ring-black/5">
      <div className="flex items-center justify-between gap-2">
        <span className="flex min-w-0 items-center gap-1.5 text-xs font-medium text-gray-600">
          <Icon className="h-3.5 w-3.5 shrink-0 text-gray-400" aria-hidden="true" />
          <span className="truncate">{t(`metrics.${metric}`)}</span>
        </span>
        <span className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold ${tone.chip}`}>{t(`readingStatus.${status}`)}</span>
      </div>
      <p className={`mt-1 text-lg font-bold tabular-nums ${judged ? tone.value : "text-gray-400"}`}>
        {formatMetricValue(metric, evaluation.value)}
        <span className="ml-1 text-xs font-medium text-gray-400">{evaluation.unit}</span>
      </p>
      {gauge && <div className="mt-1.5">{gauge}</div>}
    </div>
  );
};

const NodeCard = ({ node }) => {
  const { t, i18n } = useTranslation();
  const { metrics, healthScore } = node.assessment;
  const reported = METRIC_ORDER.filter((metric) => metrics[metric]);

  return (
    <article className={`panel flex flex-col overflow-hidden ${node.online ? "" : "opacity-75"}`}>
      <header className="flex items-center justify-between gap-3 px-4 py-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="truncate font-semibold text-gray-900">{node.name}</h3>
            <span className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${node.online ? "bg-emerald-100 text-emerald-800" : "bg-gray-200 text-gray-600"}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${node.online ? "animate-pulse bg-emerald-500" : "bg-gray-400"}`} aria-hidden="true" />
              {node.online ? t("telemetry.online") : t("telemetry.offline")}
            </span>
          </div>
          <p className="mt-1 flex flex-wrap items-center gap-1.5 text-xs">
            <span className="inline-flex items-center gap-1 rounded bg-leaf-50 px-1.5 py-0.5 font-medium text-leaf-800">
              <Sprout className="h-3 w-3" aria-hidden="true" />
              {t(`crops.${node.cropProfile}`)}
            </span>
            {/* On a greenhouse page the node only carries the greenhouse id, so the code is skipped */}
            {node.greenhouse?.district ? (
              <span className="inline-flex items-center gap-1 rounded bg-gray-100 px-1.5 py-0.5 text-gray-700">
                <MapPin className="h-3 w-3" aria-hidden="true" />
                {displayCode(t, node.greenhouse)}
              </span>
            ) : !node.greenhouse && <span className="rounded bg-gray-100 px-1.5 py-0.5 text-gray-600">{t("greenhouses.unplaced")}</span>}
            <span className="font-mono text-gray-400">{node.nodeId}</span>
          </p>
        </div>
        {node.online && <HealthRing score={healthScore} label={`${t("telemetry.healthScore")} ${healthScore}`} />}
      </header>

      <div className="grid flex-1 gap-3 px-4 pb-4">
        {METRIC_GROUPS.map((group) => {
          const groupMetrics = reported.filter((metric) => METRIC_META[metric].group === group);
          if (groupMetrics.length === 0) return null;
          const style = GROUP_STYLES[group];
          const GroupIcon = style.icon;
          return (
            <section key={group} className={`rounded-lg p-3 ring-1 ${style.panel}`}>
              <h4 className={`mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide ${style.title}`}>
                <span className={`flex h-5 w-5 items-center justify-center rounded ${style.badge}`}>
                  <GroupIcon className="h-3 w-3" aria-hidden="true" />
                </span>
                {t(`metricGroups.${group}`)}
              </h4>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {groupMetrics.map((metric) => <MetricGauge key={metric} metric={metric} evaluation={metrics[metric]} />)}
              </div>
            </section>
          );
        })}
      </div>

      <footer className="flex items-center justify-between gap-3 border-t border-gray-200 bg-gray-50 px-4 py-2.5 text-xs text-gray-500">
        <span>{node.lastSeenAt && t("telemetry.lastSeen", { time: formatDateTime(node.lastSeenAt, i18n.language) })}</span>
        <Link to={`/nodes/${encodeURIComponent(node.nodeId)}`} className="inline-flex items-center gap-0.5 font-semibold text-leaf-700 hover:underline">
          {t("telemetry.details")}
          <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
        </Link>
      </footer>
    </article>
  );
};

export default NodeCard;
