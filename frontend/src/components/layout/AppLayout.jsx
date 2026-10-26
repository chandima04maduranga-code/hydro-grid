import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router";
import { useTranslation } from "react-i18next";
import { LayoutDashboard, LogOut, Users } from "lucide-react";
import apiClient from "../../api/axiosConfig";
import { useAuth } from "../../context/AuthContext";
import Avatar from "../common/Avatar";
import BrandMark from "../common/BrandMark";
import ColomboClock from "../common/ColomboClock";
import LanguageSwitcher from "../common/LanguageSwitcher";
import { RoleBadge } from "../common/Badges";
import { USERS_CHANGED_EVENT } from "../../utils/events";

const PENDING_REFRESH_MS = 60000;

// Number of accounts waiting for approval, shown as a badge for admins
const usePendingCount = (enabled) => {
  const location = useLocation();
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!enabled) return undefined;
    const load = () =>
      apiClient.get("/users", { params: { status: "pending" } })
        .then(({ data }) => setCount(data.length))
        .catch(() => {});
    load();
    const timer = setInterval(load, PENDING_REFRESH_MS);
    window.addEventListener(USERS_CHANGED_EVENT, load);
    return () => {
      clearInterval(timer);
      window.removeEventListener(USERS_CHANGED_EVENT, load);
    };
  }, [enabled, location.pathname]);

  return enabled ? count : 0;
};

const AppLayout = () => {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const isAdmin = user.role === "admin";
  const pendingCount = usePendingCount(isAdmin);

  const navItems = [
    { to: "/dashboard", label: t("nav.dashboard"), icon: LayoutDashboard },
    ...(isAdmin ? [{ to: "/users", label: t("nav.users"), icon: Users, badge: pendingCount }] : [])
  ];

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 bg-white/95 shadow-sm backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 sm:gap-6 sm:px-6">
          <div className="hidden sm:block">
            <BrandMark showTagline={false} />
          </div>

          <nav className="flex items-center gap-1" aria-label="Main">
            {navItems.map(({ to, label, icon: Icon, badge }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `relative flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition ${
                    isActive ? "bg-tea-50 text-tea-800" : "text-gray-500 hover:bg-gray-50 hover:text-gray-800"
                  }`
                }
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
                <span className="hidden md:inline">{label}</span>
                {badge > 0 && (
                  <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-gold-500 px-1.5 text-[11px] font-bold text-white">
                    {badge}
                  </span>
                )}
              </NavLink>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-2 sm:gap-4">
            <ColomboClock className="hidden lg:flex" />
            <LanguageSwitcher />
            <div className="flex items-center gap-2.5 border-l border-gray-100 pl-2 sm:pl-4">
              <Avatar name={user.name} size="sm" />
              <div className="hidden leading-tight xl:block">
                <p className="max-w-40 truncate text-sm font-semibold text-gray-900">{user.name}</p>
                <RoleBadge role={user.role} />
              </div>
              <button
                type="button"
                onClick={logout}
                className="flex items-center gap-1.5 rounded-xl px-2.5 py-2 text-sm font-semibold text-clay-600 transition hover:bg-clay-50"
              >
                <LogOut className="h-4 w-4" aria-hidden="true" />
                <span className="hidden sm:inline">{t("nav.logout")}</span>
              </button>
            </div>
          </div>
        </div>
        <div className="dumbara-band opacity-70" />
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        <Outlet />
      </main>
    </div>
  );
};

export default AppLayout;
