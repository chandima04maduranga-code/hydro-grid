import { useEffect, useState } from "react";
import apiClient from "../api/axiosConfig";

const REFRESH_MS = 5000;

// The company's sensor nodes with their latest readings and advice, kept fresh
export const useTelemetryNodes = () => {
  const [nodes, setNodes] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const load = () =>
      apiClient.get("/telemetry/nodes")
        .then(({ data }) => {
          if (cancelled) return;
          setNodes(data);
          setLastUpdated(new Date());
        })
        .catch(() => {
          // 401 is handled globally; on network blips keep the last good data
        })
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

  return { nodes, setNodes, loaded, lastUpdated };
};

// Averaged history for one node, refreshed every minute
export const useNodeHistory = (nodeId, hours) => {
  const [history, setHistory] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const load = () =>
      apiClient.get(`/telemetry/nodes/${encodeURIComponent(nodeId)}/history`, { params: { hours } })
        .then(({ data }) => {
          if (!cancelled) setHistory(data);
        })
        .catch(() => {});

    load();
    const timer = setInterval(load, 60000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [nodeId, hours]);

  return history;
};
