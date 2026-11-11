import { api } from "@/lib/api";

const TERMINAL_PATH = "/attendance-terminal";

export function getTerminalStatus(signal) {
  return api(`${TERMINAL_PATH}/status`, { signal });
}

export function connectTerminal(code, method, signal) {
  const body =
    method === "connect" ? { accessToken: code } : { pairingToken: code };
  return api(`${TERMINAL_PATH}/${method}`, { method: "POST", body, signal });
}

export function createScanChallenge(action, signal) {
  return api(`${TERMINAL_PATH}/challenges`, {
    method: "POST",
    body: { purpose: action },
    signal,
  });
}

export function submitAttendance(challengeId, action, samples, signal) {
  return api(`${TERMINAL_PATH}/attendance`, {
    method: "POST",
    body: { challengeId, action, samples },
    signal,
  });
}

export function disconnectTerminal() {
  return api(`${TERMINAL_PATH}/disconnect`, { method: "POST", body: {} });
}
