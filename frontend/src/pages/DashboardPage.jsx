import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Building2, CalendarDays, Cpu, Droplet, Leaf, Sprout, Warehouse } from "lucide-react";
import { useGreenhouses } from "../hooks/useGreenhouses";
import { displayCode } from "../utils/greenhouses";
import apiClient from "../api/axiosConfig";
import { useAuth } from "../context/AuthContext";
import { RoleBadge } from "../components/common/Badges";
import HealthSummary from "../components/telemetry/HealthSummary";
import AdviceList from "../components/telemetry/AdviceList";
import NodeCard from "../components/telemetry/NodeCard";
import { useTelemetryNodes } from "../hooks/useTelemetry";
import { formatDateTime } from "../utils/format";

const PLANTS_REFRESH_MS = 30000;

const HEALTH_STYLES = {
  Healthy: { pill: "bg-leaf-50 text-leaf-700 ring-leaf-500/20", dot: "bg-leaf-500" },
  "Nutrient Warning": { pill: "bg-gold-100 text-gold-600 ring-gold-400/30", dot: "bg-gold-500" },
  Critical: { pill: "bg-red-50 text-red-700 ring-red-500/20", dot: "bg-red-500" }
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

const SectionTitle = ({ icon: Icon, title, count, tone }) => (
  <div className="mb-4 flex items-center gap-3">
    <span className={`flex h-10 w-10 items-center justify-center rounded-full ${tone}`}>
      <Icon className="h-5 w-5" aria-hidden="true" />
    </span>
    <h2 className="text-xl font-extrabold text-gray-900">{title}</h2>
    <span className="rounded-full bg-white/80 px-2.5 py-0.5 text-sm font-bold text-gray-600 ring-1 ring-gray-200">{count}</span>
  </div>
);

const DashboardPage = () => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const { nodes: allNodes, loaded, lastUpdated } = useTelemetryNodes();
  const { greenhouses } = useGreenhouses();
  const allPlants = usePlants();
  const [tab, setTab] = useState("all");

  // Greenhouse tabs: everything, one per greenhouse, and unplaced nodes (admins only see those)
  const unplacedCount = allNodes.filter((node) => !node.greenhouse).length;
  const tabs = [
    { key: "all", label: t("greenhouses.allGreenhouses"), count: allNodes.length },
    ...greenhouses.map((greenhouse) => ({
      key: greenhouse._id,
      label: `${displayCode(t, greenhouse)} · ${greenhouse.name}`,
      count: allNodes.filter((node) => node.greenhouse?._id === greenhouse._id).length
    })),
    ...(unplacedCount > 0 ? [{ key: "none", label: t("greenhouses.unplaced"), count: unplacedCount }] : [])
  ];
  const activeTab = tabs.some((item) => item.key === tab) ? tab : "all";
  const inTab = (item) => (activeTab === "none" ? !item.greenhouse : item.greenhouse?._id === activeTab);
  const nodes = activeTab === "all" ? allNodes : allNodes.filter(inTab);
  const plants = activeTab === "all" ? allPlants : allPlants.filter(inTab);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 sm:text-3xl">{t("dashboard.greeting", { name: user.name })}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-gray-600">
            <RoleBadge role={user.role} />
            {user.company && (
              <span className="inline-flex items-center gap-1.5 font-semibold text-tea-800">
                <Building2 className="h-4 w-4 text-leaf-600" aria-hidden="true" />
                {user.company.name} · {t(`districts.${user.company.district}`)}
              </span>
            )}
          </div>
        </div>
        {lastUpdated && (
          <p className="glass flex items-center gap-2 rounded-full px-3 py-1.5 text-xs text-gray-600">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-leaf-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-leaf-500" />
            </span>
            {t("dashboard.updated", { time: formatDateTime(lastUpdated, i18n.language) })}
          </p>
        )}
      </div>

      {tabs.length > 2 && (
        <div role="tablist" aria-label={t("nav.greenhouses")} className="glass flex gap-1 overflow-x-auto rounded-2xl p-1.5 shadow-sm">
          {tabs.map((item) => (
            <button
              key={item.key}
              role="tab"
              type="button"
              aria-selected={activeTab === item.key}
              onClick={() => setTab(item.key)}
              className={`flex shrink-0 items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-semibold transition ${
                activeTab === item.key ? "bg-leaf-600 text-white shadow-sm" : "text-gray-600 hover:bg-white/80 hover:text-gray-900"
              }`}
            >
              {item.key !== "all" && item.key !== "none" && <Warehouse className="h-4 w-4" aria-hidden="true" />}
              {item.label}
              <span className={`rounded-full px-2 text-xs ${activeTab === item.key ? "bg-white/20" : "bg-gray-100"}`}>{item.count}</span>
            </button>
          ))}
        </div>
      )}

      {loaded && nodes.length > 0 && (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-1"><HealthSummary nodes={nodes} /></div>
          <div className="lg:col-span-2"><AdviceList nodes={nodes} /></div>
        </div>
      )}

      <section>
        <SectionTitle icon={Cpu} title={t("telemetry.nodes")} count={nodes.length} tone="bg-cyan-50 text-cyan-600" />
        {loaded && allNodes.length === 0 ? (
          <div className="glass rounded-3xl p-8 text-center">
            <Cpu className="mx-auto h-10 w-10 text-cyan-400" aria-hidden="true" />
            <p className="mt-3 font-semibold text-gray-800">{t("telemetry.noNodes")}</p>
            <p className="mt-1 text-sm text-gray-500">{t("telemetry.noNodesHint")}</p>
            <code className="mt-3 inline-block rounded-lg bg-tea-900 px-3 py-2 text-xs text-leaf-100">
              npm run simulate -- {user.company?._id} 2
            </code>
          </div>
        ) : (
          <div className="grid gap-6 xl:grid-cols-2">
            {nodes.map((node) => <NodeCard key={node._id} node={node} />)}
          </div>
        )}
      </section>

      <section>
        <SectionTitle icon={Leaf} title={t("dashboard.crops")} count={plants.length} tone="bg-leaf-50 text-leaf-600" />
        {plants.length === 0 ? (
          <div className="glass flex flex-col items-center rounded-3xl py-10 text-center">
            <Sprout className="h-10 w-10 text-leaf-400" aria-hidden="true" />
            <p className="mt-3 text-sm text-gray-500">{t("dashboard.noPlants")}</p>
          </div>
        ) : (
          <ul className="grid gap-4 lg:grid-cols-2">
            {plants.map((plant) => {
              const health = HEALTH_STYLES[plant.healthStatus] || HEALTH_STYLES.Healthy;
              return (
                <li key={plant._id} className="glass flex flex-col gap-4 rounded-2xl p-4 shadow-sm sm:flex-row">
                  <img src={plant.image} alt={plant.name} className="h-36 w-full shrink-0 rounded-xl object-cover sm:h-28 sm:w-36" />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <h3 className="text-lg font-bold text-gray-900">{plant.name}</h3>
                        <p className="text-sm italic text-gray-500">({plant.species})</p>
                        {plant.greenhouse && (
                          <p className="mt-1 inline-flex items-center gap-1 rounded-md bg-leaf-50 px-1.5 py-0.5 text-xs font-semibold text-leaf-700">
                            <Warehouse className="h-3 w-3" aria-hidden="true" />
                            {displayCode(t, plant.greenhouse)} · {plant.greenhouse.name}
                          </p>
                        )}
                      </div>
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ring-1 ring-inset ${health.pill}`}>
                        <span className={`h-2 w-2 rounded-full ${health.dot}`} />
                        {plant.healthStatus}
                      </span>
                    </div>
                    <dl className="mt-3 space-y-1.5 text-sm">
                      {[
                        { icon: Sprout, label: t("dashboard.cropType"), value: plant.cropType, color: "text-leaf-600" },
                        { icon: Droplet, label: t("dashboard.systemId"), value: plant.systemId, color: "text-cyan-600" },
                        { icon: CalendarDays, label: t("dashboard.growthStage"), value: plant.growthStage, color: "text-gray-500" }
                      ].map(({ icon: Icon, label, value, color }) => (
                        <div key={label} className="grid grid-cols-[1.25rem_7.5rem_1fr] items-center gap-2">
                          <Icon className={`h-4 w-4 ${color}`} aria-hidden="true" />
                          <dt className="text-gray-500">{label}</dt>
                          <dd className="font-medium text-gray-800">{value}</dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
};

export default DashboardPage;
