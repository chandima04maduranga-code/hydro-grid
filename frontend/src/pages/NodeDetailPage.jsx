import { useState } from "react";
import { Link, useParams } from "react-router";
import { useTranslation } from "react-i18next";
import { ArrowLeft, CircleCheck, Cpu, LoaderCircle, MapPin, Save, Settings2, Sprout, TriangleAlert, Warehouse } from "lucide-react";
import apiClient, { getErrorCode } from "../api/axiosConfig";
import { useAuth } from "../context/AuthContext";
import Alert from "../components/common/Alert";
import FormField from "../components/common/FormField";
import SelectField from "../components/common/SelectField";
import { AdviceCard } from "../components/telemetry/AdviceList";
import { MetricTile } from "../components/telemetry/NodeCard";
import HistoryChart from "../components/telemetry/HistoryChart";
import { useNodeHistory, useTelemetryNodes } from "../hooks/useTelemetry";
import { useGreenhouses } from "../hooks/useGreenhouses";
import { displayCode } from "../utils/greenhouses";
import { METRIC_ORDER, toneFor } from "../utils/metrics";

const PERIODS = [6, 24, 168];
const CROP_IDS = ["lettuce", "tomato", "strawberry", "bellPepper", "cucumber", "leafyGreens"];
const EDITOR_ROLES = ["admin", "farm_manager"];

const NodeSettings = ({ node, canUnplace, onSaved }) => {
  const { t } = useTranslation();
  const { greenhouses } = useGreenhouses();
  const [form, setForm] = useState({
    name: node.name,
    location: node.location || "",
    cropProfile: node.cropProfile,
    greenhouse: node.greenhouse?._id || ""
  });
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState(null);

  const update = (field) => (event) => setForm((current) => ({ ...current, [field]: event.target.value }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setNotice(null);
    try {
      const { data } = await apiClient.patch(`/telemetry/nodes/${encodeURIComponent(node.nodeId)}`, {
        ...form,
        greenhouse: form.greenhouse || null
      });
      onSaved(data);
      setNotice({ tone: "success", text: t("telemetry.saved") });
    } catch (error) {
      setNotice({ tone: "error", text: t(`errors.${getErrorCode(error)}`, { defaultValue: t("errors.default") }) });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="panel space-y-4 rounded-lg p-6">
      <h2 className="flex items-center gap-2 text-base font-semibold text-gray-900">
        <Settings2 className="h-5 w-5 text-leaf-600" aria-hidden="true" />
        {t("telemetry.settings")}
      </h2>
      {notice && <Alert tone={notice.tone}>{notice.text}</Alert>}
      <FormField id="node-name" label={t("telemetry.name")} icon={Cpu} value={form.name} onChange={update("name")} maxLength={80} />
      <FormField id="node-location" label={t("telemetry.location")} icon={MapPin} value={form.location} onChange={update("location")} maxLength={120} />
      <SelectField id="node-greenhouse" label={t("greenhouses.placeIn")} icon={Warehouse} value={form.greenhouse} onChange={update("greenhouse")}>
        <option value="" disabled={!canUnplace}>{t("greenhouses.chooseGreenhouse")}</option>
        {greenhouses.map((greenhouse) => (
          <option key={greenhouse._id} value={greenhouse._id}>{displayCode(t, greenhouse)} · {greenhouse.name}</option>
        ))}
      </SelectField>
      <SelectField id="node-crop" label={t("telemetry.crop")} icon={Sprout} value={form.cropProfile} onChange={update("cropProfile")}>
        {CROP_IDS.map((crop) => <option key={crop} value={crop}>{t(`crops.${crop}`)}</option>)}
      </SelectField>
      <button
        type="submit"
        disabled={saving}
        className="btn btn-primary w-full"
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
          <h1 className="text-xl font-semibold text-gray-900">{node.name}</h1>
          <p className="mt-1 flex flex-wrap items-center gap-x-3 text-sm text-gray-600">
            <span className="font-mono text-xs">{node.nodeId}</span>
            <span>{t(`crops.${node.cropProfile}`)}</span>
            {node.location && <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" aria-hidden="true" />{node.location}</span>}
          </p>
        </div>
        <div role="group" aria-label={t("telemetry.history", { hours })} className="inline-flex overflow-hidden rounded-md border border-gray-300 bg-white">
          {PERIODS.map((period) => (
            <button
              key={period}
              type="button"
              aria-pressed={hours === period}
              onClick={() => setHours(period)}
              className={`border-l border-gray-300 px-3 py-1.5 text-xs font-semibold first:border-l-0 ${hours === period ? "bg-leaf-700 text-white" : "text-gray-600 hover:bg-gray-50"}`}
            >
              {period === 168 ? t("telemetry.last7Days") : t("telemetry.history", { hours: period })}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <section className="panel rounded-lg p-6">
            <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-gray-900">
              {issues.length > 0
                ? <TriangleAlert className="h-5 w-5 text-gold-600" aria-hidden="true" />
                : <CircleCheck className="h-5 w-5 text-leaf-600" aria-hidden="true" />}
              {t("telemetry.problemsOnNode")}
            </h2>
            {issues.length === 0 ? (
              <p className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{t("telemetry.allGood")}</p>
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
          <section className="panel divide-y divide-gray-100 px-4 py-1">
            {reported.map((metric) => <MetricTile key={metric} metric={metric} evaluation={metrics[metric]} />)}
          </section>
          {canEdit ? (
            <NodeSettings
              key={node.nodeId}
              node={node}
              canUnplace={user.role === "admin"}
              onSaved={(saved) => setNodes((current) => current.map((item) => (item.nodeId === saved.nodeId ? saved : item)))}
            />
          ) : (
            <p className="panel rounded-lg p-4 text-xs text-gray-500">{t("telemetry.noAccess")}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default NodeDetailPage;
