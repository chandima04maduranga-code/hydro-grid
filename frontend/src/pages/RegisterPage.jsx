import { useState } from "react";
import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import { ArrowLeft, CircleCheck, LoaderCircle, Lock, Mail, Phone, User } from "lucide-react";
import AuthShell from "../components/auth/AuthShell";
import Alert from "../components/common/Alert";
import FormField, { PasswordField } from "../components/common/FormField";
import { useAuth } from "../context/AuthContext";
import { getErrorCode } from "../api/axiosConfig";
import { SUPPORTED_LANGUAGES } from "../i18n";
import { validateRegistration } from "../utils/validation";

const RegisterPage = () => {
  const { t, i18n } = useTranslation();
  const { register } = useAuth();

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirm: "",
    preferredLanguage: i18n.language
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const [errorCode, setErrorCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [registeredName, setRegisteredName] = useState("");

  const update = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.value }));
    setFieldErrors((current) => ({ ...current, [field]: undefined }));
  };

  const fieldError = (field) => (fieldErrors[field] ? t(`fields.${fieldErrors[field]}`) : undefined);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorCode("");

    const errors = validateRegistration(form);
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setSubmitting(true);
    try {
      const { confirm: _confirm, ...details } = form;
      const user = await register(details);
      setRegisteredName(user.name);
    } catch (error) {
      setErrorCode(getErrorCode(error));
      setFieldErrors(error.response?.data?.errors || {});
    } finally {
      setSubmitting(false);
    }
  };

  if (registeredName) {
    return (
      <AuthShell>
        <div className="rounded-3xl border border-tea-100 bg-white p-8 text-center shadow-xl shadow-tea-900/5 sm:p-10">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-tea-50">
            <CircleCheck className="h-8 w-8 text-tea-600" aria-hidden="true" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">{t("register.successTitle")}</h2>
          <p className="mt-3 text-sm leading-relaxed text-gray-600">
            {t("register.successText", { name: registeredName })}
          </p>
          <Link
            to="/login"
            className="mt-8 inline-flex items-center gap-2 rounded-xl bg-tea-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-tea-800"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            {t("register.backToLogin")}
          </Link>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell>
      <div className="rounded-3xl border border-tea-100 bg-white p-8 shadow-xl shadow-tea-900/5 sm:p-10">
        <div className="mb-7">
          <h2 className="text-2xl font-bold text-gray-900">{t("register.title")}</h2>
          <p className="mt-1.5 text-sm text-gray-500">{t("register.subtitle")}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {errorCode && <Alert tone="error">{t(`errors.${errorCode}`, { defaultValue: t("errors.default") })}</Alert>}

          <FormField
            id="name"
            label={t("register.name")}
            icon={User}
            autoComplete="name"
            value={form.name}
            onChange={update("name")}
            error={fieldError("name")}
          />
          <FormField
            id="email"
            type="email"
            label={t("common.email")}
            icon={Mail}
            autoComplete="email"
            value={form.email}
            onChange={update("email")}
            error={fieldError("email")}
          />
          <FormField
            id="phone"
            type="tel"
            inputMode="tel"
            label={t("register.phone")}
            icon={Phone}
            autoComplete="tel"
            placeholder="07X XXX XXXX"
            value={form.phone}
            onChange={update("phone")}
            error={fieldError("phone")}
            hint={t("register.phoneHint")}
          />
          <PasswordField
            id="password"
            label={t("common.password")}
            icon={Lock}
            autoComplete="new-password"
            value={form.password}
            onChange={update("password")}
            error={fieldError("password")}
            hint={t("register.passwordHint")}
            showLabel={t("common.showPassword")}
            hideLabel={t("common.hidePassword")}
          />
          <PasswordField
            id="confirm"
            label={t("register.confirm")}
            icon={Lock}
            autoComplete="new-password"
            value={form.confirm}
            onChange={update("confirm")}
            error={fieldError("confirm")}
            showLabel={t("common.showPassword")}
            hideLabel={t("common.hidePassword")}
          />

          <fieldset>
            <legend className="mb-1.5 text-sm font-medium text-gray-700">{t("register.preferredLanguage")}</legend>
            <div className="grid grid-cols-2 gap-2">
              {SUPPORTED_LANGUAGES.map((language) => (
                <label
                  key={language}
                  lang={language}
                  className={`cursor-pointer rounded-xl border px-3 py-2.5 text-center text-sm font-medium transition ${
                    form.preferredLanguage === language
                      ? "border-tea-600 bg-tea-50 text-tea-800"
                      : "border-gray-200 text-gray-600 hover:border-tea-300"
                  }`}
                >
                  <input
                    type="radio"
                    name="preferredLanguage"
                    value={language}
                    checked={form.preferredLanguage === language}
                    onChange={update("preferredLanguage")}
                    className="sr-only"
                  />
                  {t(`language.${language}`)}
                </label>
              ))}
            </div>
          </fieldset>

          <button
            type="submit"
            disabled={submitting}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-tea-700 px-4 py-3 font-semibold text-white transition hover:bg-tea-800 focus:outline-none focus:ring-4 focus:ring-tea-500/25 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {submitting && <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />}
            {submitting ? t("register.submitting") : t("register.submit")}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-600">
          {t("register.haveAccount")}{" "}
          <Link to="/login" className="font-semibold text-tea-700 hover:text-tea-800 hover:underline">
            {t("register.login")}
          </Link>
        </p>
      </div>
    </AuthShell>
  );
};

export default RegisterPage;
