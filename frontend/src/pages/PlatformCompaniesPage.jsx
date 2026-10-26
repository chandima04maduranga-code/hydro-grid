import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Building2, CalendarClock, Check, Clock, Inbox, LoaderCircle, Mail, MapPin, Pause, Phone, Play, Users, X
} from "lucide-react";
import apiClient, { getErrorCode } from "../api/axiosConfig";
import Alert from "../components/common/Alert";
import ConfirmDialog from "../components/common/ConfirmDialog";
import { formatDateTime } from "../utils/format";
import { COMPANIES_CHANGED_EVENT } from "../utils/events";

const TABS = ["pending", "active", "suspended", "rejected", "all"];

const STATUS_STYLES = {
  pending: "bg-gold-100 text-gold-600 ring-gold-300",
  active: "bg-leaf-50 text-leaf-700 ring-leaf-500/30",
  suspended: "bg-red-50 text-red-700 ring-red-300",
  rejected: "bg-gray-100 text-gray-500 ring-gray-200"
};

const PLAN_STYLES = {
  trial: "bg-white text-gray-600 ring-gray-200",
  starter: "bg-cyan-50 text-cyan-700 ring-cyan-200",
  growth: "bg-leaf-50 text-leaf-700 ring-leaf-500/30",
  enterprise: "bg-tea-800 text-white ring-tea-800"
};

const pill = "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset";

const SummaryTile = ({ icon: Icon, label, value, tone }) => (
  <div className="glass flex items-center gap-4 rounded-2xl p-4 shadow-lg shadow-tea-900/5">
    <span className={`flex h-12 w-12 items-center justify-center rounded-full ${tone}`}>
      <Icon className="h-6 w-6" aria-hidden="true" />
    </span>
    <div>
      <p className="text-2xl font-extrabold text-gray-900">{value}</p>
      <p className="text-xs font-medium text-gray-500">{label}</p>
    </div>
  </div>
);

const PlatformCompaniesPage = () => {
  const { t, i18n } = useTranslation();
  const [companies, setCompanies] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("pending");
  const [busyId, setBusyId] = useState(null);
  const [notice, setNotice] = useState(null);
  const [confirm, setConfirm] = useState(null);

  const loadSummary = useCallback(() => {
    apiClient.get("/platform/summary").then(({ data }) => setSummary(data)).catch(() => {});
  }, []);

  useEffect(() => {
    let cancelled = false;
    Promise.all([apiClient.get("/platform/companies"), apiClient.get("/platform/summary")])
      .then(([companiesRes, summaryRes]) => {
        if (cancelled) return;
        setCompanies(companiesRes.data);
        setSummary(summaryRes.data);
        if (!companiesRes.data.some((company) => company.status === "pending")) setTab("active");
      })
      .catch((error) => {
        if (!cancelled) setNotice({ tone: "error", code: getErrorCode(error) });
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!notice) return undefined;
    const timer = setTimeout(() => setNotice(null), 5000);
    return () => clearTimeout(timer);
  }, [notice]);

  const counts = useMemo(
    () => Object.fromEntries(TABS.map((key) => [key, key === "all" ? companies.length : companies.filter((c) => c.status === key).length])),
    [companies]
  );
  const visible = tab === "all" ? companies : companies.filter((company) => company.status === tab);

  const runAction = async (company, action) => {
    setBusyId(company._id);
    try {
      const { data } = await apiClient.patch(`/platform/companies/${company._id}/${action}`);
      setCompanies((current) => current.map((item) => (item._id === data._id ? data : item)));
      setNotice({ tone: "success", text: t(`platform.${action === "approve" ? "approved" : action === "reject" ? "rejected" : action === "suspend" ? "suspended" : "reactivated"}`, { name: data.name }) });
      loadSummary();
      window.dispatchEvent(new Event(COMPANIES_CHANGED_EVENT));
    } catch (error) {
      setNotice({ tone: "error", code: getErrorCode(error) });
    } finally {
      setBusyId(null);
    }
  };

  const actionButton = (company, action, icon, classes, label, confirmMessage) => {
    const Icon = icon;
    const run = () => runAction(company, action);
    return (
      <button
        key={action}
        type="button"
        disabled={busyId === company._id}
        onClick={() => (confirmMessage ? setConfirm({ message: confirmMessage, confirmLabel: label, action: run }) : run())}
        className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold transition disabled:opacity-60 ${classes}`}
      >
        <Icon className="h-4 w-4" aria-hidden="true" />
        {label}
      </button>
    );
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-gray-900 sm:text-3xl">{t("platform.title")}</h1>
        <p className="mt-1 text-sm text-gray-600">{t("platform.subtitle")}</p>
      </div>

      {summary && (
        <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <SummaryTile icon={Clock} label={t("platform.summary.pending")} value={summary.companies.pending} tone="bg-gold-100 text-gold-600" />
          <SummaryTile icon={Building2} label={t("platform.summary.active")} value={summary.companies.active} tone="bg-leaf-50 text-leaf-600" />
          <SummaryTile icon={Pause} label={t("platform.summary.suspended")} value={summary.companies.suspended} tone="bg-red-50 text-red-600" />
          <SummaryTile icon={Users} label={t("platform.summary.users")} value={summary.users} tone="bg-cyan-50 text-cyan-600" />
        </div>
      )}

      {notice && (
        <div className="mb-4">
          <Alert tone={notice.tone}>{notice.text ?? t(`errors.${notice.code}`, { defaultValue: t("errors.default") })}</Alert>
        </div>
      )}

      <div role="tablist" className="glass mb-5 inline-flex flex-wrap rounded-xl p-1 shadow-sm">
        {TABS.map((key) => (
          <button
            key={key}
            role="tab"
            type="button"
            aria-selected={tab === key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition ${
              tab === key ? "bg-leaf-600 text-white shadow-sm" : "text-gray-600 hover:text-gray-900"
            }`}
          >
            {t(`platform.tabs.${key}`)}
            <span className={`rounded-full px-2 text-xs ${tab === key ? "bg-white/20" : "bg-gray-100"}`}>{counts[key]}</span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <LoaderCircle className="h-7 w-7 animate-spin text-leaf-600" aria-label={t("common.loading")} />
        </div>
      ) : visible.length === 0 ? (
        <div className="glass flex flex-col items-center rounded-2xl px-6 py-14 text-center">
          <Inbox className="h-10 w-10 text-leaf-400" aria-hidden="true" />
          <p className="mt-3 text-sm text-gray-500">{t("platform.empty")}</p>
        </div>
      ) : (
        <ul className="grid gap-4 lg:grid-cols-2">
          {visible.map((company) => (
            <li key={company._id} className="glass flex flex-col rounded-2xl p-5 shadow-lg shadow-tea-900/5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-leaf-50 text-leaf-600">
                    <Building2 className="h-6 w-6" aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <h2 className="truncate text-lg font-extrabold text-gray-900">{company.name}</h2>
                    <p className="flex items-center gap-1 text-xs text-gray-500">
                      <MapPin className="h-3 w-3" aria-hidden="true" />
                      {t(`districts.${company.district}`)}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1.5">
                  <span className={`${pill} ${STATUS_STYLES[company.status]}`}>{t(`companyStatuses.${company.status}`)}</span>
                  <span className={`${pill} ${PLAN_STYLES[company.plan]}`}>
                    {t(`plans.${company.plan}.name`)}
                    {company.plan !== "trial" && ` · ${t(`plans.${company.billingCycle}`)}`}
                  </span>
                </div>
              </div>

              <dl className="mt-4 grid gap-2 rounded-xl bg-white/70 p-3 text-sm text-gray-700 sm:grid-cols-2">
                {company.admin && (
                  <div className="sm:col-span-2">
                    <dt className="text-xs font-semibold uppercase tracking-wide text-gray-400">{t("platform.admin")}</dt>
                    <dd className="font-semibold text-gray-900">{company.admin.name}</dd>
                    <dd className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-gray-500">
                      <span className="flex items-center gap-1"><Mail className="h-3 w-3" aria-hidden="true" />{company.admin.email}</span>
                      {company.admin.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" aria-hidden="true" />{company.admin.phone}</span>}
                    </dd>
                  </div>
                )}
                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                  <Users className="h-3.5 w-3.5" aria-hidden="true" />
                  {t("platform.users", { count: company.userCount })}
                </div>
                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                  <CalendarClock className="h-3.5 w-3.5" aria-hidden="true" />
                  {company.trialEndsAt
                    ? t("platform.trialEnds", { date: formatDateTime(company.trialEndsAt, i18n.language) })
                    : t("platform.registered", { date: formatDateTime(company.createdAt, i18n.language) })}
                </div>
              </dl>

              <div className="mt-4 flex flex-wrap justify-end gap-2">
                {company.status === "pending" && [
                  actionButton(company, "reject", X, "border border-clay-500/40 text-clay-600 hover:bg-clay-50", t("platform.reject"), t("platform.confirmReject", { name: company.name })),
                  actionButton(company, "approve", Check, "bg-gradient-to-r from-leaf-500 to-tea-600 text-white shadow-md shadow-leaf-500/25 hover:from-leaf-600 hover:to-tea-700", t("platform.approve"))
                ]}
                {company.status === "active" &&
                  actionButton(company, "suspend", Pause, "text-red-600 hover:bg-red-50", t("platform.suspend"), t("platform.confirmSuspend", { name: company.name }))}
                {company.status === "suspended" &&
                  actionButton(company, "reactivate", Play, "bg-leaf-600 text-white hover:bg-leaf-700", t("platform.reactivate"))}
              </div>
            </li>
          ))}
        </ul>
      )}

      <ConfirmDialog
        open={Boolean(confirm)}
        message={confirm?.message}
        confirmLabel={confirm?.confirmLabel}
        onCancel={() => setConfirm(null)}
        onConfirm={() => {
          confirm.action();
          setConfirm(null);
        }}
      />
    </div>
  );
};

export default PlatformCompaniesPage;
