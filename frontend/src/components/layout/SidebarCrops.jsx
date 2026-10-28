import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import { Leaf } from "lucide-react";
import { usePlants } from "../../hooks/usePlants";
import { displayCode } from "../../utils/greenhouses";
import { HEALTH_STYLES } from "../../utils/plants";


// The company's crops under the main menu, each linking to its details
const SidebarCrops = ({ onNavigate }) => {
  const { t } = useTranslation();
  const plants = usePlants();

  return (
    <section className="mt-5" aria-labelledby="sidebar-crops-title">
      <h2 id="sidebar-crops-title" className="flex items-center justify-between px-3 pb-2 text-[11px] font-medium uppercase tracking-wide text-gray-400">
        <span className="flex items-center gap-1.5">
          <Leaf className="h-3.5 w-3.5" aria-hidden="true" />
          {t("nav.ourCrops")}
        </span>
        <span className="tabular-nums">{plants.length}</span>
      </h2>

      {plants.length === 0 ? (
        <p className="px-3 text-xs text-gray-400">{t("nav.noCrops")}</p>
      ) : (
        <ul className="space-y-0.5">
          {plants.map((plant) => {
            const content = (
              <>
                <span className="relative shrink-0">
                  {plant.image
                    ? <img src={plant.image} alt="" loading="lazy" className="h-9 w-9 rounded-md object-cover" />
                    : <span className="flex h-9 w-9 items-center justify-center rounded-md bg-leaf-50 text-leaf-700"><Leaf className="h-4 w-4" aria-hidden="true" /></span>}
                  <span
                    className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full ring-2 ring-white ${HEALTH_STYLES[plant.healthStatus]?.dot || "bg-gray-300"}`}
                    title={t(`plants.health.${plant.healthStatus}`)}
                    aria-hidden="true"
                  />
                </span>
                <span className="min-w-0 leading-tight">
                  <span className="block truncate text-sm font-medium text-gray-800">{plant.name}</span>
                  <span className="block truncate text-xs text-gray-500">
                    {plant.greenhouse ? displayCode(t, plant.greenhouse) : t(`plants.stages.${plant.growthStage}`)}
                  </span>
                </span>
              </>
            );
            return (
              <li key={plant._id}>
                <Link to={`/crops/${plant._id}`} onClick={onNavigate} className="flex items-center gap-2.5 rounded-md px-3 py-1.5 hover:bg-gray-50">
                  {content}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
};

export default SidebarCrops;
