import { useEffect, useState } from "react";
import apiClient from "../api/axiosConfig";

// Active companies for the login and access-request pickers
export const useCompanies = () => {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    apiClient.get("/companies")
      .then(({ data }) => {
        if (!cancelled) setCompanies(data);
      })
      .catch(() => {
        // The picker stays empty; submitting then shows the server's error
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { companies, loading };
};

// Remembers the last company chosen on this device
const LAST_COMPANY_KEY = "hg_last_company";

export const readLastCompany = () => {
  try {
    return localStorage.getItem(LAST_COMPANY_KEY) || "";
  } catch {
    return "";
  }
};

export const saveLastCompany = (companyId) => {
  try {
    localStorage.setItem(LAST_COMPANY_KEY, companyId);
  } catch {
    // Storage unavailable: the picker simply starts empty next time
  }
};
