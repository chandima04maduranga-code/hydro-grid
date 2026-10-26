import { useEffect, useState } from "react";
import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import {
  ArrowLeft, Building2, Check, CircleCheck, CreditCard, LoaderCircle, Lock, Mail, MapPin, Phone, Send, Star, User
} from "lucide-react";
import apiClient, { getErrorCode } from "../api/axiosConfig";
import Alert from "../components/common/Alert";
import BrandMark from "../components/common/BrandMark";
import FormField, { PasswordField } from "../components/common/FormField";
import LanguageSwitcher from "../components/common/LanguageSwitcher";
import SelectField from "../components/common/SelectField";
import { isStrongPassword, isValidEmail, isValidLkMobile } from "../utils/validation";
import teaPhoto from "../assets/photos/haputale-tea-leaves.webp";

const POPULAR_PLAN = "growth";

const formatRupees = (amount) => `Rs. ${new Intl.NumberFormat("en-LK").format(amount)}`;

const validate = (form) => {
  const errors = {};
  if (!form.companyName.trim()) errors.companyName = "REQUIRED";
  if (!form.district) errors.district = "REQUIRED";
  if (form.companyPhone.trim() && !isValidLkMobile(form.companyPhone)) errors.companyPhone = "INVALID_PHONE";
  if (!form.name.trim()) errors.name = "REQUIRED";
  if (!isValidEmail(form.email)) errors.email = "INVALID_EMAIL";
  if (form.phone.trim() && !isValidLkMobile(form.phone)) errors.phone = "INVALID_PHONE";
  if (!isStrongPassword(form.password)) errors.password = "WEAK_PASSWORD";
  if (form.confirm !== form.password) errors.confirm = "MISMATCH";
  return errors;
};

const PlanCard = ({ plan, billingCycle, yearlyMonths, selected, onSelect }) => {
  const { t } = useTranslation();
  const isTrial = plan.id === "trial";
  const price = billingCycle === "yearly" ? plan.monthlyPriceLkr * yearlyMonths : plan.monthlyPriceLkr;
  const limit = (key, unlimitedKey) =>
    plan.limits[key] === null ? t(`plans.${unlimitedKey}`) : t(`plans.${key}`, { count: plan.limits[key] });

  const features = [
    limit("greenhouses", "unlimitedGreenhouses"),
    limit("users", "unlimitedUsers"),
    limit("sensorNodes", "unlimitedSensorNodes"),
    ...(plan.prioritySupport ? [t("plans.prioritySupport")] : [])
  ];

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={`relative flex h-full flex-col rounded-3xl p-6 text-left transition ${
        selected
          ? "bg-white shadow-2xl shadow-leaf-600/20 ring-2 ring-leaf-500"
          : "glass shadow-lg shadow-tea-900/5 hover:-translate-y-0.5 hover:shadow-xl"
      }`}
    >
      {plan.id === POPULAR_PLAN && (
        <span className="absolute -top-3 left-6 inline-flex items-center gap-1 rounded-full bg-gold-500 px-3 py-1 text-xs font-bold text-white shadow">
          <Star className="h-3 w-3" aria-hidden="true" />
          {t("plans.popular")}
        </span>
      )}
      <p className="text-lg font-extrabold text-gray-900">{t(`plans.${plan.id}.name`)}</p>
      <p className="mt-1 text-sm text-gray-500">{t(`plans.${plan.id}.tagline`)}</p>
      <p className="mt-5">
        <span className="text-3xl font-extrabold tracking-tight text-gray-900">
          {isTrial ? t("plans.free") : formatRupees(price)}
        </span>
        {!isTrial && (
          <span className="ml-1 text-sm text-gray-500">
            {billingCycle === "yearly" ? t("plans.perYear") : t("plans.perMonth")}
          </span>
        )}
      </p>
      {isTrial && <p className="mt-1 text-xs font-semibold text-leaf-700">{t("plans.trialDays", { count: plan.trialDays })}</p>}
      <ul className="mt-5 flex-1 space-y-2 text-sm text-gray-700">
        {features.map((feature) => (
          <li key={feature} className="flex items-start gap-2">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-leaf-600" aria-hidden="true" />
            {feature}
          </li>
        ))}
      </ul>
      <span
        className={`mt-6 rounded-xl px-4 py-2.5 text-center text-sm font-bold ${
          selected ? "bg-gradient-to-r from-leaf-500 to-tea-600 text-white" : "border border-leaf-500/40 text-leaf-700"
        }`}
      >
        {selected ? t("companySignup.selected") : t("companySignup.choose")}
      </span>
    </button>
  );
};

const RegisterCompanyPage = () => {
  const { t, i18n } = useTranslation();

  const [options, setOptions] = useState(null);
  const [step, setStep] = useState(1);
  const [plan, setPlan] = useState(POPULAR_PLAN);
  const [billingCycle, setBillingCycle] = useState("monthly");
  const [form, setForm] = useState({
    companyName: "", district: "", companyPhone: "",
    name: "", email: "", phone: "", password: "", confirm: ""
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const [errorCode, setErrorCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [registered, setRegistered] = useState(null);

  useEffect(() => {
    let cancelled = false;
    apiClient.get("/companies/options")
      .then(({ data }) => {
        if (!cancelled) setOptions(data);
      })
      .catch((error) => {
        if (!cancelled) setErrorCode(getErrorCode(error));
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const update = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.value }));
    setFieldErrors((current) => ({ ...current, [field]: undefined }));
  };
  const fieldError = (field) => (fieldErrors[field] ? t(`fields.${fieldErrors[field]}`) : undefined);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorCode("");
    const errors = validate(form);
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setSubmitting(true);
    try {
      const { data } = await apiClient.post("/companies/register", {
        plan,
        billingCycle,
        company: { name: form.companyName, district: form.district, phone: form.companyPhone },
        admin: { name: form.name, email: form.email, phone: form.phone, password: form.password, preferredLanguage: i18n.language }
      });
      setRegistered({ company: data.company.name, plan: t(`plans.${data.company.plan}.name`), name: form.name.trim() });
    } catch (error) {
      setErrorCode(getErrorCode(error));
      setFieldErrors(error.response?.data?.errors || {});
    } finally {
      setSubmitting(false);
    }
  };

  const primaryButton =
    "inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-leaf-500 to-tea-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-leaf-500/30 transition hover:from-leaf-600 hover:to-tea-700 disabled:cursor-not-allowed disabled:opacity-70";

  return (
    <div className="relative min-h-screen">
      <div className="fixed inset-0 -z-10" aria-hidden="true">
        <img src={teaPhoto} alt="" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-white/85 via-white/75 to-white/90" />
      </div>

      <header className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-5 sm:px-6">
        <Link to="/login"><BrandMark /></Link>
        <LanguageSwitcher />
      </header>

      <main className="mx-auto max-w-6xl px-4 pb-16 sm:px-6">
        {registered ? (
          <div className="glass mx-auto mt-10 max-w-lg rounded-3xl p-10 text-center shadow-2xl shadow-tea-900/15">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-leaf-50">
              <CircleCheck className="h-9 w-9 text-leaf-600" aria-hidden="true" />
            </div>
            <h1 className="text-2xl font-extrabold text-gray-900">{t("companySignup.successTitle")}</h1>
            <p className="mt-3 text-sm leading-relaxed text-gray-600">{t("companySignup.successText", registered)}</p>
            <Link to="/login" className={`mt-8 ${primaryButton}`}>
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              {t("register.backToLogin")}
            </Link>
          </div>
        ) : (
          <>
            <div className="mb-8 text-center">
              <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">{t("companySignup.title")}</h1>
              <p className="mx-auto mt-3 max-w-2xl text-gray-600">{t("companySignup.subtitle")}</p>
              <ol className="mt-6 flex items-center justify-center gap-3 text-sm font-semibold">
                {[t("companySignup.stepPlan"), t("companySignup.stepDetails")].map((label, index) => (
                  <li key={label} className={`flex items-center gap-2 ${step === index + 1 ? "text-leaf-700" : "text-gray-400"}`}>
                    <span className={`flex h-7 w-7 items-center justify-center rounded-full text-xs ${step === index + 1 ? "bg-leaf-600 text-white" : "bg-white text-gray-500 ring-1 ring-gray-200"}`}>
                      {index + 1}
                    </span>
                    {label}
                    {index === 0 && <span className="mx-1 h-px w-8 bg-gray-300" aria-hidden="true" />}
                  </li>
                ))}
              </ol>
            </div>

            {errorCode && (
              <div className="mx-auto mb-6 max-w-3xl">
                <Alert tone="error">{t(`errors.${errorCode}`, { defaultValue: t("errors.default") })}</Alert>
              </div>
            )}

            {step === 1 && (
              <section aria-label={t("companySignup.stepPlan")}>
                <div className="mb-8 flex justify-center">
                  <div role="group" className="glass inline-flex rounded-xl p-1 shadow-sm">
                    {["monthly", "yearly"].map((cycle) => (
                      <button
                        key={cycle}
                        type="button"
                        aria-pressed={billingCycle === cycle}
                        onClick={() => setBillingCycle(cycle)}
                        className={`flex items-center gap-2 rounded-lg px-5 py-2 text-sm font-semibold transition ${
                          billingCycle === cycle ? "bg-leaf-600 text-white shadow-sm" : "text-gray-600 hover:text-gray-900"
                        }`}
                      >
                        {t(`plans.${cycle}`)}
                        {cycle === "yearly" && (
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${billingCycle === "yearly" ? "bg-white/25" : "bg-gold-100 text-gold-600"}`}>
                            {t("plans.yearlySaving")}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {options ? (
                  <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                    {options.plans.map((option) => (
                      <PlanCard
                        key={option.id}
                        plan={option}
                        billingCycle={billingCycle}
                        yearlyMonths={options.yearlyMonthsCharged}
                        selected={plan === option.id}
                        onSelect={() => setPlan(option.id)}
                      />
                    ))}
                  </div>
                ) : (
                  !errorCode && (
                    <div className="flex justify-center py-16">
                      <LoaderCircle className="h-8 w-8 animate-spin text-leaf-600" aria-label={t("common.loading")} />
                    </div>
                  )
                )}

                <p className="mt-6 flex items-center justify-center gap-2 text-xs text-gray-500">
                  <CreditCard className="h-4 w-4" aria-hidden="true" />
                  {t("companySignup.paymentNote")}
                </p>
                <div className="mt-8 flex justify-center">
                  <button type="button" onClick={() => setStep(2)} disabled={!options} className={primaryButton}>
                    {t("companySignup.continue")}
                  </button>
                </div>
              </section>
            )}

            {step === 2 && options && (
              <form onSubmit={handleSubmit} noValidate className="glass mx-auto max-w-3xl rounded-3xl p-6 shadow-2xl shadow-tea-900/15 sm:p-10">
                <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-leaf-50/80 px-4 py-3 text-sm">
                  <span className="font-semibold text-leaf-700">
                    {t(`plans.${plan}.name`)}
                    {plan !== "trial" && ` · ${t(`plans.${billingCycle}`)}`}
                  </span>
                  <button type="button" onClick={() => setStep(1)} className="font-semibold text-leaf-700 underline-offset-2 hover:underline">
                    {t("companySignup.back")}
                  </button>
                </div>

                <h2 className="mb-4 flex items-center gap-2 text-lg font-extrabold text-gray-900">
                  <Building2 className="h-5 w-5 text-leaf-600" aria-hidden="true" />
                  {t("companySignup.stepDetails")}
                </h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    id="companyName"
                    className="sm:col-span-2"
                    label={t("companySignup.companyName")}
                    icon={Building2}
                    placeholder={t("companySignup.companyNamePlaceholder")}
                    autoComplete="organization"
                    value={form.companyName}
                    onChange={update("companyName")}
                    error={fieldError("companyName")}
                  />
                  <SelectField
                    id="district"
                    label={t("companySignup.district")}
                    icon={MapPin}
                    value={form.district}
                    onChange={update("district")}
                    error={fieldError("district")}
                  >
                    <option value="" disabled>{t("companySignup.chooseDistrict")}</option>
                    {options.districts.map((district) => (
                      <option key={district} value={district}>{t(`districts.${district}`)}</option>
                    ))}
                  </SelectField>
                  <FormField
                    id="companyPhone"
                    type="tel"
                    inputMode="tel"
                    label={t("companySignup.companyPhone")}
                    icon={Phone}
                    placeholder="07X XXX XXXX"
                    value={form.companyPhone}
                    onChange={update("companyPhone")}
                    error={fieldError("companyPhone")}
                    hint={t("register.phoneHint")}
                  />
                </div>

                <h2 className="mb-1 mt-8 flex items-center gap-2 text-lg font-extrabold text-gray-900">
                  <User className="h-5 w-5 text-leaf-600" aria-hidden="true" />
                  {t("companySignup.stepAdmin")}
                </h2>
                <p className="mb-4 text-sm text-gray-500">{t("companySignup.adminHint")}</p>
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField id="name" label={t("register.name")} icon={User} autoComplete="name" value={form.name} onChange={update("name")} error={fieldError("name")} />
                  <FormField id="email" type="email" label={t("common.email")} icon={Mail} autoComplete="email" value={form.email} onChange={update("email")} error={fieldError("email")} />
                  <FormField
                    id="phone"
                    type="tel"
                    inputMode="tel"
                    className="sm:col-span-2"
                    label={t("register.phone")}
                    icon={Phone}
                    placeholder="07X XXX XXXX"
                    autoComplete="tel"
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
                </div>

                <div className="mt-8 flex flex-col-reverse items-stretch justify-between gap-3 sm:flex-row sm:items-center">
                  <p className="text-sm text-gray-600">
                    {t("companySignup.haveAccount")}{" "}
                    <Link to="/login" className="font-semibold text-leaf-700 hover:underline">{t("register.login")}</Link>
                  </p>
                  <button type="submit" disabled={submitting} className={primaryButton}>
                    {submitting
                      ? <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
                      : <Send className="h-4 w-4" aria-hidden="true" />}
                    {submitting ? t("companySignup.submitting") : t("companySignup.submit")}
                  </button>
                </div>
              </form>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default RegisterCompanyPage;
