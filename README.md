# Employee Management System

A full-stack Employee Management System built with Java Spring Boot and React. The application provides a secure, role-based platform for managing employee records, viewing workforce statistics, and handling user authentication.

## 🚀 Features

### Backend (Spring Boot)
- **RESTful API**: Complete CRUD operations for employee management.
- **Authentication & Authorization**: Secure endpoints using JWT (JSON Web Tokens) and Spring Security. Role-based access control (e.g., ADMIN only actions).
- **Data Analytics**: Endpoints for calculating workforce statistics like average age and salary.
- **Database Migrations**: Automated database versioning and migrations using Flyway.
- **Data Mapping**: Efficient DTO (Data Transfer Object) mapping using MapStruct.

### Frontend (React)
- **Modern UI**: Built with React 19, Vite, and Tailwind CSS 4.
- **Component Library**: Integrates accessible and customizable UI components.
- **State Management**: Uses `Zustand` for global state and `TanStack React Query` for efficient data fetching, caching, and synchronization.
- **Secure Routing**: Protected routes using React Router DOM, ensuring only authenticated users can access the dashboard.
- **User Experience**: Includes features like dark/light mode contextual theming, robust form handling, and toast notifications.

## 🛠️ Tech Stack

**Backend:**
- Java 25
- Spring Boot 4.0.3 (Web, Data JPA, Security)
- MySQL
- Flyway (Database Migrations)
- JWT (io.jsonwebtoken)
- Lombok & MapStruct
- Maven

**Frontend:**
- React 19
- Vite
- TypeScript
- Tailwind CSS 4
- React Router DOM
- Zustand
- TanStack React Query
- Axios
- Lucide React (Icons)

## 📋 Prerequisites

Before you begin, ensure you have the following installed on your machine:
- [Java Development Kit (JDK) 25](https://jdk.java.net/)
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [MySQL Server](https://www.mysql.com/)
- [Maven](https://maven.apache.org/) (optional, can use included wrapper)

## ⚙️ Setup and Installation

### 1. Database Configuration
Ensure your MySQL server is running. The application is configured to create the database if it doesn't exist using Flyway. 

The default configuration expects:
- **Username**: `root`
- **Password**: `admin`
- **Database URL**: `jdbc:mysql://localhost:3306/emp_db`

*Note: Update credentials in `pom.xml` (for Flyway plugin) and `src/main/resources/application.properties` if your local MySQL setup differs.*

### 2. Backend Setup
1. Navigate to the project root directory.
2. Run the application using the Maven wrapper:
   ```bash
   ./mvnw spring-boot:run
   ```
   *The backend server will typically start on `http://localhost:8080`.*

### 3. Frontend Setup
1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd frontend-react
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
   *The React application will be available at `http://localhost:5173`.*

## 🖇️ API Endpoints Summary

### Authentication (`/api/auth`)
- `POST /login` - Authenticate user and get JWT
- `POST /register` - Register a new user

### Employees (`/api/employees`)
- `GET /` - Retrieve all employees
- `GET /{id}` - Retrieve employee by ID
- `POST /` - Create a new employee (ADMIN only)
- `PUT /{id}` - Update an employee (ADMIN only)
- `DELETE /{id}` - Delete an employee (ADMIN only)
- `GET /statistics/average-salary` - Get average employee salary
- `GET /statistics/average-age` - Get average employee age
