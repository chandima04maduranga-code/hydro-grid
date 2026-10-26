import { Navigate, Outlet, useLocation } from "react-router";
import { useAuth } from "../../context/AuthContext";
import { homePathFor } from "../../utils/roles";
import FullPageLoader from "../common/FullPageLoader";

// Only logged-in users (optionally with one of the given roles) may continue
export const RequireAuth = ({ roles }) => {
  const { status, user } = useAuth();
  const location = useLocation();

  if (status === "checking") return <FullPageLoader />;
  if (status !== "authenticated") {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  if (roles && !roles.includes(user.role)) {
    return <Navigate to={homePathFor(user)} replace />;
  }
  return <Outlet />;
};

// Login and registration pages are only for logged-out visitors
export const GuestOnly = () => {
  const { status, user } = useAuth();

  if (status === "checking") return <FullPageLoader />;
  if (status === "authenticated") return <Navigate to={homePathFor(user)} replace />;
  return <Outlet />;
};

// "/" sends each user to their own home page
export const HomeRedirect = () => {
  const { status, user } = useAuth();

  if (status === "checking") return <FullPageLoader />;
  return <Navigate to={status === "authenticated" ? homePathFor(user) : "/login"} replace />;
};
