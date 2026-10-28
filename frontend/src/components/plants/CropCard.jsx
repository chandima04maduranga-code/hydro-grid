import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import { CalendarClock, Leaf } from "lucide-react";
import { displayCode } from "../../utils/greenhouses";
import { HEALTH_STYLES, STAGE_STYLES, daysUntil } from "../../utils/plants";

// Photo card for one crop, linking to its details
const CropCard = ({ plant }) => {
  const { t } = useTranslation();
  const health = HEALTH_STYLES[plant.healthStatus] || HEALTH_STYLES.healthy;
  const days = daysUntil(plant.expectedHarvestOn);

  return (
    <Link to={`/crops/${plant._id}`} className="panel group flex flex-col overflow-hidden transition hover:border-gray-300 hover:shadow-sm">
      <div className="relative h-32 bg-leaf-50">
        {plant.image
          ? <img src={plant.image} alt="" loading="lazy" className="h-full w-full object-cover" />
          : <span className="flex h-full items-center justify-center text-leaf-600"><Leaf className="h-10 w-10" aria-hidden="true" /></span>}
        <span className={`absolute right-2 top-2 rounded-full px-2 py-0.5 text-[11px] font-semibold shadow-sm ${health.chip}`}>
          {t(`plants.health.${plant.healthStatus}`)}
        </span>
      </div>
      <div className="flex flex-1 flex-col p-3">
        <p className="truncate font-semibold text-gray-900 group-hover:text-leaf-800">{plant.name}</p>
        <p className="truncate text-xs italic text-gray-500">{plant.species}</p>
        <div className="mt-2 flex flex-wrap gap-1 text-[11px]">
          {plant.greenhouse && <span className="rounded bg-gray-100 px-1.5 py-0.5 text-gray-700">{displayCode(t, plant.greenhouse)}</span>}
          <span className={`rounded px-1.5 py-0.5 font-medium ${STAGE_STYLES[plant.growthStage] || ""}`}>{t(`plants.stages.${plant.growthStage}`)}</span>
        </div>
        {days !== null && (
          <p className={`mt-auto flex items-center gap-1 pt-2 text-xs ${days < 0 ? "text-red-700" : "text-gray-500"}`}>
            <CalendarClock className="h-3.5 w-3.5" aria-hidden="true" />
            {days < 0 ? t("plants.harvestOverdue", { count: -days }) : days === 0 ? t("plants.harvestToday") : t("plants.harvestIn", { count: days })}
          </p>
        )}
      </div>
    </Link>
  );
};

export default CropCard;
