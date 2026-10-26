import { useState } from "react";
import { Link, useParams } from "react-router";
import { useTranslation } from "react-i18next";
import { ArrowLeft, CircleCheck, Cpu, LoaderCircle, MapPin, Save, Settings2, Sprout, TriangleAlert } from "lucide-react";
import apiClient, { getErrorCode } from "../api/axiosConfig";
import { useAuth } from "../context/AuthContext";
import Alert from "../components/common/Alert";
import FormField from "../components/common/FormField";
import SelectField from "../components/common/SelectField";
import { AdviceCard } from "../components/telemetry/AdviceList";
import { MetricTile } from "../components/telemetry/NodeCard";
import HistoryChart from "../components/telemetry/HistoryChart";
import { useNodeHistory, useTelemetryNodes } from "../hooks/useTelemetry";
import { METRIC_ORDER, toneFor } from "../utils/metrics";

const PERIODS = [6, 24, 168];
const CROP_IDS = ["lettuce", "tomato", "strawberry", "bellPepper", "cucumber", "leafyGreens"];
const EDITOR_ROLES = ["admin", "farm_manager"];

const NodeSettings = ({ node, onSaved }) => {
  const { t } = useTranslation();
  const [form, setForm] = useState({ name: node.name, location: node.location || "", cropProfile: node.cropProfile });
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState(null);

  const update = (field) => (event) => setForm((current) => ({ ...current, [field]: event.target.value }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setNotice(null);
    try {
      const { data } = await apiClient.patch(`/telemetry/nodes/${encodeURIComponent(node.nodeId)}`, form);
      onSaved(data);
      setNotice({ tone: "success", text: t("telemetry.saved") });
    } catch (error) {
      setNotice({ tone: "error", text: t(`errors.${getErrorCode(error)}`, { defaultValue: t("errors.default") }) });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="glass space-y-4 rounded-3xl p-6 shadow-xl shadow-tea-900/10">
      <h2 className="flex items-center gap-2 text-lg font-extrabold text-gray-900">
        <Settings2 className="h-5 w-5 text-leaf-600" aria-hidden="true" />
        {t("telemetry.settings")}
      </h2>
      {notice && <Alert tone={notice.tone}>{notice.text}</Alert>}
      <FormField id="node-name" label={t("telemetry.name")} icon={Cpu} value={form.name} onChange={update("name")} maxLength={80} />
      <FormField id="node-location" label={t("telemetry.location")} icon={MapPin} value={form.location} onChange={update("location")} maxLength={120} />
      <SelectField id="node-crop" label={t("telemetry.crop")} icon={Sprout} value={form.cropProfile} onChange={update("cropProfile")}>
        {CROP_IDS.map((crop) => <option key={crop} value={crop}>{t(`crops.${crop}`)}</option>)}
      </SelectField>
      <button
        type="submit"
        disabled={saving}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-leaf-500 to-tea-600 px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-leaf-500/25 hover:from-leaf-600 hover:to-tea-700 disabled:opacity-70"
      >
        {saving ? <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Save className="h-4 w-4" aria-hidden="true" />}
        {saving ? t("telemetry.saving") : t("telemetry.save")}
      </button>
    </form>
  );
};

const NodeDetailPage = () => {
  const { nodeId } = useParams();
  const { t } = useTranslation();
  const { user } = useAuth();
  const { nodes, setNodes, loaded } = useTelemetryNodes();
  const [hours, setHours] = useState(24);
  const history = useNodeHistory(nodeId, hours);

  const node = nodes.find((item) => item.nodeId === nodeId);
  const canEdit = EDITOR_ROLES.includes(user.role);

  const backLink = (
    <Link to="/dashboard" className="inline-flex items-center gap-1.5 text-sm font-semibold text-leaf-700 hover:underline">
      <ArrowLeft className="h-4 w-4" aria-hidden="true" />
      {t("telemetry.back")}
    </Link>
  );

  if (!loaded) {
    return (
      <div className="flex justify-center py-20">
        <LoaderCircle className="h-8 w-8 animate-spin text-leaf-600" aria-label={t("common.loading")} />
      </div>
    );
  }
  if (!node) {
    return (
      <div className="space-y-4">
        {backLink}
        <Alert tone="error">{t("telemetry.notFound")}</Alert>
      </div>
    );
  }

  const { metrics, issues } = node.assessment;
  const reported = METRIC_ORDER.filter((metric) => metrics[metric]);

  return (
    <div className="space-y-6">
      {backLink}

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 sm:text-3xl">{node.name}</h1>
          <p className="mt-1 flex flex-wrap items-center gap-x-3 text-sm text-gray-600">
            <span className="font-semibold">{node.nodeId}</span>
            <span>{t(`crops.${node.cropProfile}`)}</span>
            {node.location && <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" aria-hidden="true" />{node.location}</span>}
          </p>
        </div>
        <div role="group" aria-label={t("telemetry.history", { hours })} className="glass inline-flex rounded-xl p-1 shadow-sm">
          {PERIODS.map((period) => (
            <button
              key={period}
              type="button"
              aria-pressed={hours === period}
              onClick={() => setHours(period)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${hours === period ? "bg-leaf-600 text-white" : "text-gray-600 hover:text-gray-900"}`}
            >
              {period === 168 ? t("telemetry.last7Days") : t("telemetry.history", { hours: period })}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <section className="glass rounded-3xl p-6 shadow-xl shadow-tea-900/10">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-extrabold text-gray-900">
              {issues.length > 0
                ? <TriangleAlert className="h-5 w-5 text-gold-600" aria-hidden="true" />
                : <CircleCheck className="h-5 w-5 text-leaf-600" aria-hidden="true" />}
              {t("telemetry.problemsOnNode")}
            </h2>
            {issues.length === 0 ? (
              <p className="rounded-2xl bg-leaf-50/80 p-4 text-sm text-leaf-700">{t("telemetry.allGood")}</p>
            ) : (
              <ul className="space-y-3">
                {issues.map((issue) => (
                  <li key={issue.code}><AdviceCard issue={issue} node={node} showNode={false} /></li>
                ))}
              </ul>
            )}
          </section>

          <div className="grid gap-4 md:grid-cols-2">
            {reported.map((metric) => (
              <HistoryChart
                key={metric}
                metric={metric}
                points={history?.series?.[metric] || []}
                optimal={metrics[metric].optimal}
                unit={metrics[metric].unit}
                tone={toneFor(metrics[metric])}
                hours={hours}
              />
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <section className="glass space-y-2 rounded-3xl p-5 shadow-xl shadow-tea-900/10">
            {reported.map((metric) => <MetricTile key={metric} metric={metric} evaluation={metrics[metric]} />)}
          </section>
          {canEdit ? (
            <NodeSettings
              key={node.nodeId}
              node={node}
              onSaved={(saved) => setNodes((current) => current.map((item) => (item.nodeId === saved.nodeId ? saved : item)))}
            />
          ) : (
            <p className="glass rounded-2xl p-4 text-xs text-gray-500">{t("telemetry.noAccess")}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default NodeDetailPage;
