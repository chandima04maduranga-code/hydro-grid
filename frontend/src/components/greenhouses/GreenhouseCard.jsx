import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import { Activity, ChevronRight, CircleAlert, Cpu, Maximize2, Sprout, TriangleAlert, Users, Warehouse } from "lucide-react";
import Avatar from "../common/Avatar";
import { GREENHOUSE_STATUS_STYLES, displayCode } from "../../utils/greenhouses";
import { healthLevel } from "../../utils/metrics";

const HEALTH_TEXT = { good: "text-emerald-700", fair: "text-amber-700", poor: "text-red-700" };
const pill = "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset";

const GreenhouseCard = ({ greenhouse }) => {
  const { t } = useTranslation();
  const { summary } = greenhouse;

  return (
    <Link
      to={`/greenhouses/${greenhouse._id}`}
      className="panel group flex flex-col overflow-hidden rounded-lg transition-colors hover:border-gray-300"
    >
      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-gray-100 text-gray-500">
              <Warehouse className="h-5 w-5" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-medium text-gray-500">{displayCode(t, greenhouse)}</p>
              <h3 className="truncate text-base font-semibold text-gray-900">{greenhouse.name}</h3>
            </div>
          </div>
          {summary.healthScore !== null ? (
            <span className={`text-sm font-semibold tabular-nums ${HEALTH_TEXT[healthLevel(summary.healthScore)]}`}>{summary.healthScore}<span className="text-xs font-normal text-gray-400">/100</span></span>
          ) : (
            <span className="text-xs text-gray-400">{t("greenhouses.noHealth")}</span>
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
          <div className="flex items-center gap-2 rounded-md bg-gray-50 px-3 py-2 text-gray-600">
            <Cpu className="h-4 w-4 text-gray-400" aria-hidden="true" />
            <span>
              {t("greenhouses.nodes", { count: summary.nodeCount })}
              {summary.nodeCount > 0 && <span className="text-gray-400"> · {t("greenhouses.online", { count: summary.onlineCount })}</span>}
            </span>
          </div>
          <div className="flex items-center gap-3 rounded-md bg-gray-50 px-3 py-2">
            <span className="flex items-center gap-1 font-semibold text-red-700">
              <CircleAlert className="h-4 w-4" aria-hidden="true" />{summary.criticalCount}
            </span>
            <span className="flex items-center gap-1 font-semibold text-amber-700">
              <TriangleAlert className="h-4 w-4" aria-hidden="true" />{summary.warningCount}
            </span>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between gap-3 border-t border-gray-100 pt-3">
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
          <span className="inline-flex items-center gap-1 text-sm font-medium text-leaf-700 group-hover:underline">
            {t("greenhouses.details")}
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </span>
        </div>
      </div>
    </Link>
  );
};

export default GreenhouseCard;
