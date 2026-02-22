<div align="center">

# 🧬 GENOSPARK

### A Modern Full-Stack Learning Platform

[![Next.js](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-4.18-000000?style=for-the-badge&logo=express)](https://expressjs.com/)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?style=for-the-badge&logo=prisma)](https://www.prisma.io/)
[![MySQL](https://img.shields.io/badge/MySQL-Database-4479A1?style=for-the-badge&logo=mysql&logoColor=white)](https://www.mysql.com/)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)

*Building scalable learning experiences with modern development practices*

[Features](#-features) • [Installation](#-installation) • [Usage](#-usage) • [API Endpoints](#-api-endpoints) • [Contributing](#-contributing)

</div>

---

## 📋 Overview

**GENOSPARK** is a production-ready full-stack learning platform showcasing modern web development architecture. Built with Next.js on the frontend and Express.js on the backend, it demonstrates best practices in database modeling, RESTful API design, JWT authentication, and scalable application structure.

### Why GENOSPARK?

- 🎯 **Type-Safe Database Access** — Prisma ORM ensures compile-time safety
- ⚡ **40+ API Endpoints** — Full CRUD for all platform resources
- 🔐 **JWT Authentication** — Secure token-based auth with session management
- 🎨 **Component Architecture** — Reusable UI components for rapid development
- 🐳 **Docker Ready** — Containerized MySQL deployment support

---

## ✨ Features

- **Full-Stack Architecture** — Separate Express.js backend and Next.js frontend
- **Database Management** — Prisma ORM with MySQL for robust data handling
- **MVC Backend** — 7 controllers and 7 route files with clean separation of concerns
- **Modern React** — Component-based architecture with hooks, TypeScript, and Tailwind CSS
- **Input Validation** — express-validator with custom schemas
- **Development Tools** — Hot reload, TypeScript support, and Prisma Studio

---

## 🏗️ Project Structure

```
genospark/
├── server/                    # Express.js Backend (Port 5000)
│   ├── src/
│   │   ├── controllers/      # Business logic (7 controllers)
│   │   ├── routes/           # API endpoints (7 route files)
│   │   ├── middleware/       # JWT authentication & validation
│   │   ├── utils/            # Validators, JWT, response handlers
│   │   ├── config/           # Database config
│   │   └── index.ts          # Server entry point
│   ├── prisma/
│   │   └── schema.prisma     # Database models (8 models)
│   ├── .env
│   ├── .env.example
│   └── package.json
│
├── client/                    # Next.js Frontend (Port 3000)
│   ├── app/                  # Next.js app directory
│   ├── components/           # React components
│   ├── lib/
│   │   └── api-client.ts     # Axios client (40+ API methods)
│   ├── styles/               # Tailwind CSS
│   ├── .env.local
│   ├── next.config.mjs
│   ├── tailwind.config.ts
│   └── package.json
│
├── docker-compose.yml        # MySQL database container
├── .gitignore
└── README.md
```

---

## 🛠️ Tech Stack

| Category | Technology |
|----------|-----------|
| **Frontend Framework** | Next.js 14 |
| **Frontend Library** | React 19 |
| **Type System** | TypeScript 5.3 |
| **HTTP Client** | Axios 1.7 |
| **CSS Framework** | Tailwind CSS 3.4 |
| **UI Components** | Radix UI |
| **Backend Framework** | Express.js 4.18 |
| **Backend Runtime** | Node.js 18+ |
| **ORM** | Prisma 5.7 |
| **Database** | MySQL 8.0 |
| **Authentication** | JWT (jsonwebtoken) |
| **Password Hashing** | bcryptjs 2.4 |
| **Containerization** | Docker |

---

## 🚀 Installation

### Prerequisites

Before you begin, ensure you have the following installed:

- [Node.js](https://nodejs.org/) (v18.0 or higher)
- [Docker](https://www.docker.com/) (for MySQL)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)
- [Git](https://git-scm.com/)

### Step 1: Clone the Repository

```bash
git clone https://github.com/AmitC04/GENOSPARK.git
cd GENOSPARK
```

### Step 2: Start MySQL Database

```bash
docker-compose up -d
```

> ✅ MySQL runs on port `3306` | Database: `genospark` | User: `genospark_user`

### Step 3: Setup Backend

```bash
cd server

# Install dependencies
npm install

# Generate Prisma Client
npm run prisma:generate

# Create database tables
npm run prisma:push

# Start backend server
npm run dev
```

> ✅ Backend running on `http://localhost:5000`

### Step 4: Setup Frontend

```bash
cd client

# Install dependencies
npm install

# Start frontend development server
npm run dev
```

> ✅ Frontend running on `http://localhost:3000`

### Environment Configuration

**Server (`server/.env`)**

```env
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:3000
DATABASE_URL="mysql://genospark_user:genospark_password@localhost:3306/genospark"
JWT_SECRET="your-jwt-secret-key"
REFRESH_TOKEN_SECRET="your-refresh-token-secret"
```

**Frontend (`client/.env.local`)**

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

> ⚠️ **Important**: Never commit your `.env` files to version control!

---

## 📖 Usage

### Development Commands

**Backend**
```bash
npm run dev              # Start dev server with hot reload
npm run build            # Build TypeScript to JavaScript
npm start                # Run production server
npm run lint             # Run ESLint
```

**Frontend**
```bash
npm run dev              # Start dev server
npm run build            # Build for production
npm start                # Run production server
npm run lint             # Run linter
```

**Docker**
```bash
docker-compose up -d     # Start MySQL in background
docker-compose down      # Stop MySQL
docker-compose logs      # View logs
```

### Prisma Commands

```bash
npm run prisma:generate  # Generate Prisma Client
npm run prisma:push      # Sync schema to database
npm run prisma:studio    # Open Prisma visual editor (http://localhost:5555)
```

### Making API Calls from Frontend

Use the centralized Axios client:

```typescript
import { apiClient } from '@/lib/api-client';

// Register a user
const response = await apiClient.auth.register({
  name: 'John',
  email: 'john@example.com',
  password: 'pass123'
});

// Get all courses
const courses = await apiClient.courses.getAll({ page: 1, limit: 10 });

// Enroll in a course
await apiClient.enrollments.enroll({ courseId: 1 });
```

All methods are **type-safe** and use proper HTTP verbs.

---

## 📚 Database Schema

View your database schema in `server/prisma/schema.prisma`. The platform includes 8 models:

| Model | Description |
|-------|-------------|
| **User** | Students, instructors, admins |
| **Course** | Learning courses with metadata |
| **Enrollment** | User course enrollments with progress |
| **Order** | Purchase orders |
| **OrderItem** | Items in orders |
| **Review** | Course reviews and ratings |
| **Session** | Device session tracking |
| **Activity** | User activity logging |

---

## 🎯 API Endpoints

All endpoints return a standardized response format:

```json
{
  "success": true,
  "message": "Operation successful",
  "data": {},
  "statusCode": 200
}
```

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/register` | Create account |
| `POST` | `/api/auth/login` | Login |
| `GET` | `/api/auth/profile` | Get profile *(protected)* |
| `PUT` | `/api/auth/profile` | Update profile *(protected)* |

### Courses
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/courses` | List all courses |
| `GET` | `/api/courses/:id` | Get course details |
| `GET` | `/api/courses/stats` | Course statistics |
| `POST` | `/api/courses` | Create course *(admin)* |
| `PUT` | `/api/courses/:id` | Update course *(admin)* |
| `DELETE` | `/api/courses/:id` | Delete course *(admin)* |

### Enrollments
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/enrollments/enroll` | Enroll in course *(protected)* |
| `GET` | `/api/enrollments` | Get user enrollments *(protected)* |
| `PATCH` | `/api/enrollments/:id/progress` | Update progress *(protected)* |

### Orders
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/orders` | Get user orders *(protected)* |
| `POST` | `/api/orders` | Create order *(protected)* |
| `GET` | `/api/orders/:id` | Get order details *(protected)* |

### Reviews
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/reviews/course/:id` | Get course reviews |
| `GET` | `/api/reviews` | Get user reviews *(protected)* |
| `POST` | `/api/reviews` | Create review *(protected)* |
| `PUT` | `/api/reviews/:id` | Update review *(protected)* |
| `DELETE` | `/api/reviews/:id` | Delete review *(protected)* |

### Activities & Sessions
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/activities` | Get user activities *(protected)* |
| `PATCH` | `/api/activities/read-all` | Mark all as read *(protected)* |
| `GET` | `/api/sessions/active` | Get active sessions *(protected)* |
| `DELETE` | `/api/sessions/:id` | End session *(protected)* |
| `POST` | `/api/sessions/logout-all` | End all sessions *(protected)* |

---

## 🐳 Docker Deployment

```bash
# Start MySQL database container
docker-compose up -d

# View container status
docker ps

# Stop containers
docker-compose down
```

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Commit your changes**: `git commit -m 'Add amazing feature'`
4. **Push to the branch**: `git push origin feature/amazing-feature`
5. **Open a Pull Request**

### Development Guidelines

- Follow the existing code style and MVC architecture
- Write meaningful commit messages
- Add tests for new features
- Update documentation as needed
- Run `npm run lint` before committing

---

## 🐛 Troubleshooting

**Problem**: MySQL connection error (`ECONNREFUSED 127.0.0.1:3306`)
```bash
# Solution: Start Docker
docker-compose up -d
```

**Problem**: Prisma Client not generated
```bash
# Solution: Regenerate Prisma Client
cd server
npm install
npm run prisma:generate
```

**Problem**: Port already in use

```bash
# Mac/Linux
lsof -i :3000
kill -9 <PID>

# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

**Problem**: Frontend can't reach API
```bash
# Verify backend is running
curl http://localhost:5000/api/health

# Check client/.env.local has correct API URL
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

---

## 📝 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

## 👨‍💻 Author

**Amit C04**

- GitHub: [@AmitC04](https://github.com/AmitC04)
- Project Link: [GENOSPARK_USER-ACTIVITY]([https://github.com/AmitC04/GENOSPARK](https://github.com/AmitC04/GENOSPARK_USER-ACTIVITY)

---

## 🙏 Acknowledgments

- [Next.js Documentation](https://nextjs.org/docs)
- [Express.js Documentation](https://expressjs.com/)
- [Prisma Documentation](https://www.prisma.io/docs)
- [React Documentation](https://react.dev)

---

## 📊 Project Status

🟢 **Active Development** — This project is actively maintained and updated regularly.

---

<div align="center">

**Made with ❤️ using Next.js, Express.js, and Prisma**

⭐ Star this repo if you find it helpful!

</div>
