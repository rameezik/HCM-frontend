"use client";

import Link from "next/link";
import { Camera } from "lucide-react";
import FaceVerification from "./FaceVerification";
import { Panel } from "@/components/WorkspaceUI";

export default function WebcamAttendance({ user }) {
  const role = user?.role === "hr" ? "hr" : "employee";

  return (
    <div className="space-y-6">
      <Panel title="Webcam face scan attendance">
        <div className="mb-5 flex items-start gap-3">
          <Camera
            className="mt-1 shrink-0 text-[#82cde6]"
            size={24}
            aria-hidden="true"
          />
          <p className="text-sm leading-7 text-zinc-400">
            Use your computer&apos;s webcam to check in or check out. Enroll
            your face once with your consent, then choose a face attendance
            action, allow camera and location access, and capture your face
            samples. Attendance is saved only after the server matches your
            enrolled face.
          </p>
        </div>
        <FaceVerification user={user} />
      </Panel>

      <Panel title="Enrollment and attendance options">
        <div className="flex flex-wrap gap-3">
          <Link
            href={`/${role}/face-enrollment`}
            className="rounded-xl border border-white/15 px-4 py-2 text-sm text-[#82cde6] hover:bg-white/5"
          >
            Enroll or manage my face
          </Link>
          <Link
            href={`/${role}/attendance`}
            className="rounded-xl border border-white/15 px-4 py-2 text-sm text-[#82cde6] hover:bg-white/5"
          >
            View attendance history
          </Link>
        </div>
        <p className="mt-4 text-sm leading-6 text-zinc-400">
          Face attendance is optional. If you cannot use a camera or do not
          consent to biometric processing, open Attendance and use the
          authorized check-in/check-out without face, or request an HR
          correction.
        </p>
      </Panel>
    </div>
  );
}
