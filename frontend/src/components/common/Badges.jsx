import { useTranslation } from "react-i18next";

const STATUS_STYLES = {
  active: "bg-tea-50 text-tea-700 ring-tea-200",
  pending: "bg-gold-100 text-gold-600 ring-gold-300",
  rejected: "bg-clay-50 text-clay-600 ring-clay-500/30",
  disabled: "bg-gray-100 text-gray-500 ring-gray-200"
};

const ROLE_STYLES = {
  platform_admin: "bg-gold-500 text-white ring-gold-500",
  admin: "bg-tea-800 text-white ring-tea-800",
  farm_manager: "bg-gold-100 text-gold-600 ring-gold-300",
  field_officer: "bg-white text-tea-700 ring-tea-200"
};

const badgeClasses = "inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset";

export const StatusBadge = ({ status }) => {
  const { t } = useTranslation();
  return <span className={`${badgeClasses} ${STATUS_STYLES[status]}`}>{t(`statuses.${status}`)}</span>;
};

export const RoleBadge = ({ role }) => {
  const { t } = useTranslation();
  return <span className={`${badgeClasses} ${ROLE_STYLES[role]}`}>{t(`roles.${role}`)}</span>;
};
