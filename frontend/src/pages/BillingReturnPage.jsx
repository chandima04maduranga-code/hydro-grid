import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { useTranslation } from "react-i18next";
import { CircleCheck, Clock, LoaderCircle } from "lucide-react";
import apiClient from "../api/axiosConfig";

const CHECK_EVERY_MS = 3000;
const GIVE_UP_AFTER = 10;

// The plan changes only when PayHere's server notification arrives, which
// can be after the user is redirected back, so poll briefly.
const BillingReturnPage = () => {
  const { t } = useTranslation();
  const [params] = useSearchParams();
  const orderId = params.get("order");
  const [state, setState] = useState({ status: "checking", tries: 0 });

  useEffect(() => {
    if (state.status !== "checking") return undefined;
    const timer = setTimeout(() => {
      apiClient.get("/billing")
        .then(({ data }) => {
          const payment = data.payments.find((item) => item.orderId === orderId);
          if (payment?.status === "paid") setState({ status: "paid", tries: state.tries + 1 });
          else if (state.tries + 1 >= GIVE_UP_AFTER) setState({ status: "waiting", tries: state.tries + 1 });
          else setState({ status: "checking", tries: state.tries + 1 });
        })
        .catch(() => setState({ status: "waiting", tries: state.tries + 1 }));
    }, state.tries === 0 ? 500 : CHECK_EVERY_MS);
    return () => clearTimeout(timer);
  }, [state, orderId]);

  return (
    <div className="mx-auto max-w-lg py-10">
      <section className="panel p-8 text-center">
        {state.status === "paid" ? (
          <CircleCheck className="mx-auto h-12 w-12 text-emerald-600" aria-hidden="true" />
        ) : state.status === "checking" ? (
          <LoaderCircle className="mx-auto h-12 w-12 animate-spin text-leaf-600" aria-hidden="true" />
        ) : (
          <Clock className="mx-auto h-12 w-12 text-amber-500" aria-hidden="true" />
        )}
        <h1 className="mt-4 text-xl font-semibold text-gray-900">{t(`billing.return.${state.status}Title`)}</h1>
        <p className="mt-2 text-sm text-gray-600">{t(`billing.return.${state.status}Text`)}</p>
        {orderId && <p className="mt-3 font-mono text-xs text-gray-400">{orderId}</p>}
        <Link to="/billing" className="btn btn-primary mt-6">{t("billing.backToBilling")}</Link>
      </section>
    </div>
  );
};

export default BillingReturnPage;
