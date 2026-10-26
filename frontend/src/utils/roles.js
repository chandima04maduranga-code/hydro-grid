// Mirrors User.COMPANY_ROLES in the backend
export const COMPANY_ROLES = ["admin", "farm_manager", "field_officer"];
export const PLATFORM_ROLES = ["platform_admin"];

// Where each kind of user lands after login
export const homePathFor = (user) =>
  user?.role === "platform_admin" ? "/platform/companies" : "/dashboard";
