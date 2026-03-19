# Employee Management System

A robust, enterprise-ready Employee Management System built with Java Spring Boot and React. Focuses on security, documentation, and a comprehensive automated testing lifecycle.

## 🚀 Key Modules & Features

### 🔐 Role-Based Access Control (RBAC)
- **Admin Command Center**: Complete oversight, user provisioning, and role management.
- **HR Strategic Dashboard**: Workforce analytics, leave approvals, and profile update workflows.
- **Employee Self-Service**: Personal dashboard for profile management and leave tracking.

### 📦 Core Functionality
- **Employee Lifecycle**: Automated `EMP-ID` generation, 18+ age validation, and soft-delete/restore capabilities.
- **Document Management**: Secure file upload and retrieval for sensitive employee records.
- **Leave Management**: Hierarchical leave request and approval system with real-time tracking.
- **Audit & Compliance**: Centralized logging of all system actions (history tracking).
- **Reporting**: Native support for **PDF Reports** and **CSV Exports** of workforce data.

### 🧪 Testing & Quality Assurance
The system is built with a "Test-First" mentality, ensuring 100% stability through a tiered testing architecture:
- **Unit Testing**: Isolated logic testing for all Services using **JUnit 5** and **Mockito**.
- **WebMvc (Controller) Testing**: API endpoint verification in a mocked environment for all REST controllers.
- **Integration Testing**: End-to-end lifecycle verification (e.g., full employee creation-to-deletion flows).
- **Error Handling**: Centralized **Global Exception Handling** ensuring consistent API responses.

## 🛠️ Tech Stack

### Backend
- **Core**: Java 25 & Spring Boot 4.x
- **Persistence**: MySQL, Data JPA, Hibernate
- **Migrations**: Flyway
- **Security**: JWT & Spring Security
- **Testing**: JUnit 5, Mockito, Spring Boot Test

### Frontend
- **Framework**: React 19 (Vite)
- **State**: Zustand & TanStack React Query
- **Styling**: Tailwind CSS 4 (Mesh Gradient UI)
- **Visuals**: Recharts & Lucide Icons

## 📋 Prerequisites
- **JDK 25**
- **Node.js (v18+)**
- **MySQL Server**

## ⚙️ Setup & Operations

### Database
Ensure MySQL is running with a database named `emp_db`.

### Running the App
- **Backend**: `./mvnw spring-boot:run`
- **Frontend**: `cd frontend-react && npm install && npm run dev`

### Running Tests
Execute the full test suite using the Maven wrapper:
```bash
./mvnw test
```

## 🖇️ API Architecture Summary
- `/api/auth` - Login & Registration
- `/api/admin/users` - User Management (Admin Only)
- `/api/admin/documents` - Document Storage
- `/api/admin/audit` - System Audit Trail
- `/api/employees` - Employee CRUD & Stats
- `/api/leave-requests` - Absence Management
- `/api/profile-changes` - Profile Update Workflows
