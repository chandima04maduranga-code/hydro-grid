import { useEffect, useState } from "react";
import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import { ChevronRight, Cpu, Leaf, Warehouse } from "lucide-react";
import { useGreenhouses } from "../hooks/useGreenhouses";
import { displayCode } from "../utils/greenhouses";
import apiClient from "../api/axiosConfig";
import { useAuth } from "../context/AuthContext";
import HealthSummary from "../components/telemetry/HealthSummary";
import HealthRing from "../components/telemetry/HealthRing";
import AdviceList from "../components/telemetry/AdviceList";
import NodeCard from "../components/telemetry/NodeCard";
import TimeOfDayBanner from "../components/dashboard/TimeOfDayBanner";
import { useTelemetryNodes } from "../hooks/useTelemetry";
import { HEALTH_COLORS, healthLevel } from "../utils/metrics";

const PLANTS_REFRESH_MS = 30000;

const PLANT_HEALTH_STYLES = {
  Healthy: "bg-emerald-100 text-emerald-800",
  "Nutrient Warning": "bg-amber-100 text-amber-800",
  Critical: "bg-red-100 text-red-800"
};

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

const SectionHeading = ({ icon: Icon, title, count }) => (
  <div className="mb-3 flex items-center gap-2">
    <span className="flex h-7 w-7 items-center justify-center rounded-md bg-leaf-100 text-leaf-700">
      <Icon className="h-4 w-4" aria-hidden="true" />
    </span>
    <h2 className="font-semibold text-gray-900">{title}</h2>
    <span className="rounded-full bg-gray-200 px-2 text-xs font-semibold tabular-nums text-gray-700">{count}</span>
  </div>
);

// Right-hand panel: every greenhouse with its health ring and problem counts
const GreenhouseOverview = ({ greenhouses, onSelect }) => {
  const { t } = useTranslation();
  return (
    <section className="panel h-full p-4">
      <header className="mb-3 flex items-center justify-between">
        <h2 className="flex items-center gap-2 font-semibold text-gray-900">
          <Warehouse className="h-4 w-4 text-leaf-700" aria-hidden="true" />
          {t("nav.greenhouses")}
        </h2>
        <Link to="/greenhouses" className="text-xs font-semibold text-leaf-700 hover:underline">{t("greenhouses.details")}</Link>
      </header>
      <ul className="space-y-2">
        {greenhouses.map((greenhouse) => {
          const { summary } = greenhouse;
          const tint = summary.healthScore === null ? "bg-gray-50 ring-gray-200" : HEALTH_COLORS[healthLevel(summary.healthScore)].tint;
          return (
            <li key={greenhouse._id}>
              <button type="button" onClick={() => onSelect(greenhouse._id)} className={`flex w-full items-center gap-3 rounded-lg p-3 text-left ring-1 transition hover:brightness-95 ${tint}`}>
                {summary.healthScore !== null
                  ? <HealthRing score={summary.healthScore} size={40} />
                  : <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-200 text-xs text-gray-500">—</span>}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-gray-900">{greenhouse.name}</p>
                  <p className="text-xs text-gray-600">{displayCode(t, greenhouse)}</p>
                  <p className="mt-1 flex flex-wrap gap-1 text-[11px] font-semibold">
                    {summary.criticalCount > 0 && <span className="rounded bg-red-600 px-1.5 text-white">{t("telemetry.criticalCount", { count: summary.criticalCount })}</span>}
                    {summary.warningCount > 0 && <span className="rounded bg-amber-500 px-1.5 text-white">{t("telemetry.warningCount", { count: summary.warningCount })}</span>}
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 shrink-0 text-gray-400" aria-hidden="true" />
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
};

const CropCard = ({ plant }) => {
  const { t } = useTranslation();
  return (
    <article className="panel overflow-hidden">
      <div className="relative h-28 bg-leaf-50">
        {plant.image && <img src={plant.image} alt="" className="h-full w-full object-cover" loading="lazy" />}
        <span className={`absolute right-2 top-2 rounded-full px-2 py-0.5 text-[11px] font-semibold shadow-sm ${PLANT_HEALTH_STYLES[plant.healthStatus] || "bg-gray-100 text-gray-700"}`}>
          {plant.healthStatus}
        </span>
      </div>
      <div className="p-3">
        <p className="truncate font-semibold text-gray-900">{plant.name}</p>
        <p className="truncate text-xs italic text-gray-500">{plant.species}</p>
        <div className="mt-2 flex flex-wrap gap-1 text-[11px]">
          {plant.greenhouse && <span className="rounded bg-gray-100 px-1.5 py-0.5 text-gray-700">{displayCode(t, plant.greenhouse)}</span>}
          <span className="rounded bg-leaf-50 px-1.5 py-0.5 font-medium text-leaf-800">{plant.growthStage}</span>
          <span className="rounded bg-sky-50 px-1.5 py-0.5 font-mono text-sky-800">{plant.systemId}</span>
        </div>
      </div>
    </article>
  );
};

const DashboardPage = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { nodes: allNodes, loaded, lastUpdated } = useTelemetryNodes();
  const { greenhouses } = useGreenhouses();
  const allPlants = usePlants();
  const [tab, setTab] = useState("all");

  // Greenhouse chips: everything, one per greenhouse, and unplaced nodes (admins only see those)
  const unplacedCount = allNodes.filter((node) => !node.greenhouse).length;
  const tabs = [
    { key: "all", label: t("greenhouses.allGreenhouses") },
    ...greenhouses.map((greenhouse) => ({ key: greenhouse._id, label: `${displayCode(t, greenhouse)} · ${greenhouse.name}`, score: greenhouse.summary.healthScore })),
    ...(unplacedCount > 0 ? [{ key: "none", label: t("greenhouses.unplaced") }] : [])
  ];
  const activeTab = tabs.some((item) => item.key === tab) ? tab : "all";
  const inTab = (item) => (activeTab === "none" ? !item.greenhouse : item.greenhouse?._id === activeTab);
  const nodes = activeTab === "all" ? allNodes : allNodes.filter(inTab);
  const plants = activeTab === "all" ? allPlants : allPlants.filter(inTab);
  const showOverview = activeTab === "all" && greenhouses.length > 0;
  const selectedGreenhouse = greenhouses.find((greenhouse) => greenhouse._id === activeTab);

  return (
    <div className="space-y-6">
      <TimeOfDayBanner name={user.name} company={user.company} lastUpdated={lastUpdated} crop={selectedGreenhouse?.mainCrop} />

      {tabs.length > 2 && (
        <div role="tablist" aria-label={t("nav.greenhouses")} className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
          {tabs.map((item) => {
            const active = activeTab === item.key;
            const dot = item.score === undefined || item.score === null ? null : { good: "bg-emerald-500", fair: "bg-amber-500", poor: "bg-red-600" }[healthLevel(item.score)];
            return (
              <button
                key={item.key}
                role="tab"
                type="button"
                aria-selected={active}
                onClick={() => setTab(item.key)}
                className={`flex shrink-0 items-center gap-2 rounded-full px-3.5 py-1.5 text-sm font-medium ring-1 transition ${
                  active ? "bg-leaf-700 text-white ring-leaf-700" : "bg-white text-gray-700 ring-gray-200 hover:bg-gray-50"
                }`}
              >
                {dot && <span className={`h-2 w-2 rounded-full ${dot} ${active ? "ring-2 ring-white/70" : ""}`} aria-hidden="true" />}
                {item.label}
              </button>
            );
          })}
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
        <SectionHeading icon={Cpu} title={t("telemetry.nodes")} count={nodes.length} />
        {loaded && allNodes.length === 0 ? (
          <div className="panel px-6 py-8 text-center">
            <p className="text-sm font-medium text-gray-800">{t("telemetry.noNodes")}</p>
            <p className="mt-1 text-sm text-gray-500">{t("telemetry.noNodesHint")}</p>
          </div>
        ) : (
          <div className="grid gap-4 2xl:grid-cols-2">
            {nodes.map((node) => <NodeCard key={node._id} node={node} />)}
          </div>
        )}
      </section>

      <section>
        <SectionHeading icon={Leaf} title={t("dashboard.crops")} count={plants.length} />
        {plants.length === 0 ? (
          <p className="panel px-6 py-8 text-center text-sm text-gray-500">{t("dashboard.noPlants")}</p>
        ) : (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
            {plants.map((plant) => <CropCard key={plant._id} plant={plant} />)}
          </div>
        )}
      </section>
    </div>
  );
};

export default DashboardPage;
