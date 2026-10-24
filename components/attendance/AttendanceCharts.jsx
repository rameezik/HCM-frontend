"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Panel, Table } from "@/components/WorkspaceUI";

export const ATTENDANCE_STATUS = {
  present: { label: "Present", color: "#4bb8dc" },
  absent: { label: "Absent", color: "#ff639e" },
  late: { label: "Late", color: "#f7bd68" },
  on_leave: { label: "On leave", color: "#9b8afb" },
  half_day: { label: "Half day", color: "#65cdb2" },
  missing_checkout: { label: "Missing checkout", color: "#b5becd" },
};

const chartTheme = {
  contentStyle: {
    borderRadius: 12,
    border: "1px solid #363640",
    backgroundColor: "#16161e",
    color: "#f8fafc",
    fontSize: 12,
  },
  labelStyle: { color: "#d4d4d8", marginBottom: 6 },
  itemStyle: { color: "#f8fafc" },
  cursor: { fill: "#ffffff06" },
};
const axisStyle = { fontSize: 11, fill: "#a1a1aa" };

function dateLabel(value) {
  if (!value) return "";
  const day = new Date(`${value}T12:00:00Z`);
  return Number.isNaN(day.getTime())
    ? value
    : day.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        timeZone: "UTC",
      });
}
function EmptyChart() {
  return (
    <p className="flex min-h-48 items-center justify-center rounded-xl border border-dashed border-white/10 p-7 text-center text-sm text-zinc-400">
      No attendance records available yet.
    </p>
  );
}
function Values({ rows, columns, description }) {
  return (
    <details className="mt-4 border-t border-white/10 pt-4">
      <summary className="cursor-pointer text-xs font-medium text-[#82cde6]">
        View chart values
      </summary>
      <p className="my-3 text-xs leading-5 text-zinc-400">{description}</p>
      <Table
        rows={rows}
        columns={columns}
        empty="No attendance records available yet."
      />
    </details>
  );
}
function ChartArea({ label, children }) {
  return (
    <div className="h-72 w-full min-w-0" role="group" aria-label={label}>
      <ResponsiveContainer
        width="100%"
        height="100%"
        minWidth={0}
        initialDimension={{ width: 600, height: 288 }}
      >
        {children}
      </ResponsiveContainer>
    </div>
  );
}
const statusColumns = [
  { key: "present", label: "Present" },
  { key: "absent", label: "Absent" },
  { key: "late", label: "Late" },
  { key: "onLeave", label: "On leave" },
];

export default function AttendanceCharts({ data, employeeView = false }) {
  const weekly = data.weekly || [];
  const monthly = data.monthly || [];
  const departments = data.departments || [];
  const distribution = (data.distribution || []).filter((row) => row.count > 0);
  const hasEligibleDays = Boolean(data.summary?.expectedDays);
  return (
    <div className="grid min-w-0 gap-6 xl:grid-cols-2">
      <Panel title="Weekly attendance">
        <p className="mb-5 text-xs leading-5 text-zinc-400">
          Employee workdays grouped by the Monday of each week. Present and late
          are separate groups; half days and missing checkouts remain visible in
          the status distribution.
        </p>
        {hasEligibleDays && weekly.length ? (
          <>
            <ChartArea label="Weekly bar chart of present, absent, late and approved-leave workdays">
              <BarChart
                data={weekly}
                margin={{ top: 5, right: 8, left: -20, bottom: 0 }}
                accessibilityLayer
              >
                <CartesianGrid
                  stroke="#292934"
                  vertical={false}
                  strokeDasharray="3 4"
                />
                <XAxis
                  dataKey="weekStart"
                  tickFormatter={dateLabel}
                  tick={axisStyle}
                  axisLine={false}
                  tickLine={false}
                  minTickGap={20}
                />
                <YAxis
                  allowDecimals={false}
                  tick={axisStyle}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  {...chartTheme}
                  labelFormatter={(value) => `Week of ${dateLabel(value)}`}
                />
                <Legend wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
                <Bar
                  dataKey="present"
                  name="Present"
                  fill="#4bb8dc"
                  radius={[3, 3, 0, 0]}
                  maxBarSize={22}
                  isAnimationActive={false}
                />
                <Bar
                  dataKey="absent"
                  name="Absent"
                  fill="#ff639e"
                  radius={[3, 3, 0, 0]}
                  maxBarSize={22}
                  isAnimationActive={false}
                />
                <Bar
                  dataKey="late"
                  name="Late"
                  fill="#f7bd68"
                  radius={[3, 3, 0, 0]}
                  maxBarSize={22}
                  isAnimationActive={false}
                />
                <Bar
                  dataKey="onLeave"
                  name="On leave"
                  fill="#9b8afb"
                  radius={[3, 3, 0, 0]}
                  maxBarSize={22}
                  isAnimationActive={false}
                />
              </BarChart>
            </ChartArea>
            <Values
              rows={weekly.map((row) => ({ ...row, _id: row.weekStart }))}
              columns={[
                { key: "weekStart", label: "Week starting" },
                ...statusColumns,
              ]}
              description="Counts come from the selected company calendar, saved attendance records and approved leave."
            />
          </>
        ) : (
          <EmptyChart />
        )}
      </Panel>

      <Panel title="Monthly attendance trend">
        <p className="mb-5 text-xs leading-5 text-zinc-400">
          Daily attendance rate for the selected dates. Approved leave is
          excluded from expected attendance; half days count as half attendance.
        </p>
        {hasEligibleDays && monthly.length ? (
          <>
            <ChartArea label="Line chart of daily attendance percentages">
              <LineChart
                data={monthly}
                margin={{ top: 8, right: 12, left: -5, bottom: 0 }}
                accessibilityLayer
              >
                <CartesianGrid
                  stroke="#292934"
                  vertical={false}
                  strokeDasharray="3 4"
                />
                <XAxis
                  dataKey="date"
                  tickFormatter={dateLabel}
                  tick={axisStyle}
                  axisLine={false}
                  tickLine={false}
                  minTickGap={28}
                />
                <YAxis
                  domain={[0, 100]}
                  tickFormatter={(value) => `${value}%`}
                  tick={axisStyle}
                  axisLine={false}
                  tickLine={false}
                  width={48}
                />
                <Tooltip
                  {...chartTheme}
                  labelFormatter={dateLabel}
                  formatter={(value) => [
                    `${Number(value).toFixed(1)}%`,
                    "Attendance rate",
                  ]}
                />
                <Line
                  type="monotone"
                  dataKey="attendanceRate"
                  name="Attendance rate"
                  stroke="#4bb8dc"
                  strokeWidth={2.5}
                  dot={monthly.length < 35 ? { r: 3, fill: "#4bb8dc" } : false}
                  activeDot={{ r: 5 }}
                  connectNulls={false}
                  isAnimationActive={false}
                />
              </LineChart>
            </ChartArea>
            <Values
              rows={monthly}
              columns={[
                { key: "date", label: "Date" },
                {
                  key: "attendanceRate",
                  label: "Attendance rate",
                  render: (row) =>
                    row.attendanceRate == null
                      ? "No expected attendance"
                      : `${row.attendanceRate}%`,
                },
                { key: "expectedDays", label: "Expected workdays" },
                { key: "onLeave", label: "Approved leave" },
              ]}
              description="A day with no expected attendance does not imply anyone attended."
            />
          </>
        ) : (
          <EmptyChart />
        )}
      </Panel>

      {!employeeView && (
        <Panel title="Department attendance">
          <p className="mb-5 text-xs leading-5 text-zinc-400">
            Attendance rates within your company and the current reporting
            filters.
          </p>
          {hasEligibleDays && departments.length ? (
            <>
              <ChartArea label="Department comparison bar chart of attendance percentages">
                <BarChart
                  data={departments}
                  layout="vertical"
                  margin={{ top: 4, right: 12, left: 0, bottom: 0 }}
                  accessibilityLayer
                >
                  <CartesianGrid
                    stroke="#292934"
                    horizontal={false}
                    strokeDasharray="3 4"
                  />
                  <XAxis
                    type="number"
                    domain={[0, 100]}
                    tickFormatter={(value) => `${value}%`}
                    tick={axisStyle}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={axisStyle}
                    axisLine={false}
                    tickLine={false}
                    width={100}
                    tickFormatter={(name) =>
                      name.length > 14 ? `${name.slice(0, 13)}…` : name
                    }
                  />
                  <Tooltip
                    {...chartTheme}
                    formatter={(value) => [
                      `${Number(value).toFixed(1)}%`,
                      "Attendance rate",
                    ]}
                  />
                  <Bar
                    dataKey="attendanceRate"
                    name="Attendance rate"
                    fill="#4bb8dc"
                    radius={[0, 4, 4, 0]}
                    maxBarSize={24}
                    isAnimationActive={false}
                  />
                </BarChart>
              </ChartArea>
              <Values
                rows={departments.map((row) => ({
                  ...row,
                  _id: row.department,
                }))}
                columns={[
                  { key: "name", label: "Department" },
                  {
                    key: "attendanceRate",
                    label: "Attendance rate",
                    render: (row) =>
                      row.attendanceRate == null
                        ? "No expected attendance"
                        : `${row.attendanceRate}%`,
                  },
                  { key: "attended", label: "Attended workdays" },
                  { key: "absent", label: "Absent workdays" },
                  { key: "late", label: "Late workdays" },
                  { key: "onLeave", label: "Approved leave" },
                ]}
                description="Departments with no eligible workdays do not receive invented chart values."
              />
            </>
          ) : (
            <EmptyChart />
          )}
        </Panel>
      )}

      <Panel title="Attendance distribution">
        <p className="mb-5 text-xs leading-5 text-zinc-400">
          Distribution of attendance statuses over eligible workdays in this
          period.
        </p>
        {distribution.length ? (
          <>
            <ChartArea label="Donut chart showing the actual distribution of attendance statuses">
              <PieChart accessibilityLayer>
                <Tooltip
                  {...chartTheme}
                  formatter={(value, name) => [
                    value,
                    ATTENDANCE_STATUS[name]?.label || name,
                  ]}
                />
                <Pie
                  data={distribution}
                  nameKey="status"
                  dataKey="count"
                  innerRadius="54%"
                  outerRadius="78%"
                  paddingAngle={2}
                  stroke="#111116"
                  strokeWidth={3}
                  isAnimationActive={false}
                >
                  {distribution.map((row) => (
                    <Cell
                      key={row.status}
                      fill={ATTENDANCE_STATUS[row.status]?.color || "#b5becd"}
                    />
                  ))}
                </Pie>
                <Legend
                  formatter={(name) => ATTENDANCE_STATUS[name]?.label || name}
                  wrapperStyle={{ fontSize: 11 }}
                />
              </PieChart>
            </ChartArea>
            <Values
              rows={distribution.map((row) => ({ ...row, _id: row.status }))}
              columns={[
                {
                  key: "status",
                  label: "Status",
                  render: (row) =>
                    ATTENDANCE_STATUS[row.status]?.label || row.status,
                },
                { key: "count", label: "Employee workdays" },
              ]}
              description="Every workday belongs to one displayed status. Missing and half-day attendance are shown separately."
            />
          </>
        ) : (
          <EmptyChart />
        )}
      </Panel>
    </div>
  );
}
