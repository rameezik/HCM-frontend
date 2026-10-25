import AttendanceKiosk from "@/components/kiosk/AttendanceKiosk";

export const metadata = {
  title: "Attendance kiosk",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

export default function Page() {
  return <AttendanceKiosk />;
}
