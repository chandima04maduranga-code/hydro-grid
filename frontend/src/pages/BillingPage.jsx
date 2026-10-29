import { useEffect, useState } from "react";
import { useSearchParams } from "react-router";
import { useTranslation } from "react-i18next";
import { Check, CreditCard, LoaderCircle, Receipt } from "lucide-react";
import apiClient, { getErrorCode } from "../api/axiosConfig";
import Alert from "../components/common/Alert";
import { formatDateTime, formatLKR } from "../utils/format";

const STATUS_STYLES = {
  paid: "bg-emerald-100 text-emerald-800",
  pending: "bg-amber-100 text-amber-800",
  cancelled: "bg-gray-100 text-gray-600",
  failed: "bg-red-100 text-red-800",
  chargedback: "bg-red-100 text-red-800"
};

// PayHere checkout requires a top-level form POST, not an XHR
const submitToPayHere = ({ action, fields }) => {
  const form = document.createElement("form");
  form.method = "POST";
  form.action = action;
  for (const [name, value] of Object.entries(fields)) {
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = name;
    input.value = value;
    form.appendChild(input);
  }
  document.body.appendChild(form);
  form.submit();
};

const limitText = (t, key, count) => (count === null ? t(`plans.unlimited${key[0].toUpperCase()}${key.slice(1)}`) : t(`plans.${key}`, { count }));

const BillingPage = () => {
  const { t, i18n } = useTranslation();
  const [params, setParams] = useSearchParams();
  const [billing, setBilling] = useState(null);
  const [cycle, setCycle] = useState("monthly");
  const [paying, setPaying] = useState("");
  const [errorCode, setErrorCode] = useState("");
  const cancelledOrder = params.get("cancelled");

  useEffect(() => {
    let cancelled = false;
    const cancelFirst = cancelledOrder
      ? apiClient.post(`/billing/payments/${encodeURIComponent(cancelledOrder)}/cancel`).catch(() => {})
      : Promise.resolve();
    cancelFirst
      .then(() => apiClient.get("/billing"))
      .then(({ data }) => {
        if (!cancelled) setBilling(data);
      })
      .catch((error) => {
        if (!cancelled) setErrorCode(getErrorCode(error));
      });
    return () => {
      cancelled = true;
    };
  }, [cancelledOrder]);

  const pay = async (plan) => {
    setPaying(plan);
    setErrorCode("");
    try {
      const { data } = await apiClient.post("/billing/checkout", { plan, billingCycle: cycle });
      submitToPayHere(data);
    } catch (error) {
      setErrorCode(getErrorCode(error));
      setPaying("");
    }
  };

  if (!billing) {
    return errorCode
      ? <Alert tone="error">{t(`errors.${errorCode}`, { defaultValue: t("errors.default") })}</Alert>
      : <div className="flex justify-center py-20"><LoaderCircle className="h-8 w-8 animate-spin text-leaf-600" aria-label={t("common.loading")} /></div>;
  }

  const onTrial = billing.plan === "trial";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">{t("billing.title")}</h1>
        <p className="mt-1 text-sm text-gray-600">{t("billing.subtitle")}</p>
      </div>

      {cancelledOrder && (
        <Alert tone="info">
          {t("billing.cancelledNotice")}{" "}
          <button type="button" className="font-semibold underline" onClick={() => setParams({}, { replace: true })}>{t("billing.dismiss")}</button>
        </Alert>
      )}
      {errorCode && <Alert tone="error">{t(`errors.${errorCode}`, { defaultValue: t("errors.default") })}</Alert>}
      {!billing.payhereReady && <Alert tone="warning">{t("billing.notConfigured")}</Alert>}

      <section className={`panel flex flex-wrap items-center gap-4 p-5 ${billing.expired ? "border-red-200 bg-red-50" : ""}`}>
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-leaf-100 text-leaf-700">
          <CreditCard className="h-6 w-6" aria-hidden="true" />
        </span>
        <div className="min-w-[12rem] flex-1">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{t("billing.currentPlan")}</p>
          <p className="text-lg font-semibold text-gray-900">
            {t(`plans.${billing.plan}.name`)}
            {!onTrial && <span className="ml-2 text-sm font-normal text-gray-500">{t(`plans.${billing.billingCycle}`)}</span>}
          </p>
          <p className={`text-sm ${billing.expired ? "font-semibold text-red-700" : "text-gray-600"}`}>
            {onTrial
              ? (billing.expired ? t("billing.trialEnded") : t("billing.trialLeft", { count: billing.trialDaysLeft ?? 0 }))
              : billing.paidUntil
                ? (billing.expired ? t("billing.expiredOn", { date: formatDateTime(billing.paidUntil, i18n.language) }) : t("billing.paidUntil", { date: formatDateTime(billing.paidUntil, i18n.language) }))
                : t("billing.notPaidYet")}
          </p>
        </div>
      </section>

      <section>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-semibold text-gray-900">{onTrial ? t("billing.choosePlan") : t("billing.renewOrChange")}</h2>
          <div role="group" aria-label={t("billing.cycle")} className="inline-flex overflow-hidden rounded-md border border-gray-300 bg-white">
            {["monthly", "yearly"].map((option) => (
              <button
                key={option}
                type="button"
                aria-pressed={cycle === option}
                onClick={() => setCycle(option)}
                className={`border-l border-gray-300 px-3 py-1.5 text-sm font-medium first:border-l-0 ${cycle === option ? "bg-leaf-700 text-white" : "text-gray-700 hover:bg-gray-50"}`}
              >
                {t(`plans.${option}`)}
                {option === "yearly" && <span className="ml-1 text-xs opacity-80">({t("plans.yearlySaving")})</span>}
              </button>
            ))}
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {billing.prices.map(({ plan, monthly, yearly, limits }) => {
            const current = billing.plan === plan && !billing.expired;
            return (
              <article key={plan} className={`panel flex flex-col p-5 ${plan === "growth" ? "ring-2 ring-leaf-600" : ""}`}>
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-gray-900">{t(`plans.${plan}.name`)}</h3>
                  {plan === "growth" && <span className="rounded-full bg-leaf-100 px-2 py-0.5 text-[11px] font-semibold text-leaf-800">{t("plans.popular")}</span>}
                </div>
                <p className="text-xs text-gray-500">{t(`plans.${plan}.tagline`)}</p>
                <p className="mt-3 text-2xl font-bold text-gray-900">
                  {formatLKR(cycle === "yearly" ? yearly : monthly, i18n.language)}
                  <span className="ml-1 text-sm font-normal text-gray-500">{cycle === "yearly" ? t("plans.perYear") : t("plans.perMonth")}</span>
                </p>
                <ul className="mt-3 flex-1 space-y-1.5 text-sm text-gray-700">
                  {["greenhouses", "users", "sensorNodes"].map((key) => (
                    <li key={key} className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-leaf-600" aria-hidden="true" />
                      {limitText(t, key, limits[key])}
                    </li>
                  ))}
                </ul>
                <button
                  type="button"
                  onClick={() => pay(plan)}
                  disabled={!billing.payhereReady || Boolean(paying)}
                  className={`btn mt-4 w-full ${plan === "growth" ? "btn-primary" : "btn-secondary"}`}
                >
                  {paying === plan && <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />}
                  {current ? t("billing.renew") : t("billing.payWithPayHere")}
                </button>
              </article>
            );
          })}
        </div>
        <p className="mt-2 text-xs text-gray-500">{t("billing.secureNote")}</p>
      </section>

      <section className="panel overflow-x-auto">
        <h2 className="flex items-center gap-2 border-b border-gray-200 px-4 py-3 font-semibold text-gray-900">
          <Receipt className="h-4 w-4 text-leaf-700" aria-hidden="true" />
          {t("billing.history")}
        </h2>
        {billing.payments.length === 0 ? (
          <p className="px-4 py-6 text-sm text-gray-500">{t("billing.noPayments")}</p>
        ) : (
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="bg-gray-50 text-xs text-gray-500">
              <tr>
                <th scope="col" className="px-4 py-2.5 font-medium">{t("billing.date")}</th>
                <th scope="col" className="px-4 py-2.5 font-medium">{t("billing.plan")}</th>
                <th scope="col" className="px-4 py-2.5 font-medium">{t("billing.amount")}</th>
                <th scope="col" className="px-4 py-2.5 font-medium">{t("billing.status")}</th>
                <th scope="col" className="px-4 py-2.5 font-medium">{t("billing.reference")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {billing.payments.map((payment) => (
                <tr key={payment._id}>
                  <td className="px-4 py-2.5 text-gray-700">{formatDateTime(payment.paidAt || payment.createdAt, i18n.language)}</td>
                  <td className="px-4 py-2.5 text-gray-700">{t(`plans.${payment.plan}.name`)} · {t(`plans.${payment.billingCycle}`)}</td>
                  <td className="px-4 py-2.5 tabular-nums text-gray-900">{formatLKR(payment.amountLkr, i18n.language)}</td>
                  <td className="px-4 py-2.5">
                    <span className={`rounded px-2 py-0.5 text-xs font-semibold ${STATUS_STYLES[payment.status]}`}>{t(`billing.statuses.${payment.status}`)}</span>
                  </td>
                  <td className="px-4 py-2.5 font-mono text-xs text-gray-500">{payment.payherePaymentId || payment.orderId}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
};

export default BillingPage;
