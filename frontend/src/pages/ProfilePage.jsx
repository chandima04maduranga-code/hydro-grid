import { useState } from "react";
import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import {
  Building2, CalendarDays, Clock, Languages, LoaderCircle, Mail, MapPin, Pencil, Phone, Save, ShieldCheck, UserRound, Warehouse
} from "lucide-react";
import { getErrorCode } from "../api/axiosConfig";
import { useAuth } from "../context/AuthContext";
import Alert from "../components/common/Alert";
import Avatar from "../components/common/Avatar";
import FormField from "../components/common/FormField";
import SelectField from "../components/common/SelectField";
import { RoleBadge, StatusBadge } from "../components/common/Badges";
import { useGreenhouses } from "../hooks/useGreenhouses";
import { displayCode } from "../utils/greenhouses";
import { formatDateTime } from "../utils/format";

const LANGUAGES = ["en", "si"];
const SL_MOBILE = /^(?:\+94|0)7\d{8}$/;

const validate = (form) => {
  const errors = {};
  if (!form.name.trim()) errors.name = "REQUIRED";
  else if (form.name.trim().length > 100) errors.name = "TOO_LONG";
  if (form.phone.trim() && !SL_MOBILE.test(form.phone.replace(/[\s-]/g, ""))) errors.phone = "INVALID_PHONE";
  return errors;
};

const DetailRow = ({ icon: Icon, label, children }) => (
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

const ProfileForm = ({ user, onSaved, onCancel }) => {
  const { t } = useTranslation();
  const { updateProfile } = useAuth();
  const [form, setForm] = useState({ name: user.name, phone: user.phone || "", preferredLanguage: user.preferredLanguage });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [errorCode, setErrorCode] = useState("");

  const update = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const found = validate(form);
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setSaving(true);
    setErrorCode("");
    try {
      await updateProfile({ name: form.name.trim(), phone: form.phone.trim(), preferredLanguage: form.preferredLanguage });
      onSaved();
    } catch (error) {
      setErrors(error.response?.data?.errors || {});
      setErrorCode(getErrorCode(error));
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      {errorCode && <Alert tone="error">{t(`errors.${errorCode}`, { defaultValue: t("errors.default") })}</Alert>}
      <FormField id="profile-name" label={t("register.name")} icon={UserRound} value={form.name} onChange={update("name")} maxLength={100} error={errors.name && t(`fields.${errors.name}`)} />
      <FormField
        id="profile-phone"
        type="tel"
        label={t("register.phone")}
        icon={Phone}
        value={form.phone}
        onChange={update("phone")}
        hint={t("register.phoneHint")}
        error={errors.phone && t(`fields.${errors.phone}`)}
      />
      <SelectField id="profile-language" label={t("language.label")} icon={Languages} value={form.preferredLanguage} onChange={update("preferredLanguage")}>
        {LANGUAGES.map((language) => <option key={language} value={language}>{t(`language.${language}`)}</option>)}
      </SelectField>
      <div className="flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="btn btn-secondary">{t("common.cancel")}</button>
        <button type="submit" disabled={saving} className="btn btn-primary">
          {saving ? <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Save className="h-4 w-4" aria-hidden="true" />}
          {saving ? t("profile.saving") : t("profile.save")}
        </button>
      </div>
    </form>
  );
};

// Greenhouses this person works in (admins see every greenhouse)
const MyGreenhouses = ({ isAdmin }) => {
  const { t } = useTranslation();
  const { greenhouses, loaded } = useGreenhouses();

  return (
    <section className="panel p-5">
      <h2 className="flex items-center gap-2 font-semibold text-gray-900">
        <Warehouse className="h-4 w-4 text-leaf-700" aria-hidden="true" />
        {t("profile.myGreenhouses")}
      </h2>
      <p className="mt-0.5 text-xs text-gray-500">{isAdmin ? t("profile.adminSeesAll") : t("profile.assignedOnly")}</p>
      {!loaded ? (
        <LoaderCircle className="mt-4 h-5 w-5 animate-spin text-leaf-600" aria-label={t("common.loading")} />
      ) : greenhouses.length === 0 ? (
        <p className="mt-4 text-sm text-gray-500">{t("profile.noGreenhouses")}</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {greenhouses.map((greenhouse) => (
            <li key={greenhouse._id}>
              <Link to={`/greenhouses/${greenhouse._id}`} className="flex items-center gap-3 rounded-md border border-gray-200 px-3 py-2 hover:bg-gray-50">
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-gray-900">{greenhouse.name}</span>
                  <span className="block text-xs text-gray-500">{displayCode(t, greenhouse)}</span>
                </span>
                {greenhouse.mainCrop && <span className="rounded bg-leaf-50 px-1.5 py-0.5 text-xs font-medium text-leaf-800">{t(`crops.${greenhouse.mainCrop}`)}</span>}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};

const ProfilePage = () => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const [editing, setEditing] = useState(false);
  const [saved, setSaved] = useState(false);
  const isPlatformAdmin = user.role === "platform_admin";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">{t("profile.title")}</h1>
        <p className="mt-1 text-sm text-gray-600">{t("profile.subtitle")}</p>
      </div>

      <section className="panel flex flex-wrap items-center gap-4 bg-gradient-to-r from-leaf-50 to-white p-5">
        <Avatar name={user.name} size="lg" />
        <div className="min-w-[12rem] flex-1">
          <p className="truncate text-lg font-semibold text-gray-900">{user.name}</p>
          <p className="truncate text-sm text-gray-600">{user.email}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <RoleBadge role={user.role} />
            <StatusBadge status={user.status} />
          </div>
        </div>
        {!editing && (
          <button type="button" onClick={() => { setEditing(true); setSaved(false); }} className="btn btn-secondary">
            <Pencil className="h-4 w-4" aria-hidden="true" />
            {t("profile.edit")}
          </button>
        )}
      </section>

      {saved && <Alert tone="success">{t("profile.saved")}</Alert>}

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="panel p-5">
          <h2 className="mb-2 flex items-center gap-2 font-semibold text-gray-900">
            <UserRound className="h-4 w-4 text-leaf-700" aria-hidden="true" />
            {editing ? t("profile.editTitle") : t("profile.details")}
          </h2>
          {editing ? (
            <ProfileForm user={user} onCancel={() => setEditing(false)} onSaved={() => { setEditing(false); setSaved(true); }} />
          ) : (
            <dl className="divide-y divide-gray-100">
              <DetailRow icon={Mail} label={t("common.email")}>{user.email}</DetailRow>
              <DetailRow icon={Phone} label={t("register.phone")}>{user.phone || "—"}</DetailRow>
              <DetailRow icon={ShieldCheck} label={t("profile.role")}>{t(`roles.${user.role}`)}</DetailRow>
              {!isPlatformAdmin && user.company && (
                <>
                  <DetailRow icon={Building2} label={t("login.company")}>{user.company.name}</DetailRow>
                  <DetailRow icon={MapPin} label={t("profile.district")}>{t(`districts.${user.company.district}`)}</DetailRow>
                </>
              )}
              <DetailRow icon={Languages} label={t("language.label")}>{t(`language.${user.preferredLanguage}`)}</DetailRow>
              <DetailRow icon={CalendarDays} label={t("profile.memberSince")}>{formatDateTime(user.createdAt, i18n.language)}</DetailRow>
              <DetailRow icon={Clock} label={t("profile.lastLogin")}>{user.lastLoginAt ? formatDateTime(user.lastLoginAt, i18n.language) : t("profile.never")}</DetailRow>
            </dl>
          )}
        </section>

        {!isPlatformAdmin && <MyGreenhouses isAdmin={user.role === "admin"} />}
      </div>
    </div>
  );
};

export default ProfilePage;
