# Reading the frontend

`app` contains Next.js routes. Most role-specific routes render `components/Workspace.jsx` with a role and view name. Workspace loads the current user, checks access, displays the sidebar layout and selects the page component.

## Finding a screen

| Screen | Code |
| --- | --- |
| Dashboard | `components/workspace/DashboardPage.jsx` |
| Employee directory, details and CSV import | `components/workspace/employees/` |
| My profile | `components/workspace/ProfilePage.jsx` |
| Attendance | `components/workspace/AttendancePage.jsx` |
| Leave requests | `components/workspace/LeavePage.jsx` |
| Payroll and payslips | `components/workspace/PayrollPage.jsx` |
| User accounts | `components/workspace/UserAccountsPage.jsx` |
| Company settings | `components/workspace/CompanySettings.jsx` |
| Departments | `components/Departments.jsx` |
| Notices, notifications and audit history | `components/workspace/Announcements.jsx`, `Notifications.jsx`, `AuditLog.jsx` |
| Attendance graphs | `components/attendance/AttendanceAnalytics.jsx`, `AttendanceCharts.jsx` |
| Public face scanner | `components/attendance/AttendanceTerminal.jsx` |
| Terminal settings and employee photo approval | `components/attendance/AttendanceTerminalSettings.jsx` |

Workspace pages share data hooks and small forms in `components/workspace/shared`. Employee-specific forms stay in the `employees` folder. Buttons, tables, panels and ordinary forms come from `components/WorkspaceUI.jsx`.

## Following a request

1. The page calls `api()` from `lib/api.js`.
2. The browser sends the request to the same-origin `/api` route.
3. `lib/server-api-proxy.js` forwards it to the Express backend.
4. The page renders the returned records or error message.

`config/navigation.js` lists sidebar links by role. Authentication redirects are handled by `Workspace.jsx` and `Auth.jsx`, using the password policy in `lib/authPolicy.js`.

Terminal camera, connection and scan logic live in `components/attendance/terminal`. Its `settings` folder contains employee photo permissions, employee lists and terminal connections. Page components compose the UI; hooks handle state, and camera modules open the webcam, take samples and stop tracks. A successful attendance result must come from the backend.

When changing a screen, start in its feature component. Reuse the shared data hooks and UI. Run `npm run lint`, `npm test` and `npm run build` before committing.
