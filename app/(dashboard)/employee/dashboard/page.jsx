import DashboardLayout from "@/components/layout/DashboardLayout";
import StatCard from "@/components/ui/StatCard";

export default function EmployeeDashboard() {
  return (
    <DashboardLayout role="employee">
      <div className="space-y-8">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#007BA7]">
            Employee Workspace
          </p>

          <h1 className="text-3xl font-bold tracking-tight text-white md:text-4xl">
            My{" "}
            <span className="bg-gradient-to-r from-[#007BA7] to-[#FF2D95] bg-clip-text text-transparent">
              Dashboard
            </span>
          </h1>

          <p className="mt-3 text-sm text-white/45">
            Track your attendance, leaves, and payroll information.
          </p>
        </div>

        <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Attendance"
            value="—"
            icon="clock"
            description="Today's attendance status"
          />

          <StatCard
            title="Annual Leave"
            value="—"
            icon="calendar"
            description="Remaining leave balance"
          />

          <StatCard
            title="Leave Requests"
            value="—"
            icon="clipboard"
            description="Submitted requests"
          />

          <StatCard
            title="Latest Payslip"
            value="—"
            icon="wallet"
            description="Payroll information"
          />
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-[#111111] p-6">
            <h2 className="text-lg font-semibold text-white">
              My Attendance
            </h2>

            <p className="mt-2 text-sm text-white/40">
              Your recent attendance records.
            </p>

            <div className="mt-6 flex min-h-48 items-center justify-center rounded-xl border border-dashed border-white/10 text-sm text-white/35">
              Attendance records will appear here
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#111111] p-6">
            <h2 className="text-lg font-semibold text-white">
              My Leave Requests
            </h2>

            <p className="mt-2 text-sm text-white/40">
              Track your submitted leave applications.
            </p>

            <div className="mt-6 flex min-h-48 items-center justify-center rounded-xl border border-dashed border-white/10 text-sm text-white/35">
              Leave requests will appear here
            </div>
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}