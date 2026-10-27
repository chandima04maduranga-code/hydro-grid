import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import { Activity, ChevronRight, CircleAlert, Cpu, Maximize2, Sprout, TriangleAlert, Users, Warehouse } from "lucide-react";
import Avatar from "../common/Avatar";
import { GREENHOUSE_STATUS_STYLES, displayCode } from "../../utils/greenhouses";
import { healthLevel } from "../../utils/metrics";

const HEALTH_CHIP = { good: "bg-leaf-600 text-white", fair: "bg-gold-500 text-white", poor: "bg-red-600 text-white" };
const pill = "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset";

const GreenhouseCard = ({ greenhouse }) => {
  const { t } = useTranslation();
  const { summary } = greenhouse;

  return (
    <Link
      to={`/greenhouses/${greenhouse._id}`}
      className="glass group flex flex-col overflow-hidden rounded-3xl shadow-xl shadow-tea-900/10 transition hover:-translate-y-0.5 hover:shadow-2xl"
    >
      <div className="h-1.5 bg-gradient-to-r from-leaf-500 to-tea-600" />
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-leaf-50 text-leaf-600">
              <Warehouse className="h-6 w-6" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-extrabold uppercase tracking-wide text-leaf-700">{displayCode(t, greenhouse)}</p>
              <h3 className="truncate text-lg font-extrabold text-gray-900">{greenhouse.name}</h3>
            </div>
          </div>
          {summary.healthScore !== null ? (
            <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${HEALTH_CHIP[healthLevel(summary.healthScore)]}`}>{summary.healthScore}/100</span>
          ) : (
            <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-500">{t("greenhouses.noHealth")}</span>
          )}
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <span className={`${pill} ${GREENHOUSE_STATUS_STYLES[greenhouse.status]}`}>{t(`greenhouseStatuses.${greenhouse.status}`)}</span>
          <span className={`${pill} bg-white text-gray-600 ring-gray-200`}>
            <Activity className="mr-1 h-3 w-3" aria-hidden="true" />{t(`systemTypes.${greenhouse.systemType}`)}
          </span>
          {greenhouse.mainCrop && (
            <span className={`${pill} bg-white text-gray-600 ring-gray-200`}>
              <Sprout className="mr-1 h-3 w-3" aria-hidden="true" />{t(`crops.${greenhouse.mainCrop}`)}
            </span>
          )}
          {greenhouse.areaSqm && (
            <span className={`${pill} bg-white text-gray-600 ring-gray-200`}>
              <Maximize2 className="mr-1 h-3 w-3" aria-hidden="true" />{t("greenhouses.areaValue", { area: greenhouse.areaSqm })}
            </span>
          )}
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center gap-2 rounded-xl bg-white/70 px-3 py-2 text-gray-600">
            <Cpu className="h-4 w-4 text-cyan-600" aria-hidden="true" />
            <span>
              {t("greenhouses.nodes", { count: summary.nodeCount })}
              {summary.nodeCount > 0 && <span className="text-gray-400"> · {t("greenhouses.online", { count: summary.onlineCount })}</span>}
            </span>
          </div>
          <div className="flex items-center gap-3 rounded-xl bg-white/70 px-3 py-2">
            <span className="flex items-center gap-1 font-bold text-red-600">
              <CircleAlert className="h-4 w-4" aria-hidden="true" />{summary.criticalCount}
            </span>
            <span className="flex items-center gap-1 font-bold text-gold-600">
              <TriangleAlert className="h-4 w-4" aria-hidden="true" />{summary.warningCount}
            </span>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between gap-3 border-t border-white/70 pt-3">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Users className="h-4 w-4" aria-hidden="true" />
            {greenhouse.assignedUsers.length === 0 ? (
              <span>{t("greenhouses.noStaff")}</span>
            ) : (
              <span className="flex -space-x-2">
                {greenhouse.assignedUsers.slice(0, 5).map((user) => (
                  <span key={user._id} title={user.name} className="rounded-full ring-2 ring-white"><Avatar name={user.name} size="sm" /></span>
                ))}
              </span>
            )}
          </div>
          <span className="inline-flex items-center gap-1 text-sm font-bold text-leaf-700 group-hover:text-leaf-600">
            {t("greenhouses.details")}
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </span>
        </div>
      </div>
    </Link>
  );
};

export default GreenhouseCard;
