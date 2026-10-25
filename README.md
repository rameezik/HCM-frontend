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

### Webcam face attendance

Employee and HR navigation now includes **Webcam face scan** (`/employee/face-scan` and `/hr/face-scan`). Enroll once from **Enroll my face with webcam**, then use **Scan face to check in** or **Scan face to check out**. The Attendance page also provides **Open webcam face scan**. These controls use the existing protected local-recognition API; camera capture alone never marks attendance. Models, a stable backend encryption key and office-location settings must be ready before verification is enabled.
