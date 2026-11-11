import AttendanceTerminal from "@/components/attendance/AttendanceTerminal";

export const metadata = {
  title: "Attendance Terminal",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

export default function Page() {
  return <AttendanceTerminal />;
}
