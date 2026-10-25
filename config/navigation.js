export const navigation = {
  admin: [
    {
      label: "Dashboard",
      href: "/admin/dashboard",
      icon: "LayoutDashboard",
    },
    {
      label: "Employees",
      href: "/admin/employees",
      icon: "Users",
    },
    {
      label: "Departments",
      href: "/admin/departments",
      icon: "Building2",
    },
    {
      label: "Designations",
      href: "/admin/designations",
      icon: "BriefcaseBusiness",
    },
    {
      label: "HR Management",
      href: "/admin/users",
      icon: "UserCog",
    },
    {
      label: "Attendance kiosk",
      href: "/admin/attendance-kiosks",
      icon: "Camera",
    },
    {
      label: "Payroll",
      href: "/admin/payroll",
      icon: "Wallet",
    },
    {
      label: "Audit Logs",
      href: "/admin/audit-logs",
      icon: "ScrollText",
    },
    {
      label: "Settings",
      href: "/admin/settings",
      icon: "Settings",
    },
  ],

  hr: [
    {
      label: "Dashboard",
      href: "/hr/dashboard",
      icon: "LayoutDashboard",
    },
    {
      label: "Employees",
      href: "/hr/employees",
      icon: "Users",
    },
    {
      label: "Attendance",
      href: "/hr/attendance",
      icon: "CalendarCheck",
    },
    {
      label: "Webcam face scan",
      href: "/hr/face-scan",
      icon: "Camera",
    },
    {
      label: "Leave Management",
      href: "/hr/leaves",
      icon: "CalendarDays",
    },
    {
      label: "Payroll",
      href: "/hr/payroll",
      icon: "Wallet",
    },
  ],

  employee: [
    {
      label: "Dashboard",
      href: "/employee/dashboard",
      icon: "LayoutDashboard",
    },
    {
      label: "My Profile",
      href: "/employee/profile",
      icon: "UserRound",
    },
    {
      label: "Attendance",
      href: "/employee/attendance",
      icon: "Clock3",
    },
    {
      label: "Webcam face scan",
      href: "/employee/face-scan",
      icon: "Camera",
    },
    {
      label: "My Leaves",
      href: "/employee/leaves",
      icon: "CalendarDays",
    },
    {
      label: "Payslips",
      href: "/employee/payslips",
      icon: "ReceiptText",
    },
  ],
};
for (const role of ["admin", "hr", "employee"]) {
  if (role === "admin")
    navigation[role].push(
      { label: "Attendance", href: "/admin/attendance", icon: "CalendarCheck" },
      { label: "Leave records", href: "/admin/leaves", icon: "CalendarDays" },
      {
        label: "Leave types",
        href: "/admin/leave-types",
        icon: "CalendarDays",
      },
      {
        label: "Public holidays",
        href: "/admin/holidays",
        icon: "CalendarDays",
      },
    );
  if (role === "hr")
    navigation[role].push(
      { label: "Company policy", href: "/hr/settings", icon: "Settings" },
      { label: "Departments", href: "/hr/departments", icon: "Building2" },
      {
        label: "Designations",
        href: "/hr/designations",
        icon: "BriefcaseBusiness",
      },
      { label: "Leave types", href: "/hr/leave-types", icon: "CalendarDays" },
      { label: "Public holidays", href: "/hr/holidays", icon: "CalendarDays" },
    );
  navigation[role].push(
    {
      label: "Announcements",
      href: `/${role}/announcements`,
      icon: "ScrollText",
    },
    {
      label: "Notifications",
      href: `/${role}/notifications`,
      icon: "CalendarCheck",
    },
    { label: "AI assistant", href: `/${role}/assistant`, icon: "UserRound" },
  );
}

for (const role of ["employee", "hr"])
  navigation[role].push({
    label: "Face enrollment",
    href: `/${role}/face-enrollment`,
    icon: "UserRound",
  });

// Keep graph discovery alongside attendance in every role's navigation.
for (const role of ["admin", "hr", "employee"]) {
  const href = `/${role}/attendance-graphs`;
  if (!navigation[role].some((item) => item.href === href)) {
    const attendanceIndex = navigation[role].findIndex(
      (item) => item.href === `/${role}/attendance`,
    );
    navigation[role].splice(attendanceIndex + 1, 0, {
      label: "Attendance graphs",
      href,
      icon: "BarChart3",
    });
  }
}
