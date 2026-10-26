import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Check, Inbox, LoaderCircle, Mail, Phone, UserCheck, UserX, X } from "lucide-react";
import apiClient, { getErrorCode } from "../api/axiosConfig";
import { useAuth } from "../context/AuthContext";
import Alert from "../components/common/Alert";
import Avatar from "../components/common/Avatar";
import ConfirmDialog from "../components/common/ConfirmDialog";
import { RoleBadge, StatusBadge } from "../components/common/Badges";
import { formatDateTime } from "../utils/format";
import { USERS_CHANGED_EVENT } from "../utils/events";

const ROLES = ["admin", "farm_manager", "field_officer"];

const selectClasses =
  "rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 focus:border-tea-500 focus:outline-none focus:ring-4 focus:ring-tea-500/15 disabled:opacity-60";

const UserIdentity = ({ person, isSelf, youLabel }) => (
  <div className="flex min-w-0 items-center gap-3">
    <Avatar name={person.name} />
    <div className="min-w-0">
      <p className="flex items-center gap-2 truncate font-semibold text-gray-900">
        {person.name}
        {isSelf && <span className="rounded-md bg-tea-100 px-1.5 py-0.5 text-[10px] font-bold uppercase text-tea-700">{youLabel}</span>}
      </p>
      <p className="flex items-center gap-1.5 truncate text-xs text-gray-500">
        <Mail className="h-3 w-3 shrink-0" aria-hidden="true" />
        {person.email}
      </p>
      {person.phone && (
        <p className="flex items-center gap-1.5 text-xs text-gray-500">
          <Phone className="h-3 w-3 shrink-0" aria-hidden="true" />
          {person.phone}
        </p>
      )}
    </div>
  </div>
);

const UsersPage = () => {
  const { t, i18n } = useTranslation();
  const { user: currentUser } = useAuth();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("pending");
  const [approveRoles, setApproveRoles] = useState({});
  const [busyId, setBusyId] = useState(null);
  const [notice, setNotice] = useState(null);
  const [confirm, setConfirm] = useState(null);

  useEffect(() => {
    let cancelled = false;
    apiClient.get("/users")
      .then(({ data }) => {
        if (!cancelled) setUsers(data);
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

  const pending = useMemo(() => users.filter((person) => person.status === "pending"), [users]);
  const reviewed = useMemo(() => users.filter((person) => person.status !== "pending"), [users]);

  // Runs an admin action, replaces the updated user in the list and shows feedback
  const runAction = async (person, request, successText) => {
    setBusyId(person._id);
    try {
      const { data } = await request();
      setUsers((current) => current.map((item) => (item._id === data._id ? data : item)));
      setNotice({ tone: "success", text: successText(data) });
      window.dispatchEvent(new Event(USERS_CHANGED_EVENT));
    } catch (error) {
      setNotice({ tone: "error", code: getErrorCode(error) });
    } finally {
      setBusyId(null);
    }
  };

  const approve = (person) => {
    const role = approveRoles[person._id] || "field_officer";
    runAction(
      person,
      () => apiClient.patch(`/users/${person._id}/approve`, { role }),
      (updated) => t("users.approved", { name: updated.name, role: t(`roles.${updated.role}`) })
    );
  };

  const reject = (person) =>
    runAction(person, () => apiClient.patch(`/users/${person._id}/reject`), (updated) => t("users.rejected", { name: updated.name }));

  const changeRole = (person, role) =>
    runAction(person, () => apiClient.patch(`/users/${person._id}`, { role }), (updated) => t("users.updated", { name: updated.name }));

  const setStatus = (person, status) =>
    runAction(person, () => apiClient.patch(`/users/${person._id}`, { status }), (updated) => t("users.updated", { name: updated.name }));

  const askConfirm = (message, confirmLabel, action) => setConfirm({ message, confirmLabel, action });

  const tabs = [
    { key: "pending", label: t("users.tabs.pending"), count: pending.length },
    { key: "all", label: t("users.tabs.all"), count: reviewed.length }
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-gray-900 sm:text-3xl">{t("users.title")}</h1>
        <p className="mt-1 text-sm text-gray-600">{t("users.subtitle")}</p>
      </div>

      {notice && (
        <div className="mb-4">
          <Alert tone={notice.tone}>
            {notice.text ?? t(`errors.${notice.code}`, { defaultValue: t("errors.default") })}
          </Alert>
        </div>
      )}

      <div role="tablist" className="glass mb-5 inline-flex rounded-xl p-1 shadow-sm">
        {tabs.map(({ key, label, count }) => (
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
            {label}
            <span className={`rounded-full px-2 text-xs ${tab === key ? "bg-white/20" : "bg-gray-100"}`}>{count}</span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <LoaderCircle className="h-7 w-7 animate-spin text-tea-600" aria-label={t("common.loading")} />
        </div>
      ) : tab === "pending" ? (
        pending.length === 0 ? (
          <EmptyState text={t("users.emptyPending")} />
        ) : (
          <ul className="space-y-3">
            {pending.map((person) => (
              <li
                key={person._id}
                className="glass flex flex-col gap-4 rounded-2xl p-5 shadow-lg shadow-tea-900/5 ring-1 ring-gold-300/70 lg:flex-row lg:items-center"
              >
                <div className="flex-1">
                  <UserIdentity person={person} youLabel={t("users.you")} />
                  <p className="mt-2 text-xs text-gray-400">
                    {t("users.columns.registered")}: {formatDateTime(person.createdAt, i18n.language)} ·{" "}
                    {t("users.columns.language")}: {t(`language.${person.preferredLanguage}`)}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <label className="sr-only" htmlFor={`role-${person._id}`}>{t("users.approveAs")}</label>
                  <select
                    id={`role-${person._id}`}
                    value={approveRoles[person._id] || "field_officer"}
                    onChange={(event) => setApproveRoles((current) => ({ ...current, [person._id]: event.target.value }))}
                    disabled={busyId === person._id}
                    className={selectClasses}
                  >
                    {ROLES.map((role) => (
                      <option key={role} value={role}>{t(`roles.${role}`)}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => approve(person)}
                    disabled={busyId === person._id}
                    className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-leaf-500 to-tea-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-leaf-500/25 hover:from-leaf-600 hover:to-tea-700 disabled:opacity-60"
                  >
                    <Check className="h-4 w-4" aria-hidden="true" />
                    {t("users.approve")}
                  </button>
                  <button
                    type="button"
                    onClick={() => askConfirm(t("users.confirmReject", { name: person.name }), t("users.reject"), () => reject(person))}
                    disabled={busyId === person._id}
                    className="flex items-center gap-1.5 rounded-xl border border-clay-500/40 px-4 py-2 text-sm font-semibold text-clay-600 hover:bg-clay-50 disabled:opacity-60"
                  >
                    <X className="h-4 w-4" aria-hidden="true" />
                    {t("users.reject")}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )
      ) : reviewed.length === 0 ? (
        <EmptyState text={t("users.emptyAll")} />
      ) : (
        <div className="glass overflow-x-auto rounded-2xl shadow-xl shadow-tea-900/10">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-white/70 bg-white/50 text-xs font-semibold uppercase tracking-wide text-gray-500">
              <tr>
                <th scope="col" className="px-5 py-3">{t("users.columns.user")}</th>
                <th scope="col" className="px-5 py-3">{t("users.columns.role")}</th>
                <th scope="col" className="px-5 py-3">{t("users.columns.status")}</th>
                <th scope="col" className="px-5 py-3">{t("users.columns.lastLogin")}</th>
                <th scope="col" className="px-5 py-3 text-right">{t("users.columns.actions")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/70">
              {reviewed.map((person) => {
                const isSelf = person._id === currentUser._id;
                const editable = !isSelf && ["active", "disabled"].includes(person.status);
                return (
                  <tr key={person._id} className="align-middle">
                    <td className="px-5 py-4">
                      <UserIdentity person={person} isSelf={isSelf} youLabel={t("users.you")} />
                    </td>
                    <td className="px-5 py-4">
                      {editable ? (
                        <select
                          aria-label={t("users.columns.role")}
                          value={person.role}
                          onChange={(event) => changeRole(person, event.target.value)}
                          disabled={busyId === person._id}
                          className={selectClasses}
                        >
                          {ROLES.map((role) => (
                            <option key={role} value={role}>{t(`roles.${role}`)}</option>
                          ))}
                        </select>
                      ) : (
                        <RoleBadge role={person.role} />
                      )}
                    </td>
                    <td className="px-5 py-4"><StatusBadge status={person.status} /></td>
                    <td className="px-5 py-4 text-gray-500">
                      {person.lastLoginAt ? formatDateTime(person.lastLoginAt, i18n.language) : t("users.never")}
                    </td>
                    <td className="px-5 py-4 text-right">
                      {editable && person.status === "active" && (
                        <button
                          type="button"
                          onClick={() => askConfirm(t("users.confirmDisable", { name: person.name }), t("users.disable"), () => setStatus(person, "disabled"))}
                          disabled={busyId === person._id}
                          className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold text-clay-600 hover:bg-clay-50 disabled:opacity-60"
                        >
                          <UserX className="h-4 w-4" aria-hidden="true" />
                          {t("users.disable")}
                        </button>
                      )}
                      {editable && person.status === "disabled" && (
                        <button
                          type="button"
                          onClick={() => setStatus(person, "active")}
                          disabled={busyId === person._id}
                          className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold text-tea-700 hover:bg-tea-50 disabled:opacity-60"
                        >
                          <UserCheck className="h-4 w-4" aria-hidden="true" />
                          {t("users.enable")}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
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

const EmptyState = ({ text }) => (
  <div className="glass flex flex-col items-center rounded-2xl border-dashed px-6 py-14 text-center">
    <Inbox className="h-10 w-10 text-leaf-400" aria-hidden="true" />
    <p className="mt-3 max-w-sm text-sm text-gray-500">{text}</p>
  </div>
);

export default UsersPage;
