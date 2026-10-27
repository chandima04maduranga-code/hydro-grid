import { useEffect, useState } from "react";
import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import { ChevronRight } from "lucide-react";
import { useGreenhouses } from "../hooks/useGreenhouses";
import { displayCode } from "../utils/greenhouses";
import apiClient from "../api/axiosConfig";
import { useAuth } from "../context/AuthContext";
import HealthSummary from "../components/telemetry/HealthSummary";
import AdviceList from "../components/telemetry/AdviceList";
import NodeCard from "../components/telemetry/NodeCard";
import TimeOfDayBanner from "../components/dashboard/TimeOfDayBanner";
import { useTelemetryNodes } from "../hooks/useTelemetry";
import { healthLevel } from "../utils/metrics";

const PLANTS_REFRESH_MS = 30000;

const PLANT_HEALTH_DOT = { Healthy: "bg-emerald-500", "Nutrient Warning": "bg-amber-500", Critical: "bg-red-600" };
const HEALTH_TEXT = { good: "text-emerald-700", fair: "text-amber-700", poor: "text-red-700" };

const usePlants = () => {
  const [plants, setPlants] = useState([]);

  useEffect(() => {
    let cancelled = false;
    const load = () =>
      apiClient.get("/plants")
        .then(({ data }) => {
          if (!cancelled) setPlants(data);
        })
        .catch(() => {});
    load();
    const timer = setInterval(load, PLANTS_REFRESH_MS);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, []);

  return plants;
};

const SectionHeading = ({ title, count }) => (
  <div className="mb-3 flex items-baseline gap-2">
    <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
    <span className="text-sm tabular-nums text-gray-400">{count}</span>
  </div>
);

// Right-hand panel on the overview: every greenhouse with its health and problems
const GreenhouseOverview = ({ greenhouses, onSelect }) => {
  const { t } = useTranslation();
  return (
    <section className="panel h-full overflow-hidden">
      <header className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
        <h2 className="text-sm font-semibold text-gray-900">{t("nav.greenhouses")}</h2>
        <Link to="/greenhouses" className="text-xs font-medium text-leaf-700 hover:underline">{t("greenhouses.details")}</Link>
      </header>
      <ul className="divide-y divide-gray-100">
        {greenhouses.map((greenhouse) => {
          const { summary } = greenhouse;
          return (
            <li key={greenhouse._id}>
              <button type="button" onClick={() => onSelect(greenhouse._id)} className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-gray-50">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-gray-900">{greenhouse.name}</p>
                  <p className="text-xs text-gray-500">{displayCode(t, greenhouse)}</p>
                </div>
                <div className="text-right text-xs tabular-nums">
                  {summary.healthScore !== null ? (
                    <p className={`font-semibold ${HEALTH_TEXT[healthLevel(summary.healthScore)]}`}>{summary.healthScore}</p>
                  ) : (
                    <p className="text-gray-400">—</p>
                  )}
                  <p className="text-gray-400">
                    {summary.criticalCount > 0 && <span className="text-red-700">{summary.criticalCount} {t("severity.critical").toLowerCase()} </span>}
                    {summary.warningCount > 0 && <span className="text-amber-700">{summary.warningCount} {t("severity.warning").toLowerCase()}</span>}
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 shrink-0 text-gray-300" aria-hidden="true" />
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
};

const DashboardPage = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { nodes: allNodes, loaded, lastUpdated } = useTelemetryNodes();
  const { greenhouses } = useGreenhouses();
  const allPlants = usePlants();
  const [tab, setTab] = useState("all");

  // Greenhouse tabs: everything, one per greenhouse, and unplaced nodes (admins only see those)
  const unplacedCount = allNodes.filter((node) => !node.greenhouse).length;
  const tabs = [
    { key: "all", label: t("greenhouses.allGreenhouses") },
    ...greenhouses.map((greenhouse) => ({ key: greenhouse._id, label: `${displayCode(t, greenhouse)} · ${greenhouse.name}` })),
    ...(unplacedCount > 0 ? [{ key: "none", label: t("greenhouses.unplaced") }] : [])
  ];
  const activeTab = tabs.some((item) => item.key === tab) ? tab : "all";
  const inTab = (item) => (activeTab === "none" ? !item.greenhouse : item.greenhouse?._id === activeTab);
  const nodes = activeTab === "all" ? allNodes : allNodes.filter(inTab);
  const plants = activeTab === "all" ? allPlants : allPlants.filter(inTab);
  const showOverview = activeTab === "all" && greenhouses.length > 0;

  return (
    <div className="space-y-6">
      <TimeOfDayBanner name={user.name} company={user.company} lastUpdated={lastUpdated} />

      {tabs.length > 2 && (
        <div role="tablist" aria-label={t("nav.greenhouses")} className="flex gap-5 overflow-x-auto border-b border-gray-200">
          {tabs.map((item) => (
            <button
              key={item.key}
              role="tab"
              type="button"
              aria-selected={activeTab === item.key}
              onClick={() => setTab(item.key)}
              className={`-mb-px shrink-0 border-b-2 pb-2.5 text-sm transition-colors ${
                activeTab === item.key ? "border-leaf-700 font-semibold text-gray-900" : "border-transparent font-medium text-gray-500 hover:text-gray-800"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}

      {loaded && nodes.length > 0 && <HealthSummary nodes={nodes} />}

      {loaded && nodes.length > 0 && (
        <div className="grid gap-4 lg:grid-cols-3">
          <div className={showOverview ? "lg:col-span-2" : "lg:col-span-3"}><AdviceList nodes={nodes} /></div>
          {showOverview && <GreenhouseOverview greenhouses={greenhouses} onSelect={setTab} />}
        </div>
      )}

      <section>
        <SectionHeading title={t("telemetry.nodes")} count={nodes.length} />
        {loaded && allNodes.length === 0 ? (
          <div className="panel px-6 py-8 text-center">
            <p className="text-sm font-medium text-gray-800">{t("telemetry.noNodes")}</p>
            <p className="mt-1 text-sm text-gray-500">{t("telemetry.noNodesHint")}</p>
            <code className="mt-3 inline-block rounded bg-gray-100 px-2.5 py-1.5 text-xs text-gray-800">
              npm run simulate -- {user.company?._id} 2
            </code>
          </div>
        ) : (
          <div className="grid gap-4 xl:grid-cols-2">
            {nodes.map((node) => <NodeCard key={node._id} node={node} />)}
          </div>
        )}
      </section>

      <section>
        <SectionHeading title={t("dashboard.crops")} count={plants.length} />
        {plants.length === 0 ? (
          <p className="panel px-6 py-8 text-center text-sm text-gray-500">{t("dashboard.noPlants")}</p>
        ) : (
          <div className="panel overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="border-b border-gray-200 text-xs text-gray-500">
                <tr>
                  <th scope="col" className="px-4 py-2.5 font-medium">{t("dashboard.crops")}</th>
                  <th scope="col" className="px-4 py-2.5 font-medium">{t("greenhouses.placeIn")}</th>
                  <th scope="col" className="px-4 py-2.5 font-medium">{t("dashboard.cropType")}</th>
                  <th scope="col" className="px-4 py-2.5 font-medium">{t("dashboard.growthStage")}</th>
                  <th scope="col" className="px-4 py-2.5 font-medium">{t("dashboard.systemId")}</th>
                  <th scope="col" className="px-4 py-2.5 font-medium">{t("telemetry.healthScore")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {plants.map((plant) => (
                  <tr key={plant._id} className="hover:bg-gray-50">
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-3">
                        <img src={plant.image} alt="" className="h-9 w-9 shrink-0 rounded object-cover" />
                        <div className="min-w-0">
                          <p className="truncate font-medium text-gray-900">{plant.name}</p>
                          <p className="truncate text-xs italic text-gray-500">{plant.species}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-gray-600">{plant.greenhouse ? displayCode(t, plant.greenhouse) : "—"}</td>
                    <td className="px-4 py-2.5 text-gray-600">{plant.cropType}</td>
                    <td className="px-4 py-2.5 text-gray-600">{plant.growthStage}</td>
                    <td className="px-4 py-2.5 font-mono text-xs text-gray-600">{plant.systemId}</td>
                    <td className="px-4 py-2.5">
                      <span className="flex items-center gap-1.5 text-gray-700">
                        <span className={`h-2 w-2 rounded-full ${PLANT_HEALTH_DOT[plant.healthStatus] || "bg-gray-300"}`} aria-hidden="true" />
                        {plant.healthStatus}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};

export default DashboardPage;
