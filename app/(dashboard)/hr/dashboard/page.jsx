import DashboardLayout from "@/components/layout/DashboardLayout";
import StatCard from "@/components/ui/StatCard";

export default function HRDashboard() {
  return (
    <DashboardLayout role="hr">
      <div className="space-y-8">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#007BA7]">
            Human Resources
          </p>

          <h1 className="text-3xl font-bold tracking-tight text-white md:text-4xl">
            HR{" "}
            <span className="bg-gradient-to-r from-[#007BA7] to-[#FF2D95] bg-clip-text text-transparent">
              Dashboard
            </span>
          </h1>

          <p className="mt-3 text-sm text-white/45">
            Manage employees, attendance, leave requests, and payroll.
          </p>
        </div>

        <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Total Employees"
            value="—"
            icon="users"
            description="Registered employees"
          />

          <StatCard
            title="Present Today"
            value="—"
            icon="userCheck"
            description="Today's attendance"
          />

          <StatCard
            title="Leave Requests"
            value="—"
            icon="calendar"
            description="Pending requests"
          />

          <StatCard
            title="Monthly Payroll"
            value="—"
            icon="wallet"
            description="Payroll overview"
          />
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-[#111111] p-6">
            <h2 className="text-lg font-semibold text-white">
              Recent Employees
            </h2>

            <p className="mt-2 text-sm text-white/40">
              Recently registered employees will appear here.
            </p>

            <div className="mt-6 flex min-h-48 items-center justify-center rounded-xl border border-dashed border-white/10 text-sm text-white/35">
              Waiting for employee data
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#111111] p-6">
            <h2 className="text-lg font-semibold text-white">
              Pending Leave Requests
            </h2>

            <p className="mt-2 text-sm text-white/40">
              Employee leave requests requiring approval.
            </p>

            <div className="mt-6 flex min-h-48 items-center justify-center rounded-xl border border-dashed border-white/10 text-sm text-white/35">
              Waiting for leave data
            </div>
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}