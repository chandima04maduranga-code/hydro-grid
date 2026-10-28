import { useEffect, useState } from "react";
import { Link, useLocation, useSearchParams } from "react-router";
import { useTranslation } from "react-i18next";
import { Leaf, LoaderCircle, Plus, Search, SlidersHorizontal, X } from "lucide-react";
import apiClient, { getErrorCode } from "../api/axiosConfig";
import { useAuth } from "../context/AuthContext";
import Alert from "../components/common/Alert";
import CropCard from "../components/plants/CropCard";
import { useGreenhouses } from "../hooks/useGreenhouses";
import { displayCode } from "../utils/greenhouses";
import { CROP_TYPES, GROWTH_STAGES, HEALTH_STATUSES, SORTS, canEditPlants } from "../utils/plants";

const SEARCH_DELAY_MS = 300;
const FILTERS = ["greenhouse", "cropType", "growthStage", "healthStatus"];

const selectClass = "h-9 rounded-md border border-gray-300 bg-white px-2.5 text-sm text-gray-800 focus:border-leaf-500 focus:outline-none focus:ring-2 focus:ring-leaf-500/20";

const CropsPage = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const location = useLocation();
  const { greenhouses } = useGreenhouses();
  // Search, filters and sort live in the address, so a filtered list can be bookmarked or shared
  const [params, setParams] = useSearchParams();
  const [searchText, setSearchText] = useState(params.get("q") || "");
  // Results remember which search they belong to, so "loading" is derived
  const [result, setResult] = useState({ query: null, plants: [], errorCode: "" });

  const query = params.toString();
  const loading = result.query !== query;
  const { plants, errorCode } = result;
  const activeFilters = FILTERS.filter((key) => params.get(key)).length + (params.get("q") ? 1 : 0);

  const setParam = (key, value) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: true });
  };

  // Wait until typing pauses before searching
  useEffect(() => {
    const timer = setTimeout(() => {
      const text = searchText.trim();
      if ((params.get("q") || "") === text) return;
      const next = new URLSearchParams(params);
      if (text) next.set("q", text);
      else next.delete("q");
      setParams(next, { replace: true });
    }, SEARCH_DELAY_MS);
    return () => clearTimeout(timer);
  }, [searchText, params, setParams]);

  useEffect(() => {
    let cancelled = false;
    apiClient.get(`/plants?${query}`)
      .then(({ data }) => {
        if (!cancelled) setResult({ query, plants: data, errorCode: "" });
      })
      .catch((error) => {
        if (!cancelled) setResult((current) => ({ ...current, query, errorCode: getErrorCode(error) }));
      });
    return () => {
      cancelled = true;
    };
  }, [query]);

  const clearFilters = () => {
    setSearchText("");
    setParams(params.get("sort") ? { sort: params.get("sort") } : {}, { replace: true });
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">{t("plants.title")}</h1>
          <p className="mt-1 text-sm text-gray-600">{t("plants.subtitle")}</p>
        </div>
        {canEditPlants(user) && (
          <Link to="/crops/new" className="btn btn-primary">
            <Plus className="h-4 w-4" aria-hidden="true" />
            {t("plants.add")}
          </Link>
        )}
      </div>

      {location.state?.notice && <Alert tone="success">{location.state.notice}</Alert>}

      <section className="panel space-y-3 p-3" aria-label={t("plants.filters")}>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" aria-hidden="true" />
          <input
            type="search"
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
            placeholder={t("plants.searchPlaceholder")}
            aria-label={t("plants.search")}
            maxLength={80}
            className="h-10 w-full rounded-md border border-gray-300 bg-white pl-9 pr-3 text-sm focus:border-leaf-500 focus:outline-none focus:ring-2 focus:ring-leaf-500/20"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-gray-400" aria-hidden="true" />
          <select aria-label={t("plants.greenhouse")} className={selectClass} value={params.get("greenhouse") || ""} onChange={(event) => setParam("greenhouse", event.target.value)}>
            <option value="">{t("plants.allGreenhouses")}</option>
            {greenhouses.map((greenhouse) => <option key={greenhouse._id} value={greenhouse._id}>{displayCode(t, greenhouse)} · {greenhouse.name}</option>)}
          </select>
          <select aria-label={t("plants.cropType")} className={selectClass} value={params.get("cropType") || ""} onChange={(event) => setParam("cropType", event.target.value)}>
            <option value="">{t("plants.allTypes")}</option>
            {CROP_TYPES.map((type) => <option key={type} value={type}>{t(`plants.cropTypes.${type}`)}</option>)}
          </select>
          <select aria-label={t("plants.growthStage")} className={selectClass} value={params.get("growthStage") || ""} onChange={(event) => setParam("growthStage", event.target.value)}>
            <option value="">{t("plants.allStages")}</option>
            {GROWTH_STAGES.map((stage) => <option key={stage} value={stage}>{t(`plants.stages.${stage}`)}</option>)}
          </select>
          <select aria-label={t("plants.healthStatus")} className={selectClass} value={params.get("healthStatus") || ""} onChange={(event) => setParam("healthStatus", event.target.value)}>
            <option value="">{t("plants.allHealth")}</option>
            {HEALTH_STATUSES.map((status) => <option key={status} value={status}>{t(`plants.health.${status}`)}</option>)}
          </select>
          <label className="ml-auto flex items-center gap-2 text-sm text-gray-600">
            {t("plants.sortBy")}
            <select className={selectClass} value={params.get("sort") || "newest"} onChange={(event) => setParam("sort", event.target.value === "newest" ? "" : event.target.value)}>
              {SORTS.map((sort) => <option key={sort} value={sort}>{t(`plants.sorts.${sort}`)}</option>)}
            </select>
          </label>
        </div>
        {activeFilters > 0 && (
          <button type="button" onClick={clearFilters} className="inline-flex items-center gap-1 text-xs font-semibold text-leaf-700 hover:underline">
            <X className="h-3.5 w-3.5" aria-hidden="true" />
            {t("plants.clearFilters", { count: activeFilters })}
          </button>
        )}
      </section>

      {errorCode && <Alert tone="error">{t(`errors.${errorCode}`, { defaultValue: t("errors.default") })}</Alert>}

      <p className="text-sm text-gray-500" aria-live="polite">
        {loading ? t("common.loading") : t("plants.count", { count: plants.length })}
      </p>

      {loading && plants.length === 0 ? (
        <div className="flex justify-center py-16">
          <LoaderCircle className="h-8 w-8 animate-spin text-leaf-600" aria-label={t("common.loading")} />
        </div>
      ) : plants.length === 0 ? (
        <div className="panel flex flex-col items-center px-6 py-14 text-center">
          <Leaf className="h-10 w-10 text-leaf-400" aria-hidden="true" />
          <p className="mt-3 font-semibold text-gray-800">{activeFilters ? t("plants.noMatches") : t("plants.empty")}</p>
          <p className="mt-1 max-w-md text-sm text-gray-500">
            {activeFilters ? t("plants.noMatchesHint") : canEditPlants(user) ? t("plants.emptyEditor") : t("plants.emptyViewer")}
          </p>
        </div>
      ) : (
        <div className={`grid grid-cols-2 gap-3 transition-opacity md:grid-cols-3 xl:grid-cols-4 ${loading ? "opacity-60" : ""}`}>
          {plants.map((plant) => <CropCard key={plant._id} plant={plant} />)}
        </div>
      )}
    </div>
  );
};

export default CropsPage;
