import {
  ArrowUpRight,
  BrainCircuit,
  Sparkles,
} from "lucide-react";

import DashboardLayout from "@/components/layout/DashboardLayout";
import StatCard from "@/components/ui/StatCard";

export default function AdminDashboard() {
  return (
    <DashboardLayout role="admin">
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#007BA7]">
              Administration Overview
            </p>

            <h1 className="text-3xl font-bold tracking-tight text-white md:text-4xl">
              Admin{" "}
              <span className="bg-gradient-to-r from-[#007BA7] to-[#FF2D95] bg-clip-text text-transparent">
                Dashboard
              </span>
            </h1>

            <p className="mt-3 text-sm text-white/45">
              Manage your organization, employees, and workforce operations.
            </p>
          </div>

          <div className="flex items-center gap-2 rounded-full border border-[#007BA7]/20 bg-[#007BA7]/10 px-4 py-2 text-xs font-medium text-[#4BB8DC]">
            <span className="h-2 w-2 rounded-full bg-[#007BA7]" />
            Admin Workspace
          </div>
        </div>

        {/* Statistics */}
        <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Total Employees"
            value="—"
            icon="users"
            description="Registered employees"
          />

          <StatCard
            title="Payroll Overview"
            value="—"
            icon="wallet"
            description="Monthly payroll summary"
          />

          <StatCard
            title="Departments"
            value="—"
            icon="building"
            description="Active departments"
          />

          <StatCard
            title="Present Today"
            value="—"
            icon="activity"
            description="Today's attendance"
          />
        </section>

        {/* Content */}
        <section className="grid gap-6 lg:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-[#111111] p-6 lg:col-span-2">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-white">
                  Workforce Analytics
                </h2>

                <p className="mt-1 text-sm text-white/40">
                  Employee and attendance insights
                </p>
              </div>

              <ArrowUpRight size={19} className="text-white/35" />
            </div>

            <div className="mt-8 flex min-h-64 flex-col items-center justify-center rounded-xl border border-dashed border-white/10 bg-white/[0.02] text-center">
              <div className="mb-4 rounded-xl bg-[#007BA7]/10 p-4">
                <BrainCircuit size={26} className="text-[#007BA7]" />
              </div>

              <h3 className="text-sm font-semibold text-white">
                Analytics will appear here
              </h3>

              <p className="mt-2 max-w-xs text-xs leading-relaxed text-white/40">
                Workforce analytics will become available when employee
                and attendance data is connected.
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#111111] p-6">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-[#FF2D95]/10 p-3">
                <Sparkles size={22} className="text-[#FF2D95]" />
              </div>

              <div>
                <h2 className="text-lg font-semibold text-white">
                  AI Insights
                </h2>

                <p className="text-xs text-white/40">
                  Intelligent workforce assistant
                </p>
              </div>
            </div>

            <div className="mt-8 rounded-xl border border-[#FF2D95]/15 bg-[#FF2D95]/5 p-5">
              <p className="text-sm font-medium text-white">
                AI integration pending
              </p>

              <p className="mt-3 text-xs leading-relaxed text-white/45">
                Workforce insights will be available after connecting
                the backend AI service.
              </p>
            </div>
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}