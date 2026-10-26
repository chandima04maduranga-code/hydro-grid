import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Activity, Building2, CalendarDays, Droplet, Droplets, Leaf, MapPin, Sprout, Thermometer } from "lucide-react";
import apiClient from "../api/axiosConfig";
import { useAuth } from "../context/AuthContext";
import { RoleBadge } from "../components/common/Badges";
import { formatDateTime } from "../utils/format";

const REFRESH_MS = 3000;

const HEALTH_STYLES = {
  Healthy: { pill: "bg-leaf-50 text-leaf-700 ring-leaf-500/20", dot: "bg-leaf-500" },
  "Nutrient Warning": { pill: "bg-gold-100 text-gold-600 ring-gold-400/30", dot: "bg-gold-500" },
  Critical: { pill: "bg-red-50 text-red-700 ring-red-500/20", dot: "bg-red-500" }
};

// Temperature readings (including water temperature) get the thermometer style
const isWaterReading = (type) => !/temp/i.test(type) && /moisture|humidity|water|level/i.test(type);

// Card shell: frosted panel with a coloured accent bar on top
const Panel = ({ accent, icon: Icon, iconClasses, title, subtitle, count, countLabel, countClasses, children }) => (
  <section className="glass overflow-hidden rounded-3xl shadow-xl shadow-tea-900/10">
    <div className={`h-1.5 ${accent}`} />
    <div className="p-5 sm:p-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <span className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full ${iconClasses}`}>
            <Icon className="h-7 w-7" aria-hidden="true" />
          </span>
          <div>
            <h2 className="text-xl font-extrabold text-gray-900">{title}</h2>
            <p className="text-sm text-gray-500">{subtitle}</p>
          </div>
        </div>
        <div className="flex items-center gap-2.5 rounded-2xl border border-white bg-white/80 px-3 py-2 shadow-sm">
          <span className={`flex h-9 w-9 items-center justify-center rounded-full text-base font-extrabold text-white ${countClasses}`}>
            {count}
          </span>
          <span className="max-w-20 text-xs font-semibold leading-tight text-gray-600">{countLabel}</span>
        </div>
      </div>
      {children}
    </div>
  </section>
);

const EmptyState = ({ icon: Icon, text, tone }) => (
  <div className={`flex flex-col items-center rounded-2xl border border-dashed bg-white/60 py-12 text-center ${tone}`}>
    <Icon className="h-10 w-10" aria-hidden="true" />
    <p className="mt-3 text-sm text-gray-500">{text}</p>
  </div>
);

const DashboardPage = () => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const [plants, setPlants] = useState([]);
  const [sensors, setSensors] = useState([]);
  const [lastUpdated, setLastUpdated] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const [plantsRes, sensorsRes] = await Promise.all([apiClient.get("/plants"), apiClient.get("/sensors")]);
        if (cancelled) return;
        setPlants(plantsRes.data);
        setSensors(sensorsRes.data);
        setLastUpdated(new Date());
      } catch {
        // 401 is handled globally; on network blips keep showing the last good data
      }
    };

    load();
    const timer = setInterval(load, REFRESH_MS);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, []);

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
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

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Panel
          accent="bg-gradient-to-r from-leaf-500 to-tea-600"
          icon={Leaf}
          iconClasses="bg-leaf-50 text-leaf-600"
          title={t("dashboard.crops")}
          subtitle={t("dashboard.cropsSubtitle")}
          count={plants.length}
          countLabel={t("dashboard.activeSystems")}
          countClasses="bg-leaf-600"
        >
          {plants.length === 0 ? (
            <EmptyState icon={Sprout} text={t("dashboard.noPlants")} tone="border-leaf-400/40 text-leaf-400" />
          ) : (
            <ul className="space-y-4">
              {plants.map((plant) => {
                const health = HEALTH_STYLES[plant.healthStatus] || HEALTH_STYLES.Healthy;
                return (
                  <li key={plant._id} className="flex flex-col gap-4 rounded-2xl bg-white/90 p-4 shadow-sm sm:flex-row">
                    <img src={plant.image} alt={plant.name} className="h-36 w-full shrink-0 rounded-xl object-cover sm:h-28 sm:w-36" />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <h3 className="text-lg font-bold text-gray-900">{plant.name}</h3>
                          <p className="text-sm italic text-gray-500">({plant.species})</p>
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
        </Panel>

        <Panel
          accent="bg-gradient-to-r from-cyan-500 to-hydroCyan"
          icon={Activity}
          iconClasses="bg-cyan-50 text-cyan-600"
          title={t("dashboard.telemetry")}
          subtitle={t("dashboard.telemetrySubtitle")}
          count={sensors.length}
          countLabel={t("dashboard.sensorNodes")}
          countClasses="bg-cyan-600"
        >
          {sensors.length === 0 ? (
            <EmptyState icon={Activity} text={t("dashboard.noTelemetry")} tone="border-cyan-300/50 text-cyan-300" />
          ) : (
            <ul className="space-y-4">
              {sensors.map((sensor) => {
                const water = isWaterReading(sensor.type);
                const Icon = water ? Droplets : Thermometer;
                return (
                  <li key={sensor._id} className="rounded-2xl bg-white/90 p-5 shadow-sm">
                    <div className="flex items-start gap-4">
                      <span className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full ${water ? "bg-cyan-50 text-cyan-600" : "bg-red-50 text-red-500"}`}>
                        <Icon className="h-7 w-7" aria-hidden="true" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <h3 className="text-lg font-bold text-gray-900">{sensor.type}</h3>
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-leaf-50 px-3 py-1 text-xs font-bold text-leaf-700 ring-1 ring-inset ring-leaf-500/20">
                            <span className="h-2 w-2 animate-pulse rounded-full bg-leaf-500" />
                            {t("dashboard.live")}
                          </span>
                        </div>
                        <p className={`mt-2 text-4xl font-extrabold tracking-tight ${water ? "text-cyan-700" : "text-red-600"}`}>
                          {sensor.value}
                          <span className="ml-1 text-xl font-bold">{sensor.unit}</span>
                        </p>
                        <p className="mt-2 flex items-center gap-1.5 text-xs text-gray-500">
                          <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                          {sensor.location} · <span className="font-semibold text-gray-700">{sensor.hardwareId}</span>
                        </p>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>
      </div>
    </div>
  );
};

export default DashboardPage;
