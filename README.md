# Employee Management System

A robust, full-stack Employee Management System built with Java Spring Boot and React. The application provides a secure, role-based platform for organization-wide employee management, document handling, leave requests, and comprehensive audit tracking.

## 🚀 Features

### 🔐 Role-Based Experience
The system provides tailored interfaces based on user roles:
- **Admin Dashboard**: Full system control including user management, role assignments, and global settings.
- **HR Manager Portal**: Specialized tools for employee lifecycle management, document oversight, and leave approvals.
- **Employee Self-Service**: Personal dashboard for viewing profiles, requesting information changes, and managing leave requests.

### 📦 Key Modules
- **Employee Management**: Comprehensive CRUD operations for employee records with detailed personal and professional data.
- **Document Management**: Secure file upload, storage, and retrieval system for employee-related documents (contracts, IDs, etc.).
- **Leave Management**: End-to-end workflow for submitting, tracking, and approving/rejecting leave requests.
- **Audit Logging**: Automated system-wide tracking of all sensitive actions, providing a transparent history of entity changes.
- **Profile Change Requests**: Workflow allowing employees to propose updates to their information, subject to HR/Admin approval.
- **Workforce Analytics**: Real-time statistics including salary distributions, age demographics, and department metrics.

### 🛠️ Technical Highlights
- **Backend (Spring Boot)**: JWT-based security, Spring Security role-based access control, Flyway database migrations, and MapStruct DTO mapping.
- **Frontend (React)**: Modern UI with Vite and Tailwind CSS 4, Zustand for state management, and TanStack React Query for efficient data synchronization.

## 🛠️ Tech Stack

**Backend:**
- Java 25
- Spring Boot 4.x
- MySQL
- Flyway (Database Migrations)
- JWT (JSON Web Tokens)
- Hibernate / Spring Data JPA
- MapStruct & Lombok

**Frontend:**
- React 19
- Vite
- TypeScript
- Tailwind CSS 4
- Zustand
- TanStack React Query
- Axios
- Lucide React (Icons)

## 📋 Prerequisites

- **Java Development Kit (JDK) 25**
- **Node.js** (v18+)
- **MySQL Server**
- **Maven** (or use the included `./mvnw`)

## ⚙️ Setup and Installation

### 1. Database Configuration
Ensure MySQL is running. The application uses Flyway to manage schema automatically.
Default config:
- **DB Name**: `emp_db`
- **User/Password**: `root` / `admin`
- **URL**: `jdbc:mysql://localhost:3306/emp_db`

### 2. Running the Application
**Backend**:
```bash
./mvnw spring-boot:run
```

**Frontend**:
```bash
cd frontend-react
npm install
npm run dev
```

## 🖇️ API Endpoints Summary

### Core Services
- `/api/auth` - Authentication & Registration
- `/api/employees` - Employee Records & Statistics
- `/api/departments` - Organization Structure

### Management Services
- `/api/admin/users` - User Account Management (Admin Only)
- `/api/admin/documents` - Secure Document Handling
- `/api/admin/audit` - System Audit Trails
- `/api/profile-changes` - Employee Info Update Requests
- `/api/leave-requests` - Absence Management
