import { BrowserRouter, Route, Routes } from "react-router";
import AuthProvider from "./context/AuthProvider";
import { GuestOnly, HomeRedirect, RequireAuth } from "./components/auth/RouteGuards";
import AppLayout from "./components/layout/AppLayout";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import RegisterCompanyPage from "./pages/RegisterCompanyPage";
import DashboardPage from "./pages/DashboardPage";
import UsersPage from "./pages/UsersPage";
import PlatformCompaniesPage from "./pages/PlatformCompaniesPage";
import NotFoundPage from "./pages/NotFoundPage";
import { COMPANY_ROLES, PLATFORM_ROLES } from "./utils/roles";

const App = () => (
  <BrowserRouter>
    <AuthProvider>
      <Routes>
        <Route element={<GuestOnly />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/register-company" element={<RegisterCompanyPage />} />
        </Route>

        <Route element={<RequireAuth />}>
          <Route element={<AppLayout />}>
            <Route element={<RequireAuth roles={COMPANY_ROLES} />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route element={<RequireAuth roles={["admin"]} />}>
                <Route path="/users" element={<UsersPage />} />
              </Route>
            </Route>
            <Route element={<RequireAuth roles={PLATFORM_ROLES} />}>
              <Route path="/platform/companies" element={<PlatformCompaniesPage />} />
            </Route>
          </Route>
        </Route>

        <Route path="/" element={<HomeRedirect />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </AuthProvider>
  </BrowserRouter>
);

export default App;
