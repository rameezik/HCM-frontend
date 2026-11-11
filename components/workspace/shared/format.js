export const todayIso = () => new Date().toISOString().slice(0, 10);
export const currentMonth = () => todayIso().slice(0, 7);
export const formatDateTime = (d) =>
  d ? new Date(d).toLocaleString("en-GB", { timeZone: "UTC" }) : "—";
export const employeeNameColumn = {
  key: "employee",
  label: "Employee",
  render: (row) => row.employee?.name || "—",
};
