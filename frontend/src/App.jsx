import { BrowserRouter, Route, Routes } from "react-router";
import AuthProvider from "./context/AuthProvider";
import { GuestOnly, HomeRedirect, RequireAuth } from "./components/auth/RouteGuards";
import AppLayout from "./components/layout/AppLayout";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import RegisterCompanyPage from "./pages/RegisterCompanyPage";
import DashboardPage from "./pages/DashboardPage";
import NodeDetailPage from "./pages/NodeDetailPage";
import GreenhousesPage from "./pages/GreenhousesPage";
import GreenhouseDetailPage from "./pages/GreenhouseDetailPage";
import UsersPage from "./pages/UsersPage";
import PlatformCompaniesPage from "./pages/PlatformCompaniesPage";
import ProfilePage from "./pages/ProfilePage";
import CropsPage from "./pages/CropsPage";
import CropDetailPage from "./pages/CropDetailPage";
import CropFormPage from "./pages/CropFormPage";
import BillingPage from "./pages/BillingPage";
import BillingReturnPage from "./pages/BillingReturnPage";
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
            <Route path="/profile" element={<ProfilePage />} />
            <Route element={<RequireAuth roles={COMPANY_ROLES} />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/nodes/:nodeId" element={<NodeDetailPage />} />
              <Route path="/greenhouses" element={<GreenhousesPage />} />
              <Route path="/greenhouses/:id" element={<GreenhouseDetailPage />} />
              <Route path="/crops" element={<CropsPage />} />
              <Route path="/crops/:id" element={<CropDetailPage />} />
              <Route element={<RequireAuth roles={["admin", "farm_manager"]} />}>
                <Route path="/crops/new" element={<CropFormPage />} />
                <Route path="/crops/:id/edit" element={<CropFormPage />} />
              </Route>
              <Route element={<RequireAuth roles={["admin"]} />}>
                <Route path="/users" element={<UsersPage />} />
                <Route path="/billing" element={<BillingPage />} />
                <Route path="/billing/return" element={<BillingReturnPage />} />
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
