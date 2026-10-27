import { useEffect, useState } from "react";
import apiClient from "../api/axiosConfig";

const REFRESH_MS = 30000;

// Crops the user may see (staff only see crops in their greenhouses)
export const usePlants = () => {
  const [plants, setPlants] = useState([]);

  useEffect(() => {
    let cancelled = false;
    const load = () =>
      apiClient.get("/plants")
        .then(({ data }) => {
          if (!cancelled) setPlants(data);
        })
        .catch(() => {});
    load();
    const timer = setInterval(load, REFRESH_MS);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, []);

  return plants;
};
