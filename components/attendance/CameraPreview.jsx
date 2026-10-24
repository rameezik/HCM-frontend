"use client";

import { useEffect, useRef, useState } from "react";
import Button from "@/components/ui/Button";

export default function CameraPreview() {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [error, setError] = useState("");

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  async function startPreview() {
    setError("");

    if (!navigator.mediaDevices?.getUserMedia) {
      setError("Camera access is not available in this browser.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch {
      setError("Camera permission was not granted.");
    }
  }

  function stopPreview() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  }

  return (
    <section className="grid gap-3">
      <video
        aria-label="Live camera preview"
        className="aspect-video w-full rounded-md border border-white/15 bg-[#111] object-cover"
        muted
        playsInline
        ref={videoRef}
      />
      <div className="flex flex-wrap gap-2">
        <Button onClick={startPreview}>Start camera</Button>
        <Button onClick={stopPreview} variant="secondary">Stop camera</Button>
      </div>
      {error ? <p className="text-sm text-[#FF2D95]" role="status">{error}</p> : null}
    </section>
  );
}