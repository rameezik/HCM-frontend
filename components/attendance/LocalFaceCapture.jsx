"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/WorkspaceUI";
import { biometricError, checkCameraSupport } from "@/lib/biometrics";

// Capture is a UI convenience, not proof of liveness. Only the backend can
// extract descriptors and decide identity; no descriptor or success flag is sent.
export default function LocalFaceCapture({
  challenge,
  onComplete,
  onError,
  onCancel,
}) {
  const video = useRef(null),
    stream = useRef(null),
    stopped = useRef(false);
  const callbacks = useRef({ onComplete, onError, onCancel });
  const [ready, setReady] = useState(false),
    [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    callbacks.current = { onComplete, onError, onCancel };
  }, [onComplete, onError, onCancel]);

  function stopCamera() {
    setReady(false);
    stream.current?.getTracks().forEach((track) => track.stop());
    stream.current = null;
    if (video.current) video.current.srcObject = null;
  }

  useEffect(() => {
    let cancelled = false;
    stopped.current = false;
    async function start() {
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
        if (cancelled) {
          camera.getTracks().forEach((track) => track.stop());
          return;
        }
        stream.current = camera;
        video.current.srcObject = camera;
        await video.current.play();
        if (!cancelled) setReady(true);
      } catch (error) {
        if (!cancelled) {
          stopCamera();
          callbacks.current.onError(new Error(biometricError(error)));
        }
      }
    }
    start();
    const remaining = Date.parse(challenge.expiresAt) - Date.now();
    const timeout = setTimeout(
      () => {
        if (cancelled || stopped.current) return;
        stopped.current = true;
        stopCamera();
        callbacks.current.onError(
          new Error("The camera challenge expired. Start a new attempt."),
        );
      },
      Number.isFinite(remaining) ? Math.max(0, remaining) : 0,
    );
    return () => {
      cancelled = true;
      stopped.current = true;
      clearTimeout(timeout);
      stopCamera();
    };
  }, [challenge.expiresAt]);

  async function capture() {
    if (!ready || busy || stopped.current) return;
    setBusy(true);
    const samples = [];
    const canvas = document.createElement("canvas");
    try {
      const requested = challenge.capture?.samples || 3;
      const sampleCount = Math.min(3, Math.max(1, requested));
      const maxWidth = Math.min(640, challenge.capture?.maxWidth || 640);
      const maxBytes = Math.min(
        250000,
        challenge.capture?.maxImageBytes || 250000,
      );
      for (let index = 0; index < sampleCount; index++) {
        if (stopped.current || Date.now() >= Date.parse(challenge.expiresAt))
          throw new Error("The camera challenge expired. Start a new attempt.");
        const feed = video.current;
        if (
          !feed ||
          feed.readyState < 2 ||
          feed.videoWidth < 160 ||
          feed.videoHeight < 160
        )
          throw new Error(
            "The camera frame is not ready or is too small. Retry with a supported camera.",
          );
        const scale = Math.min(
          1,
          maxWidth / Math.max(feed.videoWidth, feed.videoHeight),
        );
        canvas.width = Math.round(feed.videoWidth * scale);
        canvas.height = Math.round(feed.videoHeight * scale);
        const context = canvas.getContext("2d", { alpha: false });
        if (!context)
          throw new Error("This browser cannot capture camera frames.");
        context.drawImage(feed, 0, 0, canvas.width, canvas.height);
        const encoded = canvas.toDataURL("image/jpeg", 0.86).split(",")[1];
        if (!encoded || Math.ceil((encoded.length * 3) / 4) > maxBytes)
          throw new Error(
            "The camera frame exceeds the allowed size. Retry with a lower-resolution camera.",
          );
        samples.push(encoded);
        setProgress(index + 1);
        if (index + 1 < sampleCount)
          await new Promise((resolve) => setTimeout(resolve, 350));
      }
      stopped.current = true;
      stopCamera();
      await callbacks.current.onComplete(samples);
    } catch (error) {
      stopped.current = true;
      stopCamera();
      callbacks.current.onError(new Error(biometricError(error)));
    } finally {
      samples.fill("");
      canvas.width = 0;
      canvas.height = 0;
    }
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-[#111116] p-4 sm:p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-sm font-medium text-zinc-200">
          Live webcam face scan
        </h3>
        <Button
          secondary
          disabled={busy}
          onClick={() => {
            stopped.current = true;
            stopCamera();
            onCancel();
          }}
        >
          Cancel capture
        </Button>
      </div>
      <p className="mb-4 text-sm leading-6 text-zinc-400">
        Keep exactly one face visible, face the camera and use even lighting.
        The server detects, aligns and compares your face locally. Frames are
        sent only to this application and are not retained as photographs.
      </p>
      <div className="mb-4 rounded-xl border border-amber-300/20 bg-amber-300/5 p-3 text-xs leading-6 text-amber-100">
        This is identity matching without reliable liveness detection. Camera
        capture and repeated frames cannot establish that a real person is
        present; photographs, replayed video or a modified client may bypass
        this protection. Use the authorized non-biometric option when needed.
      </div>
      <video
        ref={video}
        autoPlay
        muted
        playsInline
        aria-label="Camera preview"
        className="mx-auto aspect-[4/3] w-full max-w-xl rounded-xl bg-black object-contain"
      />
      <div className="mt-4 flex flex-wrap items-center gap-4">
        <Button disabled={!ready || busy} onClick={capture}>
          {busy ? "Verifying face…" : "Scan and verify face"}
        </Button>
        <p role="status" className="text-sm text-zinc-400">
          {busy
            ? `${progress} of ${challenge.capture?.samples || 3} samples captured. Processing locally on the server…`
            : ready
              ? "Camera ready. Capture when your face is clearly visible."
              : "Opening camera…"}
        </p>
      </div>
    </div>
  );
}
