"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";

export const BIOMETRIC_ENROLLMENT_EVENT = "biometric-enrollment-updated";
export const ATTENDANCE_UPDATED_EVENT = "attendance-updated";

export function notifyBiometricEnrollmentChanged() {
  window.dispatchEvent(new Event(BIOMETRIC_ENROLLMENT_EVENT));
}

export function notifyAttendanceChanged() {
  window.dispatchEvent(new Event(ATTENDANCE_UPDATED_EVENT));
}

export function biometricError(error) {
  const cause = error?.error || error;
  const code = `${cause?.name || ""} ${error?.state || ""}`
    .toLowerCase()
    .replaceAll("_", "")
    .replaceAll("-", "");
  const message = String(cause?.message || error?.message || "");
  if (
    /notallowed|permission|cameraaccess/.test(code) ||
    /permission denied|camera permission/i.test(message)
  ) {
    return "Camera permission was denied. Allow camera access in your browser, then retry. You can use web attendance or request an HR correction instead.";
  }
  if (/notfound|devicesnotfound/.test(code))
    return "No camera was found. Connect a camera or use the non-biometric attendance option.";
  if (/notreadable|trackstart/.test(code))
    return "The camera is busy or unavailable. Close other camera applications, then retry.";
  if (/abort|timeout|timedout/.test(code))
    return "The capture expired or timed out. Start a new verification attempt. If submission was interrupted, check attendance history before trying again.";
  if (/unsupported|not supported/i.test(message))
    return "This browser cannot run the secure face capture. Use an updated supported browser or the non-biometric attendance option.";
  return (
    message ||
    "Face capture could not finish. Start a new attempt or use the non-biometric attendance option."
  );
}

export function checkCameraSupport() {
  if (typeof window === "undefined" || !window.isSecureContext) {
    throw new Error(
      "Camera verification requires HTTPS. Localhost is permitted for local development.",
    );
  }
  if (!navigator.mediaDevices?.getUserMedia)
    throw new Error("Secure camera capture is not supported by this browser.");
}

// Request camera permission only following an explicit user gesture. The local
// capture UI opens its stream afterward; this probe stores no images.
export async function requestCameraPermission() {
  checkCameraSupport();
  let stream;
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "user" },
      audio: false,
    });
  } catch (error) {
    throw new Error(biometricError(error));
  } finally {
    stream?.getTracks().forEach((track) => track.stop());
  }
}

export async function requestAttendanceLocation() {
  if (!navigator.geolocation)
    throw new Error(
      "Location is unavailable. Face attendance requires an office-location check; use web attendance or contact HR.",
    );
  const position = await new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      maximumAge: 0,
      timeout: 15000,
    });
  }).catch((error) => {
    if (error.code === 1)
      throw new Error(
        "Location permission was denied. Face attendance requires your office-location check. The non-biometric option remains available.",
      );
    throw new Error(
      "A sufficiently accurate location could not be obtained. Move to a location with a better signal and retry, or use the non-biometric option.",
    );
  });
  const location = {
    latitude: position.coords.latitude,
    longitude: position.coords.longitude,
    accuracy: position.coords.accuracy,
  };
  if (
    !Number.isFinite(location.latitude) ||
    !Number.isFinite(location.longitude) ||
    !Number.isFinite(location.accuracy) ||
    location.accuracy < 0 ||
    location.accuracy > 100
  ) {
    throw new Error(
      "Location accuracy must be 100 meters or better. Retry with a better GPS signal or use the non-biometric attendance option.",
    );
  }
  return location;
}

export function useBiometricStatus(enabled = true) {
  const [epoch, setEpoch] = useState(0);
  const [state, setState] = useState({ epoch: -1, status: null, error: "" });
  const refresh = useCallback(() => setEpoch((value) => value + 1), []);
  useEffect(() => {
    if (!enabled) return undefined;
    const controller = new AbortController();
    api("/biometrics/status", { signal: controller.signal })
      .then((status) => setState({ epoch, status, error: "" }))
      .catch((error) => {
        if (!controller.signal.aborted)
          setState({ epoch, status: null, error: error.message });
      });
    return () => controller.abort();
  }, [enabled, epoch]);
  useEffect(() => {
    if (!enabled) return undefined;
    window.addEventListener(BIOMETRIC_ENROLLMENT_EVENT, refresh);
    return () =>
      window.removeEventListener(BIOMETRIC_ENROLLMENT_EVENT, refresh);
  }, [enabled, refresh]);
  return {
    status: state.epoch === epoch ? state.status : null,
    error: state.epoch === epoch ? state.error : "",
    loading: enabled && state.epoch !== epoch,
    refresh,
  };
}
