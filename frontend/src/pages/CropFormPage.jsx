import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { useTranslation } from "react-i18next";
import { ArrowLeft, CalendarDays, Cpu, Hash, ImageIcon, Leaf, LoaderCircle, Save, Sprout, Warehouse } from "lucide-react";
import apiClient, { getErrorCode } from "../api/axiosConfig";
import Alert from "../components/common/Alert";
import FormField from "../components/common/FormField";
import SelectField from "../components/common/SelectField";
import { useGreenhouses } from "../hooks/useGreenhouses";
import { useTelemetryNodes } from "../hooks/useTelemetry";
import { displayCode } from "../utils/greenhouses";
import { CROP_TYPES, GROWTH_STAGES, HEALTH_STATUSES, toDateInput, validatePlantForm } from "../utils/plants";

const EMPTY_FORM = {
  name: "",
  species: "",
  greenhouse: "",
  cropType: "",
  growthStage: "seedling",
  healthStatus: "healthy",
  systemId: "",
  plantCount: "",
  plantedOn: "",
  expectedHarvestOn: "",
  image: "",
  notes: ""
};

const formFrom = (plant) => ({
  name: plant.name,
  species: plant.species,
  greenhouse: plant.greenhouse?._id || "",
  cropType: plant.cropType,
  growthStage: plant.growthStage,
  healthStatus: plant.healthStatus,
  systemId: plant.systemId || "",
  plantCount: plant.plantCount ?? "",
  plantedOn: toDateInput(plant.plantedOn),
  expectedHarvestOn: toDateInput(plant.expectedHarvestOn),
  image: plant.image || "",
  notes: plant.notes || ""
});

// Add a crop (/crops/new) or edit one (/crops/:id/edit)
const CropFormPage = () => {
  const { id } = useParams();
  const editing = Boolean(id);
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { greenhouses, loaded: greenhousesLoaded } = useGreenhouses();
  const { nodes } = useTelemetryNodes();

  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(editing);
  const [missing, setMissing] = useState(false);
  const [errors, setErrors] = useState({});
  const [errorCode, setErrorCode] = useState("");
  const [saving, setSaving] = useState(false);
  const [imageBroken, setImageBroken] = useState(false);

  useEffect(() => {
    if (!editing) return undefined;
    let cancelled = false;
    apiClient.get(`/plants/${id}`)
      .then(({ data }) => {
        if (!cancelled) setForm(formFrom(data));
      })
      .catch(() => {
        if (!cancelled) setMissing(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [editing, id]);

  const update = (field) => (event) => {
    const { value } = event.target;
    setForm((current) => ({
      ...current,
      [field]: value,
      // A node belongs to one greenhouse, so changing greenhouse clears it
      ...(field === "greenhouse" ? { systemId: "" } : {})
    }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    if (field === "image") setImageBroken(false);
  };
  const fieldError = (field) => (errors[field] ? t(`fields.${errors[field]}`) : undefined);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const found = validatePlantForm(form);
    setErrors(found);
    if (Object.keys(found).length > 0) {
      setErrorCode("VALIDATION_ERROR");
      return;
    }

    setSaving(true);
    setErrorCode("");
    const payload = {
      ...form,
      name: form.name.trim(),
      species: form.species.trim(),
      image: form.image.trim(),
      notes: form.notes.trim(),
      plantCount: form.plantCount === "" ? null : Number(form.plantCount),
      plantedOn: form.plantedOn || null,
      expectedHarvestOn: form.expectedHarvestOn || null
    };
    try {
      const { data } = editing ? await apiClient.patch(`/plants/${id}`, payload) : await apiClient.post("/plants", payload);
      navigate(`/crops/${data._id}`, { replace: true, state: { notice: editing ? t("plants.updated") : t("plants.created") } });
    } catch (error) {
      setErrors(error.response?.data?.errors || {});
      setErrorCode(getErrorCode(error));
      setSaving(false);
    }
  };

  const backTo = editing ? `/crops/${id}` : "/crops";
  const greenhouseNodes = nodes.filter((node) => node.greenhouse?._id === form.greenhouse);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <LoaderCircle className="h-8 w-8 animate-spin text-leaf-600" aria-label={t("common.loading")} />
      </div>
    );
  }
  if (missing) {
    return (
      <div className="space-y-4">
        <Link to="/crops" className="inline-flex items-center gap-1.5 text-sm font-semibold text-leaf-700 hover:underline">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          {t("plants.back")}
        </Link>
        <Alert tone="error">{t("errors.PLANT_NOT_FOUND")}</Alert>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <Link to={backTo} className="inline-flex items-center gap-1.5 text-sm font-semibold text-leaf-700 hover:underline">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        {editing ? t("plants.backToCrop") : t("plants.back")}
      </Link>
      <div>
        <h1 className="text-xl font-semibold text-gray-900">{editing ? t("plants.editTitle") : t("plants.addTitle")}</h1>
        <p className="mt-1 text-sm text-gray-600">{t("plants.formHint")}</p>
      </div>

      {errorCode && <Alert tone="error">{t(`errors.${errorCode}`, { defaultValue: t("errors.default") })}</Alert>}
      {greenhousesLoaded && greenhouses.length === 0 && <Alert tone="warning">{t("plants.noGreenhouses")}</Alert>}

      <form onSubmit={handleSubmit} noValidate className="panel space-y-5 p-5">
        <fieldset className="grid gap-4 sm:grid-cols-2">
          <legend className="mb-3 text-sm font-semibold text-gray-900">{t("plants.sectionCrop")}</legend>
          <FormField id="crop-name" label={t("plants.name")} icon={Leaf} placeholder={t("plants.namePlaceholder")} maxLength={80} value={form.name} onChange={update("name")} error={fieldError("name")} required />
          <FormField id="crop-species" label={t("plants.species")} icon={Sprout} placeholder={t("plants.speciesPlaceholder")} maxLength={120} value={form.species} onChange={update("species")} error={fieldError("species")} required />
          <SelectField id="crop-type" label={t("plants.cropType")} value={form.cropType} onChange={update("cropType")} error={fieldError("cropType")} required>
            <option value="" disabled>{t("plants.chooseType")}</option>
            {CROP_TYPES.map((type) => <option key={type} value={type}>{t(`plants.cropTypes.${type}`)}</option>)}
          </SelectField>
          <FormField id="crop-count" type="number" inputMode="numeric" min={1} label={t("plants.plantCount")} icon={Hash} value={form.plantCount} onChange={update("plantCount")} error={fieldError("plantCount")} hint={t("plants.optional")} />
        </fieldset>

        <fieldset className="grid gap-4 border-t border-gray-100 pt-5 sm:grid-cols-2">
          <legend className="mb-3 pt-5 text-sm font-semibold text-gray-900">{t("plants.sectionWhere")}</legend>
          <SelectField id="crop-greenhouse" label={t("plants.greenhouse")} icon={Warehouse} value={form.greenhouse} onChange={update("greenhouse")} error={fieldError("greenhouse")} required>
            <option value="" disabled>{t("plants.chooseGreenhouse")}</option>
            {greenhouses.map((greenhouse) => <option key={greenhouse._id} value={greenhouse._id}>{displayCode(t, greenhouse)} · {greenhouse.name}</option>)}
          </SelectField>
          <SelectField id="crop-node" label={t("plants.sensorNode")} icon={Cpu} value={form.systemId} onChange={update("systemId")} error={fieldError("systemId")} hint={form.greenhouse && greenhouseNodes.length === 0 ? t("plants.noNodesHere") : t("plants.optional")} disabled={!form.greenhouse}>
            <option value="">{t("plants.noNode")}</option>
            {greenhouseNodes.map((node) => <option key={node.nodeId} value={node.nodeId}>{node.name} ({node.nodeId})</option>)}
            {form.systemId && !greenhouseNodes.some((node) => node.nodeId === form.systemId) && <option value={form.systemId}>{form.systemId}</option>}
          </SelectField>
        </fieldset>

        <fieldset className="grid gap-4 border-t border-gray-100 pt-5 sm:grid-cols-2">
          <legend className="mb-3 pt-5 text-sm font-semibold text-gray-900">{t("plants.sectionProgress")}</legend>
          <SelectField id="crop-stage" label={t("plants.growthStage")} value={form.growthStage} onChange={update("growthStage")} error={fieldError("growthStage")}>
            {GROWTH_STAGES.map((stage) => <option key={stage} value={stage}>{t(`plants.stages.${stage}`)}</option>)}
          </SelectField>
          <SelectField id="crop-health" label={t("plants.healthStatus")} value={form.healthStatus} onChange={update("healthStatus")} error={fieldError("healthStatus")}>
            {HEALTH_STATUSES.map((status) => <option key={status} value={status}>{t(`plants.health.${status}`)}</option>)}
          </SelectField>
          <FormField id="crop-planted" type="date" label={t("plants.plantedOn")} icon={CalendarDays} value={form.plantedOn} onChange={update("plantedOn")} error={fieldError("plantedOn")} hint={t("plants.optional")} />
          <FormField id="crop-harvest" type="date" label={t("plants.expectedHarvestOn")} icon={CalendarDays} min={form.plantedOn || undefined} value={form.expectedHarvestOn} onChange={update("expectedHarvestOn")} error={fieldError("expectedHarvestOn")} hint={t("plants.optional")} />
        </fieldset>

        <fieldset className="grid gap-4 border-t border-gray-100 pt-5 sm:grid-cols-[1fr_auto]">
          <legend className="mb-3 pt-5 text-sm font-semibold text-gray-900">{t("plants.sectionPhoto")}</legend>
          <FormField id="crop-image" type="url" label={t("plants.imageUrl")} icon={ImageIcon} placeholder="https://…" maxLength={500} value={form.image} onChange={update("image")} error={fieldError("image")} hint={t("plants.imageHint")} />
          <div className="flex h-24 w-32 items-center justify-center overflow-hidden rounded-md bg-leaf-50 ring-1 ring-gray-200 sm:mt-7">
            {form.image && !imageBroken
              ? <img src={form.image} alt={t("plants.preview")} onError={() => setImageBroken(true)} className="h-full w-full object-cover" />
              : <Leaf className="h-8 w-8 text-leaf-400" aria-hidden="true" />}
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="crop-notes" className="mb-1.5 block text-sm font-medium text-gray-700">{t("plants.notes")}</label>
            <textarea
              id="crop-notes"
              rows={3}
              maxLength={500}
              value={form.notes}
              onChange={update("notes")}
              aria-invalid={Boolean(errors.notes)}
              className="w-full rounded-md border border-gray-200 bg-white px-3.5 py-2.5 text-gray-900 focus:border-leaf-500 focus:outline-none focus:ring-2 focus:ring-leaf-500/20"
            />
            <p className={`mt-1 text-right text-xs ${errors.notes ? "text-clay-600" : "text-gray-400"}`}>
              {errors.notes ? fieldError("notes") : `${form.notes.length} / 500`}
            </p>
          </div>
        </fieldset>

        <div className="flex justify-end gap-2 border-t border-gray-100 pt-4">
          <Link to={backTo} className="btn btn-secondary">{t("common.cancel")}</Link>
          <button type="submit" disabled={saving} className="btn btn-primary">
            {saving ? <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Save className="h-4 w-4" aria-hidden="true" />}
            {saving ? t("plants.saving") : editing ? t("plants.save") : t("plants.add")}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CropFormPage;
