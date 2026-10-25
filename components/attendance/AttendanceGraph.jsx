"use client";

import Link from "next/link";
import { ArrowUpRight, BarChart3 } from "lucide-react";
import AttendanceAnalytics from "./AttendanceAnalytics";

export default function AttendanceGraph({ user }) {
  const employeeView = user.role === "employee";
  return (
    <div className="min-w-0 space-y-6">
      <section className="glass-card relative overflow-hidden p-5 md:p-7">
        <div
          className="pointer-events-none absolute -right-12 -top-12 h-44 w-44 rounded-full bg-[#007ba7]/10 blur-3xl"
          aria-hidden="true"
        />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 max-w-2xl">
            <div className="mb-4 flex items-center gap-3">
              <span
                className="rounded-xl border border-[#007ba7]/20 bg-[#007ba7]/10 p-2.5 text-[#82cde6]"
                aria-hidden="true"
              >
                <BarChart3 size={22} />
              </span>
              <p className="text-xs font-semibold uppercase tracking-[.18em] text-[#82cde6]">
                Attendance graphs
              </p>
            </div>
            <h2 className="text-xl font-semibold tracking-tight text-white md:text-2xl">
              {employeeView
                ? "Your attendance, over time"
                : "A clear view of your team’s attendance"}
            </h2>
            <p className="mt-3 text-sm leading-7 text-zinc-400">
              Explore daily attendance rates, weekly patterns and monthly
              trends.
              {employeeView
                ? " Your history and working hours are visible only to you and authorized company staff."
                : " Compare departments or select an employee to review their attendance history."}
            </p>
            <p className="mt-2 text-xs leading-6 text-zinc-500">
              Graphs use saved attendance, approved leave and your company’s
              working calendar. If no records are available, start with an
              attendance entry; no sample values are added.
            </p>
          </div>
          <Link
            href={`/${user.role}/attendance`}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-medium text-zinc-100 transition hover:bg-white/10"
          >
            {user.role === "admin"
              ? "Open attendance board"
              : "Check in or out"}
            <ArrowUpRight size={16} aria-hidden="true" />
          </Link>
        </div>
        <ul
          aria-label="Available attendance views"
          className="relative mt-5 flex flex-wrap gap-2"
        >
          {[
            "Daily rates",
            "Weekly attendance",
            "Monthly trends",
            "Status distribution",
            ...(!employeeView ? ["Department comparison"] : []),
            "Attendance history",
          ].map((label) => (
            <li
              key={label}
              className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs text-zinc-400"
            >
              {label}
            </li>
          ))}
        </ul>
      </section>
      <AttendanceAnalytics user={user} />
    </div>
  );
}
