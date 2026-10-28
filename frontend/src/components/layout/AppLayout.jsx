import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router";
import { useTranslation } from "react-i18next";
import { Bell, Building2, LayoutDashboard, Leaf, LogOut, Menu, ShieldCheck, UserRound, Users, Warehouse, X } from "lucide-react";
import apiClient from "../../api/axiosConfig";
import { useAuth } from "../../context/AuthContext";
import Avatar from "../common/Avatar";
import ColomboClock from "../common/ColomboClock";
import LanguageSwitcher from "../common/LanguageSwitcher";
import LeafLogo from "../common/LeafLogo";
import SidebarCrops from "./SidebarCrops";
import { COMPANIES_CHANGED_EVENT, USERS_CHANGED_EVENT } from "../../utils/events";

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

const NavItems = ({ items, pendingPath, pendingCount, onNavigate }) => (
  <nav className="space-y-0.5" aria-label="Main">
    {items.map(({ to, label, icon: Icon }) => (
      <NavLink
        key={to}
        to={to}
        onClick={onNavigate}
        className={({ isActive }) =>
          `flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${
            isActive ? "bg-leaf-50 font-semibold text-leaf-800" : "font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900"
          }`
        }
      >
        <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
        <span className="flex-1">{label}</span>
        {to === pendingPath && pendingCount > 0 && (
          <span className="rounded bg-amber-100 px-1.5 text-xs font-semibold text-amber-800">{pendingCount}</span>
        )}
      </NavLink>
    ))}
  </nav>
);

const AppLayout = () => {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const isPlatformAdmin = user.role === "platform_admin";
  const pendingSource = PENDING_SOURCES[user.role];
  const pendingCount = usePendingCount(pendingSource);

  const navItems = [
    ...(isPlatformAdmin
      ? [{ to: "/platform/companies", label: t("nav.companies"), icon: Building2 }]
      : [
        { to: "/dashboard", label: t("nav.dashboard"), icon: LayoutDashboard },
        { to: "/greenhouses", label: t("nav.greenhouses"), icon: Warehouse },
        { to: "/crops", label: t("nav.crops"), icon: Leaf },
        ...(user.role === "admin" ? [{ to: "/users", label: t("nav.users"), icon: Users }] : [])
      ]),
    { to: "/profile", label: t("nav.profile"), icon: UserRound }
  ];

  const workspaceName = isPlatformAdmin ? t("nav.platform") : user.company?.name;
  const workspaceDetail = isPlatformAdmin ? t("roles.platform_admin") : user.company && t(`districts.${user.company.district}`);

  return (
    <div className="min-h-screen bg-canvas lg:flex">
      <aside className="hidden w-60 shrink-0 flex-col border-r border-gray-200 bg-white lg:sticky lg:top-0 lg:flex lg:h-screen">
        <Link to="/" className="flex h-14 items-center gap-2 border-b border-gray-200 px-4">
          <LeafLogo className="h-7 w-7" />
          <span className="text-base font-semibold text-gray-900">Hydro_Grid</span>
        </Link>

        <div className="border-b border-gray-200 px-4 py-3">
          <p className="text-[11px] font-medium uppercase tracking-wide text-gray-400">
            {isPlatformAdmin ? t("nav.platform") : t("login.company")}
          </p>
          <p className="mt-0.5 flex items-center gap-1.5 text-sm font-semibold text-gray-900" title={workspaceName}>
            {isPlatformAdmin
              ? <ShieldCheck className="h-4 w-4 shrink-0 text-leaf-700" aria-hidden="true" />
              : <Building2 className="h-4 w-4 shrink-0 text-gray-400" aria-hidden="true" />}
            <span className="truncate">{workspaceName}</span>
          </p>
          {!isPlatformAdmin && <p className="mt-0.5 pl-5.5 text-xs text-gray-500">{workspaceDetail}</p>}
        </div>

        <div className="flex-1 overflow-y-auto px-2 py-3">
          <NavItems items={navItems} pendingPath={pendingSource?.path} pendingCount={pendingCount} />
          {!isPlatformAdmin && <SidebarCrops />}
        </div>

        <div className="flex items-center gap-1 border-t border-gray-200 px-2 py-2">
          <Link to="/profile" className="flex min-w-0 flex-1 items-center gap-2.5 rounded-md px-1 py-1 hover:bg-gray-50" title={t("nav.profile")}>
            <Avatar name={user.name} size="sm" />
            <div className="min-w-0 flex-1 leading-tight">
              <p className="truncate text-sm font-medium text-gray-900">{user.name}</p>
              <p className="truncate text-xs text-gray-500">{t(`roles.${user.role}`)}</p>
            </div>
          </Link>
          <button
            type="button"
            onClick={logout}
            className="rounded-md p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-red-700"
            aria-label={t("nav.logout")}
            title={t("nav.logout")}
          >
            <LogOut className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 border-b border-gray-200 bg-white">
          <div className="flex h-14 items-center gap-3 px-4 sm:px-6">
            <button
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              className="-ml-1 rounded-md p-2 text-gray-600 hover:bg-gray-100 lg:hidden"
              aria-label="Menu"
              aria-expanded={menuOpen}
            >
              {menuOpen ? <X className="h-5 w-5" aria-hidden="true" /> : <Menu className="h-5 w-5" aria-hidden="true" />}
            </button>
            <Link to="/" className="flex items-center gap-2 lg:hidden">
              <LeafLogo className="h-6 w-6" />
              <span className="hidden text-sm font-semibold text-gray-900 sm:inline">Hydro_Grid</span>
            </Link>
            <p className="hidden truncate text-sm text-gray-500 lg:block">{t("app.tagline")}</p>

            <div className="ml-auto flex items-center gap-2 sm:gap-3">
              <ColomboClock className="hidden md:flex" />
              <LanguageSwitcher />
              {pendingSource && (
                <Link
                  to={pendingSource.path}
                  className="relative rounded-md p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-800"
                  aria-label={t("nav.pendingApprovals", { count: pendingCount })}
                  title={t("nav.pendingApprovals", { count: pendingCount })}
                >
                  <Bell className="h-5 w-5" aria-hidden="true" />
                  {pendingCount > 0 && (
                    <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-semibold text-white">
                      {pendingCount}
                    </span>
                  )}
                </Link>
              )}
            </div>
          </div>

          {menuOpen && (
            <div className="border-t border-gray-200 px-3 pb-3 pt-2 lg:hidden">
              <p className="px-3 pb-2 text-xs text-gray-500">
                <span className="font-semibold text-gray-900">{workspaceName}</span>
                {workspaceDetail && ` · ${workspaceDetail}`}
              </p>
              <NavItems items={navItems} pendingPath={pendingSource?.path} pendingCount={pendingCount} onNavigate={() => setMenuOpen(false)} />
              {!isPlatformAdmin && (
                <div className="max-h-64 overflow-y-auto">
                  <SidebarCrops onNavigate={() => setMenuOpen(false)} />
                </div>
              )}
              <div className="mt-2 flex items-center gap-2.5 border-t border-gray-200 px-3 pt-3">
                <Avatar name={user.name} size="sm" />
                <div className="min-w-0 flex-1 leading-tight">
                  <p className="truncate text-sm font-medium text-gray-900">{user.name}</p>
                  <p className="truncate text-xs text-gray-500">{t(`roles.${user.role}`)}</p>
                </div>
                <button type="button" onClick={logout} className="btn btn-secondary">
                  <LogOut className="h-4 w-4" aria-hidden="true" />
                  {t("nav.logout")}
                </button>
              </div>
            </div>
          )}
        </header>

        <main className="mx-auto w-full max-w-[1400px] flex-1 px-4 py-6 sm:px-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
