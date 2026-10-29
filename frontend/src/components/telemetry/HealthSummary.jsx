import { useTranslation } from "react-i18next";
import { CircleAlert, Cpu, TriangleAlert, WifiOff } from "lucide-react";
import HealthRing from "./HealthRing";
import { HEALTH_COLORS, healthLevel } from "../../utils/metrics";

const LEVEL_LABELS = { good: "telemetry.healthGood", fair: "telemetry.healthFair", poor: "telemetry.healthPoor" };

const Tile = ({ tint, icon: Icon, iconStyle, label, children }) => (
  <div className={`flex items-center gap-3 rounded-lg p-4 ring-1 ${tint}`}>
    {Icon && (
      <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${iconStyle}`}>
        <Icon className="h-5 w-5" aria-hidden="true" />
      </span>
    )}
    <div className="min-w-0">
      <p className="text-xs font-medium text-gray-600">{label}</p>
      <div className="mt-0.5 flex items-baseline gap-1.5">{children}</div>
    </div>
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
  const level = healthLevel(score);

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {online.length > 0 ? (
        <div className={`flex items-center gap-3 rounded-lg p-4 ring-1 ${HEALTH_COLORS[level].tint}`}>
          <HealthRing score={score} size={48} />
          <div>
            <p className="text-xs font-medium text-gray-600">{t("telemetry.healthScore")}</p>
            <p className={`text-sm font-semibold ${HEALTH_COLORS[level].text}`}>{t(LEVEL_LABELS[level])}</p>
          </div>
        </div>
      ) : (
        <Tile tint="bg-gray-50 ring-gray-200" icon={WifiOff} iconStyle="bg-gray-200 text-gray-500" label={t("telemetry.healthScore")}>
          <span className="text-sm font-semibold text-gray-600">{t("telemetry.noLiveData")}</span>
        </Tile>
      )}
      <Tile
        tint={critical ? "bg-red-50 ring-red-100" : "bg-white ring-gray-200"}
        icon={CircleAlert}
        iconStyle={critical ? "bg-red-600 text-white" : "bg-gray-100 text-gray-400"}
        label={t("severity.critical")}
      >
        <span className={`text-2xl font-bold tabular-nums ${critical ? "text-red-700" : "text-gray-900"}`}>{critical}</span>
      </Tile>
      <Tile
        tint={warnings ? "bg-amber-50 ring-amber-100" : "bg-white ring-gray-200"}
        icon={TriangleAlert}
        iconStyle={warnings ? "bg-amber-500 text-white" : "bg-gray-100 text-gray-400"}
        label={t("severity.warning")}
      >
        <span className={`text-2xl font-bold tabular-nums ${warnings ? "text-amber-700" : "text-gray-900"}`}>{warnings}</span>
      </Tile>
      <Tile tint="bg-sky-50 ring-sky-100" icon={Cpu} iconStyle="bg-sky-600 text-white" label={t("telemetry.nodes")}>
        <span className="text-2xl font-bold tabular-nums text-gray-900">{online.length}</span>
        <span className="text-sm text-gray-500">/ {nodes.length} {t("telemetry.online").toLowerCase()}</span>
      </Tile>
    </div>
  );
};

export default HealthSummary;
