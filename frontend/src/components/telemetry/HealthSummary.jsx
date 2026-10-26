import { useTranslation } from "react-i18next";
import { CircleAlert, HeartPulse, TriangleAlert, Wifi } from "lucide-react";
import { healthLevel } from "../../utils/metrics";

const LEVEL_STYLES = {
  good: { stroke: "#2f9e44", text: "text-leaf-700", label: "telemetry.healthGood" },
  fair: { stroke: "#c58b2a", text: "text-gold-600", label: "telemetry.healthFair" },
  poor: { stroke: "#dc2626", text: "text-red-600", label: "telemetry.healthPoor" }
};

const RADIUS = 52;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

// Farm-wide health: average node score as a ring, plus issue and node counts
const HealthSummary = ({ nodes }) => {
  const { t } = useTranslation();
  const scored = nodes.filter((node) => node.online);
  const score = scored.length
    ? Math.round(scored.reduce((sum, node) => sum + node.assessment.healthScore, 0) / scored.length)
    : 0;
  const issues = scored.flatMap((node) => node.assessment.issues);
  const critical = issues.filter((issue) => issue.severity === "critical").length;
  const warnings = issues.length - critical;
  const level = LEVEL_STYLES[healthLevel(score)];

  return (
    <section className="glass flex h-full flex-col rounded-3xl p-6 shadow-xl shadow-tea-900/10">
      <h2 className="flex items-center gap-2 text-lg font-extrabold text-gray-900">
        <HeartPulse className="h-5 w-5 text-leaf-600" aria-hidden="true" />
        {t("telemetry.healthTitle")}
      </h2>

      <div className="mt-4 flex items-center gap-6">
        <div className="relative h-32 w-32 shrink-0" role="img" aria-label={`${t("telemetry.healthScore")}: ${score} / 100`}>
          <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
            <circle cx="60" cy="60" r={RADIUS} fill="none" stroke="#e5e7eb" strokeWidth="12" />
            <circle
              cx="60" cy="60" r={RADIUS} fill="none" stroke={level.stroke} strokeWidth="12" strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE} strokeDashoffset={CIRCUMFERENCE * (1 - score / 100)}
              className="transition-[stroke-dashoffset] duration-700"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`text-3xl font-extrabold ${level.text}`}>{score}</span>
            <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">/ 100</span>
          </div>
        </div>
        <div>
          <p className={`text-xl font-extrabold ${level.text}`}>{t(level.label)}</p>
          <p className="text-xs text-gray-500">{t("telemetry.healthScore")}</p>
        </div>
      </div>

      <ul className="mt-6 space-y-2 text-sm">
        <li className="flex items-center gap-2 font-semibold text-red-600">
          <CircleAlert className="h-4 w-4" aria-hidden="true" />
          {t("telemetry.criticalCount", { count: critical })}
        </li>
        <li className="flex items-center gap-2 font-semibold text-gold-600">
          <TriangleAlert className="h-4 w-4" aria-hidden="true" />
          {t("telemetry.warningCount", { count: warnings })}
        </li>
        <li className="flex items-center gap-2 text-gray-600">
          <Wifi className="h-4 w-4 text-leaf-600" aria-hidden="true" />
          {t("telemetry.nodesOnline", { online: scored.length, total: nodes.length })}
        </li>
      </ul>
    </section>
  );
};

export default HealthSummary;
