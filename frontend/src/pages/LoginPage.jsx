import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { Building2, LoaderCircle, Lock, LogIn, Mail, ShieldCheck, UserPlus } from "lucide-react";
import AuthShell from "../components/auth/AuthShell";
import AuthCard from "../components/auth/AuthCard";
import Alert from "../components/common/Alert";
import FormField, { PasswordField } from "../components/common/FormField";
import SelectField from "../components/common/SelectField";
import { useAuth } from "../context/AuthContext";
import { getErrorCode } from "../api/axiosConfig";
import { readLastCompany, saveLastCompany, useCompanies } from "../hooks/useCompanies";
import greenhousePhoto from "../assets/photos/greenhouse-strawberries.webp";

const WARNING_CODES = ["ACCOUNT_PENDING", "SESSION_EXPIRED", "COMPANY_PENDING"];

// Must match PLATFORM_LOGIN in backend/routes/auth.js
const PLATFORM_LOGIN = "platform";

const LoginPage = () => {
  const { t } = useTranslation();
  const { login, sessionExpired } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { companies, loading: loadingCompanies } = useCompanies();

  const [companyId, setCompanyId] = useState(readLastCompany);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [errorCode, setErrorCode] = useState(sessionExpired ? "SESSION_EXPIRED" : "");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorCode("");
    if (!companyId) {
      setErrorCode("COMPANY_NOT_FOUND");
      return;
    }
    setSubmitting(true);
    try {
      const user = await login(companyId, email, password, remember);
      saveLastCompany(companyId);
      const home = user.role === "platform_admin" ? "/platform/companies" : "/dashboard";
      navigate(location.state?.from?.pathname || home, { replace: true });
    } catch (error) {
      setErrorCode(getErrorCode(error));
      setSubmitting(false);
    }
  };

  return (
    <AuthShell photo={greenhousePhoto} photoCredit={t("credits.greenhouse")}>
      <AuthCard title={t("login.title")} subtitle={t("login.subtitle")}>
        <form onSubmit={handleSubmit} className="space-y-3.5" noValidate>
          {errorCode && (
            <Alert tone={WARNING_CODES.includes(errorCode) ? "warning" : "error"}>
              {t(`errors.${errorCode}`, { defaultValue: t("errors.default") })}
            </Alert>
          )}

          <SelectField
            id="company"
            label={t("login.company")}
            icon={Building2}
            value={companyId}
            onChange={(event) => setCompanyId(event.target.value)}
            hint={!loadingCompanies && companies.length === 0 ? t("login.noCompanies") : undefined}
            required
          >
            <option value="" disabled>{t("login.chooseCompany")}</option>
            {companies.map((company) => (
              <option key={company._id} value={company._id}>
                {company.name} · {t(`districts.${company.district}`)}
              </option>
            ))}
            <option value={PLATFORM_LOGIN}>{t("login.platformOption")}</option>
          </SelectField>
          <FormField
            id="email"
            type="email"
            label={t("common.email")}
            icon={Mail}
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
          <PasswordField
            id="password"
            label={t("common.password")}
            icon={Lock}
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            showLabel={t("common.showPassword")}
            hideLabel={t("common.hidePassword")}
            required
          />

          <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={remember}
              onChange={(event) => setRemember(event.target.checked)}
              className="h-4 w-4 rounded border-gray-300 accent-leaf-600"
            />
            {t("login.remember")}
          </label>

          <button
            type="submit"
            disabled={submitting}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-leaf-500 to-tea-600 px-4 py-3 text-base font-bold text-white shadow-lg shadow-leaf-500/30 transition hover:from-leaf-600 hover:to-tea-700 focus:outline-none focus:ring-4 focus:ring-leaf-500/30 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {submitting
              ? <LoaderCircle className="h-5 w-5 animate-spin" aria-hidden="true" />
              : <LogIn className="h-5 w-5" aria-hidden="true" />}
            {submitting ? t("login.submitting") : t("login.submit")}
          </button>
        </form>

        <div className="mt-4 grid grid-cols-2 gap-2.5">
          <Link
            to="/register"
            title={`${t("login.noAccount")} ${t("login.register")}`}
            className="flex items-center justify-center gap-1.5 rounded-xl border border-leaf-500/40 bg-white/70 px-3 py-2.5 text-center text-sm font-semibold text-leaf-700 transition hover:bg-leaf-50"
          >
            <UserPlus className="h-4 w-4 shrink-0" aria-hidden="true" />
            {t("login.register")}
          </Link>
          <Link
            to="/register-company"
            title={`${t("login.newCompany")} ${t("login.registerCompany")}`}
            className="flex items-center justify-center gap-1.5 rounded-xl border border-gold-400/50 bg-gold-100/60 px-3 py-2.5 text-center text-sm font-semibold text-gold-600 transition hover:bg-gold-100"
          >
            <Building2 className="h-4 w-4 shrink-0" aria-hidden="true" />
            {t("login.registerCompany")}
          </Link>
        </div>

        <div className="mt-4 flex items-center justify-center gap-2 text-xs text-gray-500">
          <ShieldCheck className="h-4 w-4 shrink-0 text-leaf-600" aria-hidden="true" />
          <span>{t("login.secureText")}</span>
        </div>
      </AuthCard>
    </AuthShell>
  );
};

export default LoginPage;
