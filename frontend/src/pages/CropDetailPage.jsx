import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router";
import { useTranslation } from "react-i18next";
import {
  ArrowLeft, CalendarCheck, CalendarDays, Cpu, Hash, Leaf, LoaderCircle, NotebookPen, Pencil, Sprout, Trash2, UserRound, Warehouse
} from "lucide-react";
import apiClient, { getErrorCode } from "../api/axiosConfig";
import { useAuth } from "../context/AuthContext";
import Alert from "../components/common/Alert";
import ConfirmDialog from "../components/common/ConfirmDialog";
import { displayCode } from "../utils/greenhouses";
import { formatDateTime } from "../utils/format";
import { HEALTH_STYLES, STAGE_STYLES, canEditPlants, daysUntil } from "../utils/plants";

const formatDay = (value, language) =>
  value ? new Intl.DateTimeFormat(language === "si" ? "si-LK" : "en-LK", { day: "numeric", month: "short", year: "numeric" }).format(new Date(value)) : "—";

const Detail = ({ icon: Icon, label, children }) => (
  <div className="flex items-start gap-3 py-2.5">
    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-leaf-50 text-leaf-700">
      <Icon className="h-4 w-4" aria-hidden="true" />
    </span>
    <div className="min-w-0">
      <dt className="text-xs text-gray-500">{label}</dt>
      <dd className="break-words text-sm font-medium text-gray-900">{children}</dd>
    </div>
  </div>
);

const CropDetailPage = () => {
  const { id } = useParams();
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [plant, setPlant] = useState(null);
  const [missing, setMissing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [errorCode, setErrorCode] = useState("");

  useEffect(() => {
    let cancelled = false;
    apiClient.get(`/plants/${id}`)
      .then(({ data }) => {
        if (!cancelled) setPlant(data);
      })
      .catch(() => {
        if (!cancelled) setMissing(true);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  const remove = async () => {
    setConfirmDelete(false);
    setDeleting(true);
    try {
      await apiClient.delete(`/plants/${id}`);
      navigate("/crops", { replace: true, state: { notice: t("plants.deleted", { name: plant.name }) } });
    } catch (error) {
      setErrorCode(getErrorCode(error));
      setDeleting(false);
    }
  };

  const backLink = (
    <Link to="/crops" className="inline-flex items-center gap-1.5 text-sm font-semibold text-leaf-700 hover:underline">
      <ArrowLeft className="h-4 w-4" aria-hidden="true" />
      {t("plants.back")}
    </Link>
  );

  if (missing) return <div className="space-y-4">{backLink}<Alert tone="error">{t("errors.PLANT_NOT_FOUND")}</Alert></div>;
  if (!plant) {
    return (
      <div className="flex justify-center py-20">
        <LoaderCircle className="h-8 w-8 animate-spin text-leaf-600" aria-label={t("common.loading")} />
      </div>
    );
  }

  const health = HEALTH_STYLES[plant.healthStatus] || HEALTH_STYLES.healthy;
  const days = daysUntil(plant.expectedHarvestOn);

  return (
    <div className="space-y-5">
      {backLink}
      {location.state?.notice && <Alert tone="success">{location.state.notice}</Alert>}
      {errorCode && <Alert tone="error">{t(`errors.${errorCode}`, { defaultValue: t("errors.default") })}</Alert>}

      <section className="panel overflow-hidden">
        <div className="relative h-48 bg-leaf-50 sm:h-64">
          {plant.image
            ? <img src={plant.image} alt={plant.name} className="h-full w-full object-cover" />
            : <span className="flex h-full items-center justify-center text-leaf-500"><Leaf className="h-16 w-16" aria-hidden="true" /></span>}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" aria-hidden="true" />
          <div className="absolute inset-x-0 bottom-0 p-5 text-white">
            <div className="flex flex-wrap gap-2 text-xs font-semibold">
              <span className={`rounded-full px-2.5 py-0.5 ${health.chip}`}>{t(`plants.health.${plant.healthStatus}`)}</span>
              <span className={`rounded-full px-2.5 py-0.5 ${STAGE_STYLES[plant.growthStage]}`}>{t(`plants.stages.${plant.growthStage}`)}</span>
            </div>
            <h1 className="mt-2 text-2xl font-semibold">{plant.name}</h1>
            <p className="text-sm italic text-white/85">{plant.species}</p>
          </div>
        </div>
        {canEditPlants(user) && (
          <div className="flex flex-wrap justify-end gap-2 border-t border-gray-100 p-3">
            <Link to={`/crops/${plant._id}/edit`} className="btn btn-secondary">
              <Pencil className="h-4 w-4" aria-hidden="true" />
              {t("plants.edit")}
            </Link>
            <button type="button" onClick={() => setConfirmDelete(true)} disabled={deleting} className="btn btn-danger">
              {deleting ? <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Trash2 className="h-4 w-4" aria-hidden="true" />}
              {t("plants.delete")}
            </button>
          </div>
        )}
      </section>

      <div className="grid gap-5 lg:grid-cols-2">
        <section className="panel p-5">
          <h2 className="mb-1 font-semibold text-gray-900">{t("plants.details")}</h2>
          <dl className="divide-y divide-gray-100">
            <Detail icon={Sprout} label={t("plants.cropType")}>{t(`plants.cropTypes.${plant.cropType}`)}</Detail>
            <Detail icon={Warehouse} label={t("plants.greenhouse")}>
              {plant.greenhouse
                ? <Link to={`/greenhouses/${plant.greenhouse._id}`} className="text-leaf-700 hover:underline">{displayCode(t, plant.greenhouse)} · {plant.greenhouse.name}</Link>
                : "—"}
            </Detail>
            <Detail icon={Cpu} label={t("plants.sensorNode")}>
              {plant.systemId
                ? <Link to={`/nodes/${encodeURIComponent(plant.systemId)}`} className="font-mono text-leaf-700 hover:underline">{plant.systemId}</Link>
                : t("plants.noNode")}
            </Detail>
            <Detail icon={Hash} label={t("plants.plantCount")}>{plant.plantCount ?? "—"}</Detail>
          </dl>
        </section>

        <section className="panel p-5">
          <h2 className="mb-1 font-semibold text-gray-900">{t("plants.timeline")}</h2>
          <dl className="divide-y divide-gray-100">
            <Detail icon={CalendarDays} label={t("plants.plantedOn")}>{formatDay(plant.plantedOn, i18n.language)}</Detail>
            <Detail icon={CalendarCheck} label={t("plants.expectedHarvestOn")}>
              {formatDay(plant.expectedHarvestOn, i18n.language)}
              {days !== null && (
                <span className={`ml-2 rounded px-1.5 py-0.5 text-xs ${days < 0 ? "bg-red-100 text-red-800" : "bg-leaf-50 text-leaf-800"}`}>
                  {days < 0 ? t("plants.harvestOverdue", { count: -days }) : days === 0 ? t("plants.harvestToday") : t("plants.harvestIn", { count: days })}
                </span>
              )}
            </Detail>
            <Detail icon={UserRound} label={t("plants.addedBy")}>
              {plant.createdBy?.name || "—"} · {formatDateTime(plant.createdAt, i18n.language)}
            </Detail>
            <Detail icon={Pencil} label={t("plants.lastChanged")}>
              {plant.updatedBy?.name || "—"} · {formatDateTime(plant.updatedAt, i18n.language)}
            </Detail>
          </dl>
        </section>
      </div>

      {plant.notes && (
        <section className="panel p-5">
          <h2 className="mb-2 flex items-center gap-2 font-semibold text-gray-900">
            <NotebookPen className="h-4 w-4 text-leaf-700" aria-hidden="true" />
            {t("plants.notes")}
          </h2>
          <p className="whitespace-pre-line text-sm text-gray-700">{plant.notes}</p>
        </section>
      )}

      <ConfirmDialog
        open={confirmDelete}
        message={t("plants.confirmDelete", { name: plant.name })}
        confirmLabel={t("plants.delete")}
        onCancel={() => setConfirmDelete(false)}
        onConfirm={remove}
      />
    </div>
  );
};

export default CropDetailPage;
