"use client";

import { useCallback, useRef, useState } from "react";
import { biometricError, checkCameraSupport } from "@/lib/biometrics";

export default function useTerminalCamera(isMounted, activeRequest, setError) {
  const [cameraReady, setCameraReady] = useState(false);
  const [opening, setOpening] = useState(false);
  const videoRef = useRef(null);
  const cameraStreamRef = useRef(null);
  const cameraVersion = useRef(0);

  const stopCamera = useCallback(
    (update = true) => {
      cameraVersion.current += 1;
      activeRequest.current?.abort();
      cameraStreamRef.current?.getTracks().forEach((track) => track.stop());
      cameraStreamRef.current = null;
      if (videoRef.current) videoRef.current.srcObject = null;
      if (update && isMounted.current) {
        setCameraReady(false);
        setOpening(false);
      }
    },
    [activeRequest, isMounted],
  );

  async function openCamera() {
    const attempt = ++cameraVersion.current;
    setOpening(true);
    try {
      checkCameraSupport();
      const camera = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
        audio: false,
      });
      if (!isMounted.current || attempt !== cameraVersion.current) {
        camera.getTracks().forEach((track) => track.stop());
        return;
      }
      cameraStreamRef.current = camera;
      videoRef.current.srcObject = camera;
      await videoRef.current.play();
      if (isMounted.current && attempt === cameraVersion.current)
        setCameraReady(true);
    } catch (failure) {
      if (isMounted.current && attempt === cameraVersion.current) {
        stopCamera();
        setError(biometricError(failure));
      }
    } finally {
      if (isMounted.current && attempt === cameraVersion.current)
        setOpening(false);
    }
  }

  return {
    videoRef,
    cameraVersion,
    cameraReady,
    opening,
    openCamera,
    stopCamera,
  };
}
