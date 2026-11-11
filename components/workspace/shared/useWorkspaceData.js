"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";

export function useResource(path, requestKey) {
  const [state, setState] = useState({
    path: null,
    data: null,
    error: "",
    errorStatus: null,
    requestKey: undefined,
  });
  const [epoch, setEpoch] = useState(0);
  const refresh = useCallback(() => setEpoch((value) => value + 1), []);
  useEffect(() => {
    const controller = new AbortController();
    if (path)
      api(path, { signal: controller.signal })
        .then((data) => {
          if (!controller.signal.aborted)
            setState({ path, requestKey, data, error: "", errorStatus: null });
        })
        .catch((error) => {
          if (!controller.signal.aborted)
            setState({
              path,
              requestKey,
              data: null,
              error: error.message,
              errorStatus: error.status,
            });
        });
    return () => controller.abort();
  }, [path, epoch, requestKey]);
  const current = state.path === path && state.requestKey === requestKey;
  return {
    data: current ? state.data : null,
    error: current ? state.error : "",
    errorStatus: current ? state.errorStatus : null,
    loading: !current,
    refresh,
  };
}

export function useAction(refresh) {
  const [error, setError] = useState(""),
    [success, setSuccess] = useState(""),
    [busy, setBusy] = useState(false);
  async function act(path, method = "POST", body) {
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      await api(path, { method, ...(body === undefined ? {} : { body }) });
      refresh?.();
      window.dispatchEvent(new Event("attendance-updated"));
      setSuccess("Saved successfully.");
    } catch (error) {
      setError(error.message);
    } finally {
      setBusy(false);
    }
  }
  return { act, error, success, busy };
}
