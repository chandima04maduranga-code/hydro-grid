import { useTranslation } from "react-i18next";
import { healthLevel } from "../../utils/metrics";

const LEVEL_STYLES = {
  good: { text: "text-emerald-700", bar: "bg-emerald-600", label: "telemetry.healthGood" },
  fair: { text: "text-amber-700", bar: "bg-amber-500", label: "telemetry.healthFair" },
  poor: { text: "text-red-700", bar: "bg-red-600", label: "telemetry.healthPoor" }
};

const Tile = ({ label, children, footer }) => (
  <div className="panel px-4 py-3">
    <p className="text-xs font-medium text-gray-500">{label}</p>
    <div className="mt-1 flex items-baseline gap-2">{children}</div>
    {footer && <div className="mt-2">{footer}</div>}
  </div>
);

// KPI strip: farm health score, problem counts and nodes online
const HealthSummary = ({ nodes }) => {
  const { t } = useTranslation();
  const online = nodes.filter((node) => node.online);
  const score = online.length
    ? Math.round(online.reduce((sum, node) => sum + node.assessment.healthScore, 0) / online.length)
    : 0;
  const issues = online.flatMap((node) => node.assessment.issues);
  const critical = issues.filter((issue) => issue.severity === "critical").length;
  const warnings = issues.length - critical;
  const level = LEVEL_STYLES[healthLevel(score)];

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <Tile
        label={t("telemetry.healthScore")}
        footer={
          <div className="h-1.5 overflow-hidden rounded-full bg-gray-100" role="img" aria-label={`${score} / 100`}>
            <div className={`h-full ${level.bar}`} style={{ width: `${score}%` }} />
          </div>
        }
      >
        <span className="text-2xl font-semibold tabular-nums text-gray-900">{score}</span>
        <span className="text-sm text-gray-400">/ 100</span>
        <span className={`ml-auto text-xs font-semibold ${level.text}`}>{t(level.label)}</span>
      </Tile>
      <Tile label={t("severity.critical")}>
        <span className={`text-2xl font-semibold tabular-nums ${critical ? "text-red-700" : "text-gray-900"}`}>{critical}</span>
      </Tile>
      <Tile label={t("severity.warning")}>
        <span className={`text-2xl font-semibold tabular-nums ${warnings ? "text-amber-700" : "text-gray-900"}`}>{warnings}</span>
      </Tile>
      <Tile label={t("telemetry.nodes")}>
        <span className="text-2xl font-semibold tabular-nums text-gray-900">{online.length}</span>
        <span className="text-sm text-gray-400">/ {nodes.length} {t("telemetry.online").toLowerCase()}</span>
      </Tile>
    </div>
  );
};

export default HealthSummary;
