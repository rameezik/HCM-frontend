"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { api } from "@/lib/api";
import { Button, Message } from "@/components/WorkspaceUI";

const MAX_PHOTO_BYTES = 250000;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

async function preparePhoto(file) {
  if (!ALLOWED_TYPES.includes(file.type))
    throw new Error("Choose a JPEG, PNG or WebP image.");
  if (file.size > 8 * 1024 * 1024)
    throw new Error("Choose a photo smaller than 8 MB.");
  const url = URL.createObjectURL(file),
    image = new window.Image(),
    canvas = document.createElement("canvas");
  try {
    await new Promise((resolve, reject) => {
      image.onload = resolve;
      image.onerror = () =>
        reject(
          new Error("This image could not be opened. Choose another photo."),
        );
      image.src = url;
    });
    if (!image.naturalWidth || !image.naturalHeight)
      throw new Error("This image has invalid dimensions.");
    const scale = Math.min(
      1,
      512 / Math.max(image.naturalWidth, image.naturalHeight),
    );
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
    const context = canvas.getContext("2d", { alpha: false });
    if (!context)
      throw new Error("This browser cannot prepare profile photos.");
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    let blob;
    for (const quality of [0.86, 0.72, 0.58]) {
      blob = await new Promise((resolve) =>
        canvas.toBlob(resolve, "image/jpeg", quality),
      );
      if (blob && blob.size <= MAX_PHOTO_BYTES) break;
    }
    if (!blob || blob.size > MAX_PHOTO_BYTES)
      throw new Error(
        "This photo cannot fit the upload limit. Choose a simpler image.",
      );
    return await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error("The photo could not be read."));
      reader.readAsDataURL(blob);
    });
  } finally {
    URL.revokeObjectURL(url);
    image.src = "";
    canvas.width = 0;
    canvas.height = 0;
  }
}

export default function EmployeePhoto({
  employee,
  canEdit = false,
  onChanged,
  compact = false,
}) {
  const fileInput = useRef(null);
  const [localPhoto, setLocalPhoto] = useState(null),
    [brokenUrl, setBrokenUrl] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [success, setSuccess] = useState("");
  const currentId = String(employee?._id || "");
  const serverUpdatedAt = employee?.photoUpdatedAt || null;
  const updatedAt =
    localPhoto?.employeeId === currentId &&
    localPhoto.serverUpdatedAt === serverUpdatedAt
      ? localPhoto.updatedAt
      : serverUpdatedAt;
  const photoUrl =
    currentId && updatedAt
      ? `/api/employees/${encodeURIComponent(currentId)}/photo?v=${encodeURIComponent(updatedAt)}`
      : "";
  const initials =
    String(employee?.name || "")
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .map((part, index, names) =>
        index === 0 || index === names.length - 1 ? part[0] : "",
      )
      .join("")
      .slice(0, 2)
      .toUpperCase() || "?";

  async function changePhoto(file) {
    if (!file || busy || !currentId) return;
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      const image = await preparePhoto(file);
      const result = await api(`/employees/${currentId}/photo`, {
        method: "POST",
        body: { image },
      });
      if (!result.photoUpdatedAt)
        throw new Error(
          "The photo service did not confirm the saved photo. Refresh your profile before retrying.",
        );
      setLocalPhoto({
        employeeId: currentId,
        serverUpdatedAt,
        updatedAt: result.photoUpdatedAt,
      });
      setBrokenUrl("");
      setSuccess("Profile photo saved.");
      onChanged?.(result);
    } catch (failure) {
      setError(failure.message || "The photo could not be uploaded.");
    } finally {
      setBusy(false);
      if (fileInput.current) fileInput.current.value = "";
    }
  }
  async function removePhoto() {
    if (busy || !currentId) return;
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      const result = await api(`/employees/${currentId}/photo`, {
        method: "DELETE",
      });
      if (!result.deleted)
        throw new Error(
          "The photo service did not confirm removal. Refresh your profile before retrying.",
        );
      setLocalPhoto({
        employeeId: currentId,
        serverUpdatedAt,
        updatedAt: null,
      });
      setBrokenUrl("");
      setSuccess("Profile photo removed.");
      onChanged?.(result);
    } catch (failure) {
      setError(failure.message || "The photo could not be removed.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className={compact ? "inline-flex shrink-0" : "mb-5 space-y-3"}>
      <div
        className={`flex items-center justify-center overflow-hidden rounded-full border border-white/10 bg-cyan-400/10 font-semibold text-[#82cde6] ${compact ? "h-10 w-10 text-xs" : "h-24 w-24 text-2xl"}`}
      >
        {photoUrl && brokenUrl !== photoUrl ? (
          <Image
            src={photoUrl}
            alt={`${employee.name}'s profile photo`}
            width={compact ? 40 : 96}
            height={compact ? 40 : 96}
            unoptimized
            className="h-full w-full object-cover"
            onError={() => setBrokenUrl(photoUrl)}
          />
        ) : (
          <span aria-label={`${employee?.name || "Employee"} initials`}>
            {initials}
          </span>
        )}
      </div>
      {!compact && photoUrl && brokenUrl === photoUrl && (
        <p role="alert" className="text-sm text-rose-200">
          The profile photo could not be loaded. Refresh the page or upload it
          again.
        </p>
      )}
      {canEdit && !compact && (
        <div className="space-y-3">
          <label className="block text-sm text-zinc-300">
            <span className="mb-2 block">Upload profile photo</span>
            <input
              ref={fileInput}
              type="file"
              accept={ALLOWED_TYPES.join(",")}
              aria-label="Profile photo file"
              disabled={busy}
              onChange={(event) => changePhoto(event.target.files?.[0])}
              className="block w-full max-w-md rounded-lg border border-white/10 p-2 text-sm file:mr-3 file:rounded file:border-0 file:bg-[#007ba7] file:px-3 file:py-2 file:text-white"
            />
          </label>
          <p className="max-w-xl text-xs leading-5 text-zinc-400">
            Choosing a photo uploads it securely to your company profile. JPEG,
            PNG or WebP, up to 8 MB; resized to 512 pixels. A profile photo does
            not enroll your face for attendance.
          </p>
          {updatedAt && (
            <Button secondary disabled={busy} onClick={removePhoto}>
              Remove profile photo
            </Button>
          )}
          {busy && (
            <p role="status" className="text-sm text-[#82cde6]">
              Updating profile photo…
            </p>
          )}
          <Message error={error} success={success} />
        </div>
      )}
    </div>
  );
}
