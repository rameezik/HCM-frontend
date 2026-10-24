import FaceScanner from "@/components/attendance/FaceScanner";

export default function AttendanceKioskPage() {
  return (
    <main className="min-h-screen bg-[#0A0A0A] px-6 py-12 text-white">
      <div className="mx-auto max-w-xl">
        <h1 className="text-3xl font-semibold">Attendance kiosk</h1>
        <p className="mt-2 text-white/65">Camera-based attendance is not configured yet.</p>
        <div className="mt-8">
          <FaceScanner />
        </div>
      </div>
    </main>
  );
}