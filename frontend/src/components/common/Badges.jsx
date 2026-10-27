import { useTranslation } from "react-i18next";

const STATUS_STYLES = {
  active: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  pending: "bg-amber-50 text-amber-800 ring-amber-200",
  rejected: "bg-red-50 text-red-700 ring-red-200",
  disabled: "bg-gray-100 text-gray-500 ring-gray-200"
};

const ROLE_STYLES = {
  platform_admin: "bg-gray-900 text-white ring-gray-900",
  admin: "bg-leaf-50 text-leaf-800 ring-leaf-200",
  farm_manager: "bg-sky-50 text-sky-800 ring-sky-200",
  field_officer: "bg-gray-50 text-gray-700 ring-gray-200"
};

const badgeClasses = "inline-flex items-center whitespace-nowrap rounded px-2 py-0.5 text-xs font-medium ring-1 ring-inset";

export const StatusBadge = ({ status }) => {
  const { t } = useTranslation();
  return <span className={`${badgeClasses} ${STATUS_STYLES[status]}`}>{t(`statuses.${status}`)}</span>;
};

export const RoleBadge = ({ role }) => {
  const { t } = useTranslation();
  return <span className={`${badgeClasses} ${ROLE_STYLES[role]}`}>{t(`roles.${role}`)}</span>;
};
