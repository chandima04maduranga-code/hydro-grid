import { useState } from "react";
import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import { ArrowLeft, CircleCheck, LoaderCircle, Lock, Mail, Phone, Send, User } from "lucide-react";
import AuthShell from "../components/auth/AuthShell";
import AuthCard from "../components/auth/AuthCard";
import Alert from "../components/common/Alert";
import FormField, { PasswordField } from "../components/common/FormField";
import { useAuth } from "../context/AuthContext";
import { getErrorCode } from "../api/axiosConfig";
import { SUPPORTED_LANGUAGES } from "../i18n";
import { validateRegistration } from "../utils/validation";
import teaPhoto from "../assets/photos/haputale-tea-leaves.webp";

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
      <AuthShell photo={teaPhoto} photoCredit={t("credits.haputale")}>
        <AuthCard>
          <div className="text-center">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-leaf-50">
              <CircleCheck className="h-9 w-9 text-leaf-600" aria-hidden="true" />
            </div>
            <h2 className="text-2xl font-extrabold text-gray-900">{t("register.successTitle")}</h2>
            <p className="mt-3 text-sm leading-relaxed text-gray-600">
              {t("register.successText", { name: registeredName })}
            </p>
            <Link
              to="/login"
              className="mt-8 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-leaf-500 to-tea-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-leaf-500/30 hover:from-leaf-600 hover:to-tea-700"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              {t("register.backToLogin")}
            </Link>
          </div>
        </AuthCard>
      </AuthShell>
    );
  }

  return (
    <AuthShell photo={teaPhoto} photoCredit={t("credits.haputale")}>
      <AuthCard title={t("register.title")} subtitle={t("register.subtitle")}>
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
                      ? "border-leaf-500 bg-leaf-50 text-leaf-700"
                      : "border-gray-200 bg-white/70 text-gray-600 hover:border-leaf-400"
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
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-leaf-500 to-tea-600 px-4 py-3.5 text-base font-bold text-white shadow-lg shadow-leaf-500/30 transition hover:from-leaf-600 hover:to-tea-700 focus:outline-none focus:ring-4 focus:ring-leaf-500/30 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {submitting
              ? <LoaderCircle className="h-5 w-5 animate-spin" aria-hidden="true" />
              : <Send className="h-5 w-5" aria-hidden="true" />}
            {submitting ? t("register.submitting") : t("register.submit")}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-600">
          {t("register.haveAccount")}{" "}
          <Link to="/login" className="font-semibold text-leaf-700 hover:text-leaf-600 hover:underline">
            {t("register.login")}
          </Link>
        </p>
      </AuthCard>
    </AuthShell>
  );
};

export default RegisterPage;
