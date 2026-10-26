import { BrowserRouter, Navigate, Route, Routes } from "react-router";
import AuthProvider from "./context/AuthProvider";
import { useAuth } from "./context/AuthContext";
import { GuestOnly, RequireAuth } from "./components/auth/RouteGuards";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import NotFoundPage from "./pages/NotFoundPage";
import Dashboard from "./components/dashboard/Dashboard";

const DashboardPage = () => {
  const { logout } = useAuth();
  return <Dashboard handleLogout={logout} />;
};

const App = () => (
  <BrowserRouter>
    <AuthProvider>
      <Routes>
        <Route element={<GuestOnly />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Route>

        <Route element={<RequireAuth />}>
          <Route path="/dashboard" element={<DashboardPage />} />
        </Route>

        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </AuthProvider>
  </BrowserRouter>
);

export default App;
