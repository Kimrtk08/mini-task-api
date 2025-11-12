# Mini Task API

RESTful API สำหรับระบบจัดการงาน (Task Management) พัฒนาด้วย Node.js, Express.js และ MySQL พร้อมระบบ Authentication, Authorization, Rate Limiting และ Idempotency Deploy ด้วย Docker

---

## 🚀 Installation

### 1. Clone Repository

```bash
git clone https://github.com/Kimrtk08/mini-task-api
cd mini-task-api
```

### 2. ตรวจสอบโครงสร้างไฟล์

ตรวจสอบว่ามีไฟล์ครบถ้วนตามโครงสร้างนี้:

```
mini-task-api/
├── src/
│   ├── config/
│   │   └── database.js
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── task.controller.js
│   │   └── user.controller.js
│   ├── middleware/
│   │   ├── abac.js
│   │   ├── authenticate.js
│   │   ├── authorize.js
│   │   ├── errorHandler.js
│   │   ├── idempotency.js
│   │   └── rateLimiter.js
│   ├── models/
│   │   ├── task.model.js
│   │   └── user.model.js
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── task.routes.v1.js
│   │   ├── task.routes.v2.js
│   │   └── user.routes.js
│   └── app.js
├── docker-compose.yml
├── Dockerfile
├── init.sql
├── package.json
├── server.js
├── .env.example
├── .gitignore
├── README.md
└── API.md
```

---

## ▶️ Running the Application

### วิธีที่ 1: ใช้ Docker Compose (แนะนำ)

```bash
# 1. รัน containers ทั้งหมด
docker-compose up -d --build

# 2. ตรวจสอบสถานะ containers
docker-compose ps

# 2. เพื่่อดูว่า เว็บมีปัญหามั้ย
docker-compose logs app


### ตรวจสอบว่า API พร้อมใช้งาน
```
```bash
# 1. เพื่่อดูว่า เว็บมีปัญหามั้ย
docker-compose logs app
```

### เข้าใช้งาน Services

- **API Server:** http://localhost:3000
- **phpMyAdmin:** http://localhost:8080
- **MySQL Database:** localhost:3306

### phpMyAdmin Login

```
Server: phpmyadmin
Username: root
Password: rootpassword

หรือ
Server: db
Username: taskuser
Password: taskpassword
```


---

## 📚 API Documentation

### Base URL
```
http://localhost:3000
```

### Authentication

```
Authorization: Bearer <access_token>
```

### Endpoints Overview

#### Authentication
- `POST /api/v1/auth/register` - สมัครสมาชิก
- `POST /api/v1/auth/login` - เข้าสู่ระบบ
- `POST /api/v1/auth/refresh`  - ต่ออายุ token
- `POST /api/v1/auth/logout`  - ออกจากระบบ

#### Users
- `GET /api/v1/users/me`  - ดูข้อมูลตัวเอง
- `PUT /api/v1/users/me`  - แก้ไขข้อมูลตัวเอง
- `DELETE /api/v1/users/me`  - ลบบัญชี
- `GET /api/v1/users` 👑 - ดู users ทั้งหมด (Admin only)

#### Tasks (v1)
- `POST /api/v1/tasks` 🔑 - สร้าง task (ต้องมี Idempotency-Key)
- `GET /api/v1/tasks`  - ดู tasks ทั้งหมด (พร้อม filtering)
- `GET /api/v1/tasks/:id`  - ดู task เดียว
- `PUT /api/v1/tasks/:id`  - แก้ไข task
- `PATCH /api/v1/tasks/:id/status`  - เปลี่ยน status
- `DELETE /api/v1/tasks/:id`  - ลบ task

#### Tasks (v2)
เหมือน v1 แต่ response มี metadata เพิ่มเติม
- Base path: `/api/v2/tasks`

### ทดสอบด้วย Postman

1. Import `Mini-Task-API.postman_collection.json`
2. Import `Local-Development.postman_environment.json`
3. เลือก Environment: "Local Development"
4. ทดสอบ requests ตาม folders

### Test Scenarios

ควรทดสอบทุกกรณีนี้:

#### ✅ Authentication Flow
- Register → Login → Use API → Logout

#### ✅ RBAC (Role-Based Access Control)
- User role: สามารถจัดการ tasks ของตัวเอง
- Premium role: สามารถสร้าง high priority tasks
- Admin role: เข้าถึงทุก resources

#### ✅ ABAC (Attribute-Based Access Control)
- Public task: ทุกคน (authenticated) อ่านได้
- Private task: เฉพาะ owner และ assignee
- Owner: แก้ไข/ลบได้
- Premium subscription: ใช้ premium features ได้

#### ✅ Idempotency
- POST tasks ซ้ำด้วย key เดียวกัน → ได้ task เดิม
- Same key + different body → 409 Conflict

#### ✅ Rate Limiting
- Anonymous: 20 req/15min
- User: 100 req/15min
- Premium: 500 req/15min
- Check headers: X-RateLimit-*

#### ✅ Error Handling
- 400 - Validation errors
- 401 - Unauthorized
- 403 - Forbidden
- 404 - Not found
- 409 - Conflict
- 429 - Rate limit exceeded

---

## 🗄️ Database Schema
### Tables
#### users
```sql
- id (VARCHAR(36), PK)
- email (VARCHAR(255), UNIQUE)
- password (VARCHAR(255)) - hashed
- name (VARCHAR(255))
- role (ENUM: 'user', 'premium', 'admin')
- isPremium (BOOLEAN)
- subscriptionExpiry (DATETIME)
- createdAt (DATETIME)
```

#### tasks
```sql
- id (VARCHAR(36), PK)
- title (VARCHAR(255))
- description (TEXT)
- status (ENUM: 'pending', 'in_progress', 'completed')
- priority (ENUM: 'low', 'medium', 'high')
- ownerId (VARCHAR(36), FK -> users.id)
- assignedTo (VARCHAR(36), FK -> users.id)
- isPublic (BOOLEAN)
- createdAt (DATETIME)
- updatedAt (DATETIME)
```

#### refresh_tokens
```sql
- id (VARCHAR(36), PK)
- userId (VARCHAR(36), FK)
- token (TEXT)
- expiresAt (DATETIME)
- createdAt (DATETIME)
```

#### idempotency_keys
```sql
- idempotencyKey (VARCHAR(255), PK)
- userId (VARCHAR(36), FK)
- requestBody (TEXT)
- responseStatus (INT)
- responseBody (TEXT)
- createdAt (DATETIME)
- expiresAt (DATETIME)
```

#### blacklisted_tokens
```sql
- id (INT, PK, AUTO_INCREMENT)
- token (TEXT)
- expiresAt (DATETIME)
- createdAt (DATETIME)
```

---

## 👥 Test Users

Database มี test users พร้อมใช้งาน:

### Admin
```
Email: admin@test.com
Password: admin123
Role: admin
Premium: Yes
```

### Premium User
```
Email: premium@test.com
Password: premium123
Role: premium
Premium: Yes (expires in 6 months)
```

### Regular User
```
Email: user@test.com
Password: user123
Role: user
Premium: No
```

---

## ❗ Troubleshooting

### ปัญหา: localhost:3000 ไม่ขึ้น
```bash
# ให้ลอง
npm install

# แล้ว Rebuild containers
docker-compose up -d --build
```

```bash
# ดู logs
docker-compose logs

# Rebuild containers
docker-compose up -d --build
```

### ปัญหา: Container ไม่ขึ้น

```bash
# ดู logs
docker-compose logs

# Rebuild containers
docker-compose up -d --build
```

### ปัญหา: Database connection failed

```bash
# ตรวจสอบว่า database container ทำงาน
docker-compose ps

# Restart database
docker-compose restart db

```

### ปัญหา: Port ถูกใช้งานแล้ว

```bash
# ตรวจสอบ port ที่ใช้งาน
lsof -i :3000    # API port
lsof -i :3306    # MySQL port
lsof -i :8080    # phpMyAdmin port

# หยุด process ที่ใช้ port หรือ
# แก้ไข port ใน docker-compose.yml
```

### ปัญหา: Cannot login with test users

```bash
# Re-import database
docker-compose down -v
docker-compose up -d

# รอให้ init.sql ทำงาน
docker-compose logs -f db | grep "ready for connections"
```

### ปัญหา: Token expired

```bash
# ใช้ refresh token endpoint
POST /api/v1/auth/refresh
Body: { "refreshToken": "..." }

# หรือ login ใหม่
POST /api/v1/auth/login
```

### ปัญหา: Rate limit exceeded

```bash
# รอ 15 นาที หรือ
# ใช้ user ที่มี role สูงกว่า (premium/admin)
# หรือ restart containers เพื่อ reset rate limit
docker-compose restart
```

---

