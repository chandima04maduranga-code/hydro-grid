import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router";
import { useTranslation } from "react-i18next";
import { Bell, Building2, LayoutDashboard, LogOut, ShieldCheck, Users, Warehouse } from "lucide-react";
import apiClient from "../../api/axiosConfig";
import { useAuth } from "../../context/AuthContext";
import Avatar from "../common/Avatar";
import BrandMark from "../common/BrandMark";
import LeafLogo from "../common/LeafLogo";
import ColomboClock from "../common/ColomboClock";
import LanguageSwitcher from "../common/LanguageSwitcher";
import { RoleBadge } from "../common/Badges";
import { COMPANIES_CHANGED_EVENT, USERS_CHANGED_EVENT } from "../../utils/events";
import greenhousePhoto from "../../assets/photos/greenhouse-strawberries.webp";

const PENDING_REFRESH_MS = 60000;

// What the approvals bell counts: staff requests for a company admin,
// company registrations for a platform admin
const PENDING_SOURCES = {
  admin: {
    path: "/users",
    event: USERS_CHANGED_EVENT,
    load: () => apiClient.get("/users", { params: { status: "pending" } }).then(({ data }) => data.length)
  },
  platform_admin: {
    path: "/platform/companies",
    event: COMPANIES_CHANGED_EVENT,
    load: () => apiClient.get("/platform/summary").then(({ data }) => data.companies.pending)
  }
};

const usePendingCount = (source) => {
  const location = useLocation();
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!source) return undefined;
    const load = () => source.load().then(setCount).catch(() => {});
    load();
    const timer = setInterval(load, PENDING_REFRESH_MS);
    window.addEventListener(source.event, load);
    return () => {
      clearInterval(timer);
      window.removeEventListener(source.event, load);
    };
  }, [source, location.pathname]);

  return source ? count : 0;
};

const AppLayout = () => {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const isPlatformAdmin = user.role === "platform_admin";
  const pendingSource = PENDING_SOURCES[user.role];
  const pendingCount = usePendingCount(pendingSource);

  const navItems = isPlatformAdmin
    ? [{ to: "/platform/companies", label: t("nav.companies"), icon: Building2 }]
    : [
      { to: "/dashboard", label: t("nav.dashboard"), icon: LayoutDashboard },
      { to: "/greenhouses", label: t("nav.greenhouses"), icon: Warehouse },
      ...(user.role === "admin" ? [{ to: "/users", label: t("nav.users"), icon: Users }] : [])
    ];

  return (
    <div className="relative min-h-screen">
      {/* Soft, blurred greenhouse photo behind the whole app */}
      <div className="fixed inset-0 -z-10 overflow-hidden" aria-hidden="true">
        <img src={greenhousePhoto} alt="" className="h-full w-full scale-110 object-cover blur-xl" />
        <div className="absolute inset-0 bg-gradient-to-b from-white/80 via-white/70 to-leaf-50/80" />
      </div>

      <header className="sticky top-0 z-30 px-3 pt-3 sm:px-6 sm:pt-5">
        <div className="glass mx-auto max-w-7xl overflow-hidden rounded-2xl shadow-lg shadow-tea-900/10">
          <div className="flex items-center gap-3 px-4 py-3 sm:gap-5 sm:px-6">
            <Link to="/" className="shrink-0">
              <span className="hidden sm:block"><BrandMark /></span>
              <span className="sm:hidden"><LeafLogo className="h-9 w-9" /></span>
            </Link>

            <div className="hidden flex-1 text-center xl:block">
              <p className="text-lg font-extrabold text-gray-900">{t("nav.controlPanel")}</p>
              <p className="text-xs text-gray-500">{t("dashboard.subtitle")}</p>
            </div>

            <div className="ml-auto flex items-center gap-2 sm:gap-3 xl:ml-0">
              <ColomboClock className="hidden lg:flex" />
              <LanguageSwitcher />
              {pendingSource && (
                <Link
                  to={pendingSource.path}
                  className="relative rounded-full p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-800"
                  aria-label={t("nav.pendingApprovals", { count: pendingCount })}
                  title={t("nav.pendingApprovals", { count: pendingCount })}
                >
                  <Bell className="h-5 w-5" aria-hidden="true" />
                  {pendingCount > 0 && (
                    <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-clay-500 px-1 text-[10px] font-bold text-white">
                      {pendingCount}
                    </span>
                  )}
                </Link>
              )}
              <div className="hidden items-center gap-2.5 md:flex">
                <Avatar name={user.name} size="sm" />
                <div className="hidden leading-tight 2xl:block">
                  <p className="max-w-40 truncate text-sm font-semibold text-gray-900">{user.name}</p>
                  <RoleBadge role={user.role} />
                </div>
              </div>
              <button
                type="button"
                onClick={logout}
                className="flex items-center gap-2 rounded-xl bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-md shadow-red-600/20 transition hover:bg-red-700 sm:px-4"
              >
                <LogOut className="h-4 w-4" aria-hidden="true" />
                <span className="hidden sm:inline">{t("nav.logout")}</span>
              </button>
            </div>
          </div>

          <nav className="flex items-center gap-1 border-t border-white/60 bg-white/40 px-3 py-1.5 sm:px-5" aria-label="Main">
            {navItems.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-semibold transition ${
                    isActive ? "bg-leaf-600 text-white shadow-sm" : "text-gray-600 hover:bg-white/80 hover:text-gray-900"
                  }`
                }
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
                {label}
              </NavLink>
            ))}

            {/* Which company (workspace) this session belongs to */}
            <span
              className={`ml-auto inline-flex min-w-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-bold ${
                isPlatformAdmin ? "bg-tea-800 text-white" : "bg-white/80 text-tea-800 ring-1 ring-leaf-500/30"
              }`}
              title={isPlatformAdmin ? t("nav.platform") : user.company?.name}
            >
              {isPlatformAdmin
                ? <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-leaf-400" aria-hidden="true" />
                : <Building2 className="h-3.5 w-3.5 shrink-0 text-leaf-600" aria-hidden="true" />}
              <span className="truncate">
                {isPlatformAdmin ? t("nav.platform") : user.company?.name}
              </span>
              {!isPlatformAdmin && user.company?.district && (
                <span className="hidden font-medium text-gray-500 sm:inline">· {t(`districts.${user.company.district}`)}</span>
              )}
            </span>
          </nav>
          <div className="dumbara-band opacity-70" />
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-3 py-6 sm:px-6 sm:py-8">
        <Outlet />
      </main>
    </div>
  );
};

export default AppLayout;
