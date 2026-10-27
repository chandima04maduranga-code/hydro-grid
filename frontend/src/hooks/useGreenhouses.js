import { useCallback, useEffect, useState } from "react";
import apiClient from "../api/axiosConfig";

const REFRESH_MS = 15000;

// Greenhouses the user may see, with sensor and health summaries
export const useGreenhouses = () => {
  const [greenhouses, setGreenhouses] = useState([]);
  const [loaded, setLoaded] = useState(false);

  const reload = useCallback(
    () =>
      apiClient.get("/greenhouses")
        .then(({ data }) => setGreenhouses(data))
        .catch(() => {})
        .finally(() => setLoaded(true)),
    []
  );

  useEffect(() => {
    let cancelled = false;
    const load = () =>
      apiClient.get("/greenhouses")
        .then(({ data }) => {
          if (!cancelled) setGreenhouses(data);
        })
        .catch(() => {})
        .finally(() => {
          if (!cancelled) setLoaded(true);
        });
    load();
    const timer = setInterval(load, REFRESH_MS);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, []);

  return { greenhouses, loaded, reload };
};
