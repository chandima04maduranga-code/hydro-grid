import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Activity, Droplets, Leaf, MapPin, Sprout, Thermometer } from "lucide-react";
import apiClient from "../api/axiosConfig";
import { useAuth } from "../context/AuthContext";
import { RoleBadge } from "../components/common/Badges";
import { formatDateTime } from "../utils/format";

const REFRESH_MS = 3000;

const SensorIcon = ({ type }) =>
  /moisture|humidity|water/i.test(type)
    ? <Droplets className="h-6 w-6 text-hydroCyan" aria-hidden="true" />
    : <Thermometer className="h-6 w-6 text-clay-500" aria-hidden="true" />;

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
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">{t("dashboard.greeting", { name: user.name })}</h1>
          <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-gray-500">
            <RoleBadge role={user.role} />
            <span>{t("dashboard.subtitle")}</span>
          </p>
        </div>
        {lastUpdated && (
          <p className="flex items-center gap-2 text-xs text-gray-500">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-tea-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-tea-500" />
            </span>
            {t("dashboard.updated", { time: formatDateTime(lastUpdated, i18n.language) })}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border-t-4 border-tea-600 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="rounded-full bg-tea-50 p-2"><Leaf className="h-5 w-5 text-tea-700" aria-hidden="true" /></div>
              <h2 className="text-lg font-bold text-gray-800">{t("dashboard.crops")}</h2>
            </div>
            <span className="rounded-full bg-tea-50 px-3 py-1 text-sm font-bold text-tea-700">
              {t("dashboard.systemsCount", { count: plants.length })}
            </span>
          </div>

          {plants.length === 0 ? (
            <div className="flex flex-col items-center rounded-xl border border-dashed border-tea-200 py-12 text-center">
              <Sprout className="h-10 w-10 text-tea-300" aria-hidden="true" />
              <p className="mt-3 text-sm text-gray-500">{t("dashboard.noPlants")}</p>
            </div>
          ) : (
            <ul className="space-y-4">
              {plants.map((plant) => (
                <li key={plant._id} className="flex gap-4 rounded-xl border border-gray-100 p-4 transition hover:shadow-md">
                  <img src={plant.image} alt={plant.name} className="h-24 w-28 shrink-0 rounded-lg object-cover" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-bold text-gray-900">{plant.name}</h3>
                        <p className="text-sm italic text-gray-500">{plant.species}</p>
                      </div>
                      <span className={`whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-bold ${
                        plant.healthStatus === "Healthy" ? "bg-tea-50 text-tea-700" : "bg-gold-100 text-gold-600"
                      }`}>
                        {plant.healthStatus}
                      </span>
                    </div>
                    <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-gray-600">
                      <dt className="text-gray-400">{t("dashboard.cropType")}</dt><dd className="font-medium">{plant.cropType}</dd>
                      <dt className="text-gray-400">{t("dashboard.systemId")}</dt><dd className="font-medium">{plant.systemId}</dd>
                      <dt className="text-gray-400">{t("dashboard.growthStage")}</dt><dd className="font-medium">{plant.growthStage}</dd>
                    </dl>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-2xl border-t-4 border-hydroCyan bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="rounded-full bg-hydroLightCyan p-2"><Activity className="h-5 w-5 text-hydroCyan" aria-hidden="true" /></div>
              <h2 className="text-lg font-bold text-gray-800">{t("dashboard.telemetry")}</h2>
            </div>
            <span className="rounded-full bg-hydroLightCyan px-3 py-1 text-sm font-bold text-hydroCyan">
              {t("dashboard.nodesCount", { count: sensors.length })}
            </span>
          </div>

          {sensors.length === 0 ? (
            <div className="flex flex-col items-center rounded-xl border border-dashed border-cyan-200 py-12 text-center">
              <Activity className="h-10 w-10 text-cyan-200" aria-hidden="true" />
              <p className="mt-3 text-sm text-gray-500">{t("dashboard.noTelemetry")}</p>
            </div>
          ) : (
            <ul className="space-y-4">
              {sensors.map((sensor) => (
                <li key={sensor._id} className="flex items-center gap-4 rounded-xl border border-gray-100 p-5">
                  <div className="rounded-full bg-hydroLightCyan p-3"><SensorIcon type={sensor.type} /></div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-gray-700">{sensor.type}</p>
                    <p className="mt-0.5 text-2xl font-extrabold text-hydroCyan">
                      {sensor.value} <span className="text-base font-semibold">{sensor.unit}</span>
                    </p>
                    <p className="mt-1 flex items-center gap-1 text-xs text-gray-400">
                      <MapPin className="h-3 w-3" aria-hidden="true" />
                      {t("dashboard.location")}: {sensor.location} · {sensor.hardwareId}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
};

export default DashboardPage;
