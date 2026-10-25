# HCM Lite

### Human Capital Management System

HCM Lite is a web-based Human Capital Management application designed to simplify employee management, departmental organization, attendance tracking, leave management, and workforce analytics.

Built with Next.js, React, and Tailwind CSS, the application provides a modern, responsive interface for managing organizational operations.

The project follows a full-stack architecture with a dedicated Express.js backend and MongoDB database.

## Overview

HCM Lite aims to provide organizations with a centralized platform for managing their workforce.

The application is designed around three user roles:

- **Admin:** Manages company settings, departments, employees, and organizational operations.
- **HR:** Manages employee records, attendance, and leave requests.
- **Employee:** Accesses personal information, attendance records, and leave requests.

Role-based management, biometric attendance, and other advanced capabilities are being developed and integrated.

## Tech Stack

| Technology | Purpose |
|---|---|
| Next.js 16 | Frontend framework |
| React 19 | User interface |
| Tailwind CSS 4 | Styling |
| React Hook Form | Form management |
| Zod | Form validation |
| Recharts | Analytics and charts |
| Lucide React | Icons |
| Motion | UI animations |
| Node.js | JavaScript runtime |

### Backend Technologies

The frontend communicates with a separate backend application built using:

- Node.js
- Express.js
- MongoDB Atlas
- Mongoose
- Authentication and role-based authorization

## Features

### Authentication and Workspace Setup

- Company workspace registration
- User login and authentication
- Protected application routes
- Role-based dashboard architecture
- Account management workflows

### Employee Management

- Employee records
- Employee profiles
- Department assignments
- Role management
- Employment information

### Department Management

- Department organization
- Employee assignments
- Department-level workforce information

### Attendance Management

- Employee attendance records
- Check-in and check-out workflows
- Attendance history
- Attendance status tracking
- Attendance analytics

### Face Recognition Attendance

The project includes ongoing development of biometric attendance capabilities, including:

- Camera-based face enrollment
- Employee identity verification
- Face-verified check-in and check-out
- Attendance record integration

Biometric verification requires compatible backend recognition services and model dependencies. Availability depends on the configured deployment environment.

### Leave Management

- Leave requests
- Leave status tracking
- HR approval workflows
- Employee leave history

### Analytics Dashboard

- Workforce statistics
- Attendance summaries
- Attendance charts
- Department-level analytics

Analytics are designed to use data retrieved from the backend rather than hardcoded demonstration records.

## Project Architecture

```text
HCM Lite
│
├── Frontend
│   ├── Next.js App Router
│   ├── React Components
│   ├── Tailwind CSS
│   ├── Authentication Pages
│   ├── Role-Based Dashboards
│   └── API Proxy
│
├── Backend
│   ├── Node.js
│   ├── Express.js
│   ├── Authentication
│   ├── Employee Management
│   ├── Attendance Services
│   └── REST APIs
│
└── Database
    └── MongoDB Atlas
```

## Getting Started

### Prerequisites

Before running the project, ensure you have:

- Node.js 24.5.0 or later
- npm
- Git
- A running HCM Lite backend
- MongoDB Atlas configured for the backend

### 1. Clone the Repository

```bash
git clone https://github.com/rameezik/HCM-frontend.git
```

Navigate into the project:

```bash
cd HCM-frontend
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env.local` file in the frontend project root.

For local development:

```env
API_INTERNAL_URL=http://127.0.0.1:4000
```

The frontend uses a server-side API proxy to communicate with the Express backend.

Browser requests use the same-origin `/api` endpoint, while the Next.js server forwards requests to the configured backend.

The backend must be running and accessible at the specified address.

### 4. Start the Development Server

```bash
npm run dev
```

Open the application:

```text
http://localhost:3000
```

### 5. Build for Production

```bash
npm run build
```

Start the production server:

```bash
npm start
```

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start development server |
| `npm run build` | Create production build |
| `npm start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm test` | Run automated tests |

## Backend Integration

HCM Lite uses a separate backend repository.

**Backend Repository:**  
https://github.com/rameezik/HCM-backend

### API Communication

```text
Next.js Frontend
       |
       v
Same-origin /api proxy
       |
       v
Express backend (API_INTERNAL_URL)
```

### Webcam face attendance

Employee and HR navigation now includes **Webcam face scan** (`/employee/face-scan` and `/hr/face-scan`). Enroll once from **Enroll my face with webcam**, then use **Scan face to check in** or **Scan face to check out**. The Attendance page also provides **Open webcam face scan**. These controls use the existing protected local-recognition API; camera capture alone never marks attendance. Models, a stable backend encryption key and office-location settings must be ready before verification is enabled.

### Shared public attendance kiosk

`/attendance-kiosk` supports attendance on a trusted shared company device without an employee login on that device. An Admin must prepare it first:

1. Configure office coordinates in Company Settings, then create the employee account and upload its profile photo in **Employees**.
2. Open **Attendance kiosk** at `/admin/attendance-kiosks`, create a pairing link, and open that link on the shared device. The pairing link expires after 10 minutes and can be used once.
3. Issue a one-time enrollment code for that employee. The code expires after 15 minutes. At the kiosk, the employee must read and explicitly accept biometric consent, enter the code and capture camera samples. Uploading a profile photo alone never enrolls an employee.
4. After successful server-verified enrollment, use the paired kiosk to scan for check-in or check-out. Attendance is saved only after actual local identity matching and backend attendance checks.

Use HTTPS in production. Only a paired, unexpired and unrevoked device can submit kiosk attendance; Admin can revoke it from the device list. Keep pairing links and enrollment codes private. Local identity matching does not provide robust liveness or replay protection; authorized non-biometric attendance remains available.

### Password changes and normal workspace access

Admin-issued email and password credentials normally open the account's role-specific dashboard directly. Password changes remain available from the workspace's **Password** action. An Admin can explicitly select **Require a password change at first sign-in** when creating or resetting access; only that enforced policy restricts the account to changing its password first. Legacy password-change recommendations do not block normal navigation.

See the [backend model installation, encryption and biometric security guide](https://github.com/rameezik/HCM-backend/blob/main/docs/face-attendance.md) for runtime requirements and recognition limitations.
