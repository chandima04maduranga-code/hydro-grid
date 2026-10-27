import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { useTranslation } from "react-i18next";
import { Activity, ArrowLeft, Cpu, LoaderCircle, Maximize2, Pencil, Save, Sprout, Trash2, Users } from "lucide-react";
import apiClient, { getErrorCode } from "../api/axiosConfig";
import { useAuth } from "../context/AuthContext";
import Alert from "../components/common/Alert";
import Avatar from "../components/common/Avatar";
import ConfirmDialog from "../components/common/ConfirmDialog";
import { RoleBadge } from "../components/common/Badges";
import GreenhouseForm from "../components/greenhouses/GreenhouseForm";
import HealthSummary from "../components/telemetry/HealthSummary";
import AdviceList from "../components/telemetry/AdviceList";
import NodeCard from "../components/telemetry/NodeCard";
import { GREENHOUSE_STATUS_STYLES, displayCode } from "../utils/greenhouses";

const REFRESH_MS = 10000;
const ASSIGNABLE_ROLES = ["farm_manager", "field_officer"];

// Admins tick which farm managers and field officers work in the greenhouse
const StaffEditor = ({ greenhouse, onSaved }) => {
  const { t } = useTranslation();
  const [candidates, setCandidates] = useState(null);
  const [selected, setSelected] = useState(() => new Set(greenhouse.assignedUsers.map((user) => user._id)));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    apiClient.get("/users", { params: { status: "active" } })
      .then(({ data }) => {
        if (!cancelled) setCandidates(data.filter((user) => ASSIGNABLE_ROLES.includes(user.role)));
      })
      .catch(() => {
        if (!cancelled) setCandidates([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const toggle = (id) =>
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const save = async () => {
    setSaving(true);
    await onSaved([...selected]);
    setSaving(false);
  };

  if (!candidates) return <LoaderCircle className="h-5 w-5 animate-spin text-leaf-600" aria-label={t("common.loading")} />;
  if (candidates.length === 0) return <p className="text-sm text-gray-500">{t("greenhouses.noAssignable")}</p>;

  return (
    <div className="space-y-3">
      <ul className="space-y-2">
        {candidates.map((user) => (
          <li key={user._id}>
            <label className="flex cursor-pointer items-center gap-3 rounded-md border border-gray-200 p-2.5 hover:bg-gray-50">
              <input type="checkbox" checked={selected.has(user._id)} onChange={() => toggle(user._id)} className="h-4 w-4 accent-leaf-600" />
              <Avatar name={user.name} size="sm" />
              <span className="min-w-0 flex-1 truncate text-sm font-semibold text-gray-800">{user.name}</span>
              <RoleBadge role={user.role} />
            </label>
          </li>
        ))}
      </ul>
      <button
        type="button"
        onClick={save}
        disabled={saving}
        className="btn btn-primary w-full"
      >
        {saving ? <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Save className="h-4 w-4" aria-hidden="true" />}
        {t("greenhouses.saveStaff")}
      </button>
    </div>
  );
};

const GreenhouseDetailPage = () => {
  const { id } = useParams();
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const isAdmin = user.role === "admin";
  const canEdit = isAdmin || user.role === "farm_manager";

  const [greenhouse, setGreenhouse] = useState(null);
  const [missing, setMissing] = useState(false);
  const [editing, setEditing] = useState(false);
  const [notice, setNotice] = useState(null);
  const [confirmArchive, setConfirmArchive] = useState(false);

  const load = useCallback(
    () =>
      apiClient.get(`/greenhouses/${id}`)
        .then(({ data }) => setGreenhouse(data))
        .catch((error) => {
          if (error.response?.status === 404) setMissing(true);
        }),
    [id]
  );

  useEffect(() => {
    let cancelled = false;
    const poll = () =>
      apiClient.get(`/greenhouses/${id}`)
        .then(({ data }) => {
          if (!cancelled) setGreenhouse(data);
        })
        .catch((error) => {
          if (!cancelled && error.response?.status === 404) setMissing(true);
        });
    poll();
    const timer = setInterval(poll, REFRESH_MS);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [id]);

  const showError = (error) => setNotice({ tone: "error", text: t(`errors.${getErrorCode(error)}`, { defaultValue: t("errors.default") }) });

  const saveDetails = async (payload) => {
    try {
      await apiClient.patch(`/greenhouses/${id}`, payload);
      setEditing(false);
      setNotice({ tone: "success", text: t("greenhouses.updated") });
      load();
      return null;
    } catch (error) {
      showError(error);
      return error.response?.data?.errors || null;
    }
  };

  const saveStaff = async (userIds) => {
    try {
      await apiClient.put(`/greenhouses/${id}/staff`, { userIds });
      setNotice({ tone: "success", text: t("greenhouses.staffSaved") });
      load();
    } catch (error) {
      showError(error);
    }
  };

  const archive = async () => {
    setConfirmArchive(false);
    try {
      await apiClient.delete(`/greenhouses/${id}`);
      navigate("/greenhouses", { replace: true });
    } catch (error) {
      showError(error);
    }
  };

  const backLink = (
    <Link to="/greenhouses" className="inline-flex items-center gap-1.5 text-sm font-semibold text-leaf-700 hover:underline">
      <ArrowLeft className="h-4 w-4" aria-hidden="true" />
      {t("greenhouses.back")}
    </Link>
  );

  if (missing) return <div className="space-y-4">{backLink}<Alert tone="error">{t("errors.GREENHOUSE_NOT_FOUND")}</Alert></div>;
  if (!greenhouse) {
    return (
      <div className="flex justify-center py-20">
        <LoaderCircle className="h-8 w-8 animate-spin text-leaf-600" aria-label={t("common.loading")} />
      </div>
    );
  }

  const details = [
    { icon: Activity, label: t("greenhouses.system"), value: t(`systemTypes.${greenhouse.systemType}`) },
    { icon: Sprout, label: t("greenhouses.mainCrop"), value: greenhouse.mainCrop ? t(`crops.${greenhouse.mainCrop}`) : t("greenhouses.noMainCrop") },
    { icon: Maximize2, label: t("greenhouses.area"), value: greenhouse.areaSqm ? t("greenhouses.areaValue", { area: greenhouse.areaSqm }) : "—" }
  ];

  return (
    <div className="space-y-6">
      {backLink}

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{displayCode(t, greenhouse)}</p>
          <h1 className="text-xl font-semibold text-gray-900">{greenhouse.name}</h1>
          <span className={`mt-2 inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${GREENHOUSE_STATUS_STYLES[greenhouse.status]}`}>
            {t(`greenhouseStatuses.${greenhouse.status}`)}
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {canEdit && !editing && (
            <button type="button" onClick={() => setEditing(true)} className="btn btn-secondary">
              <Pencil className="h-4 w-4" aria-hidden="true" />
              {t("greenhouses.edit")}
            </button>
          )}
          {isAdmin && (
            <button type="button" onClick={() => setConfirmArchive(true)} className="btn btn-danger">
              <Trash2 className="h-4 w-4" aria-hidden="true" />
              {t("greenhouses.archive")}
            </button>
          )}
        </div>
      </div>

      {notice && <Alert tone={notice.tone}>{notice.text}</Alert>}

      {greenhouse.nodes.length > 0 && <HealthSummary nodes={greenhouse.nodes} />}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {greenhouse.nodes.length > 0 ? (
            <>
              <AdviceList nodes={greenhouse.nodes} />
              <section>
                <h2 className="mb-3 flex items-center gap-2 text-base font-semibold text-gray-900">
                  <Cpu className="h-4 w-4 text-gray-400" aria-hidden="true" />
                  {t("greenhouses.sensors")}
                </h2>
                <div className="grid gap-6">
                  {greenhouse.nodes.map((node) => <NodeCard key={node._id} node={node} />)}
                </div>
              </section>
            </>
          ) : (
            <div className="panel flex flex-col items-center rounded-lg py-12 text-center">
              <Cpu className="h-8 w-8 text-gray-300" aria-hidden="true" />
              <p className="mt-3 text-sm text-gray-500">{t("greenhouses.noNodes")}</p>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <section className="panel rounded-lg p-6">
            {editing ? (
              <GreenhouseForm initial={greenhouse} onSubmit={saveDetails} onCancel={() => setEditing(false)} />
            ) : (
              <>
                <dl className="space-y-3 text-sm">
                  {details.map(({ icon: Icon, label, value }) => (
                    <div key={label} className="flex items-center gap-3">
                      <Icon className="h-4 w-4 text-gray-400" aria-hidden="true" />
                      <dt className="w-32 text-gray-500">{label}</dt>
                      <dd className="font-semibold text-gray-800">{value}</dd>
                    </div>
                  ))}
                </dl>
                {greenhouse.notes && <p className="mt-4 rounded-md bg-gray-50 p-3 text-sm text-gray-700">{greenhouse.notes}</p>}
              </>
            )}
          </section>

          <section className="panel rounded-lg p-6">
            <h2 className="mb-1 flex items-center gap-2 text-base font-semibold text-gray-900">
              <Users className="h-4 w-4 text-gray-400" aria-hidden="true" />
              {isAdmin ? t("greenhouses.assignStaff") : t("greenhouses.staff")}
            </h2>
            <p className="mb-4 text-xs text-gray-500">{t("greenhouses.staffHint")}</p>
            {isAdmin ? (
              <StaffEditor key={greenhouse.assignedUsers.map((u) => u._id).join()} greenhouse={greenhouse} onSaved={saveStaff} />
            ) : greenhouse.assignedUsers.length === 0 ? (
              <p className="text-sm text-gray-500">{t("greenhouses.noStaff")}</p>
            ) : (
              <ul className="space-y-2">
                {greenhouse.assignedUsers.map((member) => (
                  <li key={member._id} className="flex items-center gap-3 rounded-md border border-gray-200 p-2.5">
                    <Avatar name={member.name} size="sm" />
                    <span className="min-w-0 flex-1 truncate text-sm font-semibold text-gray-800">{member.name}</span>
                    <RoleBadge role={member.role} />
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>

      <ConfirmDialog
        open={confirmArchive}
        message={t("greenhouses.confirmArchive", { code: displayCode(t, greenhouse) })}
        confirmLabel={t("greenhouses.archive")}
        onCancel={() => setConfirmArchive(false)}
        onConfirm={archive}
      />
    </div>
  );
};

export default GreenhouseDetailPage;
