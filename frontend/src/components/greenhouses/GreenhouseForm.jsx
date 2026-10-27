import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Activity, Hash, LoaderCircle, MapPin, Maximize2, Save, Sprout, Warehouse } from "lucide-react";
import FormField from "../common/FormField";
import SelectField from "../common/SelectField";
import { GREENHOUSE_STATUSES, SYSTEM_TYPES } from "../../utils/greenhouses";

const CROP_IDS = ["lettuce", "tomato", "strawberry", "bellPepper", "cucumber", "leafyGreens"];

const validate = (form, creating) => {
  const errors = {};
  if (creating && !form.district) errors.district = "REQUIRED";
  if (!form.name.trim()) errors.name = "REQUIRED";
  if (form.areaSqm !== "" && !(Number(form.areaSqm) >= 1 && Number(form.areaSqm) <= 1000000)) errors.areaSqm = "INVALID_AREA";
  return errors;
};

// Add or edit a greenhouse. District is chosen only when adding (it is part of the code).
const GreenhouseForm = ({ initial, districts, nextCodes, onSubmit, onCancel }) => {
  const { t } = useTranslation();
  const creating = !initial;
  const [form, setForm] = useState({
    district: initial?.district || "",
    name: initial?.name || "",
    systemType: initial?.systemType || "nft",
    mainCrop: initial?.mainCrop || "",
    areaSqm: initial?.areaSqm ?? "",
    status: initial?.status || "active",
    notes: initial?.notes || ""
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const update = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  };
  const fieldError = (field) => (errors[field] ? t(`fields.${errors[field]}`) : undefined);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const found = validate(form, creating);
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setSubmitting(true);
    const { district, ...editable } = form;
    const payload = { ...editable, areaSqm: form.areaSqm === "" ? null : Number(form.areaSqm), mainCrop: form.mainCrop || null };
    const serverErrors = await onSubmit(creating ? { ...payload, district } : payload);
    setSubmitting(false);
    if (serverErrors) setErrors(serverErrors);
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        {creating ? (
          <SelectField id="gh-district" label={t("greenhouses.district")} icon={MapPin} value={form.district} onChange={update("district")} error={fieldError("district")}>
            <option value="" disabled>{t("greenhouses.chooseDistrict")}</option>
            {districts.map((district) => <option key={district} value={district}>{t(`districts.${district}`)}</option>)}
          </SelectField>
        ) : null}
        <FormField
          id="gh-name"
          className={creating ? "" : "sm:col-span-2"}
          label={t("greenhouses.name")}
          icon={Warehouse}
          placeholder={t("greenhouses.namePlaceholder")}
          maxLength={80}
          value={form.name}
          onChange={update("name")}
          error={fieldError("name")}
        />
      </div>

      {creating && form.district && nextCodes?.[form.district] && (
        <p className="flex items-center gap-2 rounded-xl bg-leaf-50/80 px-3 py-2 text-sm font-semibold text-leaf-700">
          <Hash className="h-4 w-4" aria-hidden="true" />
          {t("greenhouses.nextCode", { code: `${t(`districts.${form.district}`)} GH-${nextCodes[form.district].split(" GH-").pop()}` })}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <SelectField id="gh-system" label={t("greenhouses.system")} icon={Activity} value={form.systemType} onChange={update("systemType")}>
          {SYSTEM_TYPES.map((type) => <option key={type} value={type}>{t(`systemTypes.${type}`)}</option>)}
        </SelectField>
        <SelectField id="gh-crop" label={t("greenhouses.mainCrop")} icon={Sprout} value={form.mainCrop} onChange={update("mainCrop")}>
          <option value="">{t("greenhouses.noMainCrop")}</option>
          {CROP_IDS.map((crop) => <option key={crop} value={crop}>{t(`crops.${crop}`)}</option>)}
        </SelectField>
        <FormField
          id="gh-area"
          type="number"
          inputMode="numeric"
          min={1}
          label={t("greenhouses.area")}
          icon={Maximize2}
          value={form.areaSqm}
          onChange={update("areaSqm")}
          error={fieldError("areaSqm")}
        />
        <SelectField id="gh-status" label={t("greenhouses.status")} value={form.status} onChange={update("status")}>
          {GREENHOUSE_STATUSES.map((status) => <option key={status} value={status}>{t(`greenhouseStatuses.${status}`)}</option>)}
        </SelectField>
      </div>

      <div>
        <label htmlFor="gh-notes" className="mb-1.5 block text-sm font-medium text-gray-700">{t("greenhouses.notes")}</label>
        <textarea
          id="gh-notes"
          rows={2}
          maxLength={500}
          value={form.notes}
          onChange={update("notes")}
          className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-gray-900 focus:border-leaf-500 focus:outline-none focus:ring-4 focus:ring-leaf-500/15"
        />
      </div>

      <div className="flex justify-end gap-2">
        {onCancel && (
          <button type="button" onClick={onCancel} className="rounded-xl bg-gray-100 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-200">
            {t("greenhouses.cancel")}
          </button>
        )}
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-leaf-500 to-tea-600 px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-leaf-500/25 hover:from-leaf-600 hover:to-tea-700 disabled:opacity-70"
        >
          {submitting ? <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Save className="h-4 w-4" aria-hidden="true" />}
          {creating
            ? (submitting ? t("greenhouses.creating") : t("greenhouses.create"))
            : (submitting ? t("greenhouses.saving") : t("greenhouses.save"))}
        </button>
      </div>
    </form>
  );
};

export default GreenhouseForm;
