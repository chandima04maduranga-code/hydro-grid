import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { LoaderCircle, Lock, Mail, ShieldCheck } from "lucide-react";
import AuthShell from "../components/auth/AuthShell";
import Alert from "../components/common/Alert";
import FormField, { PasswordField } from "../components/common/FormField";
import { useAuth } from "../context/AuthContext";
import { getErrorCode } from "../api/axiosConfig";

const WARNING_CODES = ["ACCOUNT_PENDING", "SESSION_EXPIRED"];

const LoginPage = () => {
  const { t } = useTranslation();
  const { login, sessionExpired } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [errorCode, setErrorCode] = useState(sessionExpired ? "SESSION_EXPIRED" : "");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorCode("");
    setSubmitting(true);
    try {
      await login(email, password, remember);
      navigate(location.state?.from?.pathname || "/dashboard", { replace: true });
    } catch (error) {
      setErrorCode(getErrorCode(error));
      setSubmitting(false);
    }
  };

  return (
    <AuthShell>
      <div className="rounded-3xl border border-tea-100 bg-white p-8 shadow-xl shadow-tea-900/5 sm:p-10">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900">{t("login.title")}</h2>
          <p className="mt-1.5 text-sm text-gray-500">{t("login.subtitle")}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          {errorCode && (
            <Alert tone={WARNING_CODES.includes(errorCode) ? "warning" : "error"}>
              {t(`errors.${errorCode}`, { defaultValue: t("errors.default") })}
            </Alert>
          )}

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

          <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-600">
            <input
              type="checkbox"
              checked={remember}
              onChange={(event) => setRemember(event.target.checked)}
              className="h-4 w-4 rounded border-gray-300 accent-tea-700"
            />
            {t("login.remember")}
          </label>

          <button
            type="submit"
            disabled={submitting}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-tea-700 px-4 py-3 font-semibold text-white transition hover:bg-tea-800 focus:outline-none focus:ring-4 focus:ring-tea-500/25 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {submitting && <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />}
            {submitting ? t("login.submitting") : t("login.submit")}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-600">
          {t("login.noAccount")}{" "}
          <Link to="/register" className="font-semibold text-tea-700 hover:text-tea-800 hover:underline">
            {t("login.register")}
          </Link>
        </p>

        <div className="mt-8 flex items-start gap-3 rounded-2xl bg-tea-50 p-4">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-tea-700" aria-hidden="true" />
          <div className="text-xs text-gray-600">
            <p className="font-semibold text-gray-800">{t("login.secureTitle")}</p>
            <p className="mt-0.5">{t("login.secureText")}</p>
          </div>
        </div>
      </div>
    </AuthShell>
  );
};

export default LoginPage;
