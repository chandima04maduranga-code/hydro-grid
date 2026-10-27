import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { LoaderCircle, MapPin, Plus, Warehouse } from "lucide-react";
import apiClient, { getErrorCode } from "../api/axiosConfig";
import { useAuth } from "../context/AuthContext";
import Alert from "../components/common/Alert";
import GreenhouseCard from "../components/greenhouses/GreenhouseCard";
import GreenhouseForm from "../components/greenhouses/GreenhouseForm";
import { useGreenhouses } from "../hooks/useGreenhouses";
import { displayCode } from "../utils/greenhouses";

const GreenhousesPage = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const isAdmin = user.role === "admin";
  const { greenhouses, loaded, reload } = useGreenhouses();
  const [options, setOptions] = useState(null);
  const [adding, setAdding] = useState(false);
  const [notice, setNotice] = useState(null);

  const loadOptions = () => apiClient.get("/greenhouses/options").then(({ data }) => setOptions(data)).catch(() => {});

  useEffect(() => {
    if (!isAdmin) return undefined;
    let cancelled = false;
    apiClient.get("/greenhouses/options")
      .then(({ data }) => {
        if (!cancelled) setOptions(data);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [isAdmin]);

  const atLimit = options && options.limit !== null && options.used >= options.limit;
  const districts = [...new Set(greenhouses.map((greenhouse) => greenhouse.district))].sort();

  const createGreenhouse = async (payload) => {
    try {
      const { data } = await apiClient.post("/greenhouses", payload);
      setAdding(false);
      setNotice({ tone: "success", text: t("greenhouses.created", { code: displayCode(t, data) }) });
      reload();
      loadOptions();
      return null;
    } catch (error) {
      setNotice({ tone: "error", text: t(`errors.${getErrorCode(error)}`, { defaultValue: t("errors.default") }) });
      return error.response?.data?.errors || null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 sm:text-3xl">{t("greenhouses.title")}</h1>
          <p className="mt-1 text-sm text-gray-600">{t("greenhouses.subtitle")}</p>
        </div>
        {isAdmin && options && (
          <div className="flex flex-wrap items-center gap-3">
            <span className={`rounded-full px-3 py-1.5 text-xs font-semibold ${atLimit ? "bg-gold-100 text-gold-600" : "glass text-gray-600"}`}>
              {options.limit === null
                ? t("greenhouses.planUnlimited", { used: options.used })
                : t("greenhouses.planUsage", { used: options.used, limit: options.limit })}
            </span>
            <button
              type="button"
              onClick={() => setAdding(true)}
              disabled={atLimit || adding}
              title={atLimit ? t("greenhouses.planFull") : undefined}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-leaf-500 to-tea-600 px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-leaf-500/25 hover:from-leaf-600 hover:to-tea-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              {t("greenhouses.add")}
            </button>
          </div>
        )}
      </div>

      {notice && <Alert tone={notice.tone}>{notice.text}</Alert>}

      {adding && options && (
        <section className="glass rounded-3xl p-6 shadow-xl shadow-tea-900/10">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-extrabold text-gray-900">
            <Warehouse className="h-5 w-5 text-leaf-600" aria-hidden="true" />
            {t("greenhouses.addTitle")}
          </h2>
          <GreenhouseForm districts={options.districts} nextCodes={options.nextCodes} onSubmit={createGreenhouse} onCancel={() => setAdding(false)} />
        </section>
      )}

      {!loaded ? (
        <div className="flex justify-center py-16">
          <LoaderCircle className="h-8 w-8 animate-spin text-leaf-600" aria-label={t("common.loading")} />
        </div>
      ) : greenhouses.length === 0 ? (
        <div className="glass flex flex-col items-center rounded-3xl px-6 py-14 text-center">
          <Warehouse className="h-12 w-12 text-leaf-400" aria-hidden="true" />
          <p className="mt-3 font-semibold text-gray-800">{t("greenhouses.empty")}</p>
          <p className="mt-1 max-w-md text-sm text-gray-500">{isAdmin ? t("greenhouses.emptyAdmin") : t("greenhouses.emptyStaff")}</p>
        </div>
      ) : (
        districts.map((district) => (
          <section key={district}>
            <h2 className="mb-3 flex items-center gap-2 text-lg font-extrabold text-tea-800">
              <MapPin className="h-5 w-5 text-leaf-600" aria-hidden="true" />
              {t(`districts.${district}`)}
            </h2>
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {greenhouses
                .filter((greenhouse) => greenhouse.district === district)
                .map((greenhouse) => <GreenhouseCard key={greenhouse._id} greenhouse={greenhouse} />)}
            </div>
          </section>
        ))
      )}
    </div>
  );
};

export default GreenhousesPage;
