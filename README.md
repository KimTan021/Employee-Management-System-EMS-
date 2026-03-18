# Employee Management System

A sophisticated, full-stack enterprise solution for modern workforce management. Built with Java Spring Boot and React, this system offers a secure, role-based platform for managing the entire employee lifecycle—from onboarding and documentation to leave management and audit compliance.

## 🚀 Key Modules & Features

### 🔐 Multi-Role Specialized Portals
- **Admin Command Center**: Complete system oversight, user account provisioning with role assignments (Admin, HR, Employee), and database maintenance.
- **HR Strategic Dashboard**: 
    - **Workforce Directory**: Advanced management with automated `EMP-ID` generation and age validation.
    - **Approval Workflows**: Centralized hubs for reviewing Leave Requests and Profile Change proposals.
    - **Data Intelligence**: Visual department analytics and real-time statistics (Avg Salary, Age, Headcount).
- **Employee Self-Service Portal**: Personal dashboard for profile management, leave tracking, and secure document access.

### 📦 Core Functionality
- **Employee Lifecycle**: 
    - **Soft Delete/Restore**: Deactivate employees while preserving history, with the ability to restore access instantly.
    - **Permanent Cleanup**: Securely purge employee data, including physical files, documents, and system records.
- **Document Management System**: Enterprise-grade file handling for contracts and IDs with role-based download permissions.
- **Leave Management Workflow**: End-to-end digital requests with real-time status tracking (Pending, Approved, Rejected).
- **Audit & Compliance**: Automated event logging for every system action (Create, Update, Deactivate, Restore), ensuring a transparent trail of modifications.
- **Reporting & Data Portability**: Instant export of workforce data to **PDF Reports** and **CSV Spreadsheets** for offline analysis.

## 🛠️ Tech Stack

### Backend
- **Core**: Java 25 & Spring Boot 4.x
- **Persistence**: MySQL with Spring Data JPA & Hibernate
- **Migrations**: Flyway (Automated schema versioning)
- **Security**: JWT (Stateless authentication) & Spring Security RBAC
- **Ops**: Maven Architecture

### Frontend
- **Framework**: React 19 (Vite)
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4 with Premium Mesh Gradient Design
- **State/Data**: Zustand & TanStack React Query
- **Visualization**: Recharts (Interactive Analytics)
- **Icons**: Lucide React

## 📋 Prerequisites

- **JDK 25**
- **Node.js (v18+)**
- **MySQL Server**
- **Maven** (optional, `./mvnw` included)

## ⚙️ Quick Start

### 1. Database
Create a database named `emp_db`. The system handles schema creation via Flyway.
*Default: root / admin*

### 2. Backend
```bash
./mvnw spring-boot:run
```

### 3. Frontend
```bash
cd frontend-react
npm install
npm run dev
```

## 🖇️ API Architecture Summary

### Public/Auth (`/api/auth`)
- `POST /login`, `POST /register`

### Admin/HR Secure Endpoints (`/api/admin`)
- `/users` - User account management
- `/documents` - Secure file storage & retrieval
- `/audit` - System-wide compliance logs

### Core Business Services
- `/api/employees` - Workforce management (CRUD, Restore, Stats)
- `/api/departments` - Organization structure
- `/api/leave-requests` - Absence management
- `/api/profile-changes` - Information update workflows
