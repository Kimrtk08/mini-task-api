# Mini Task API Documentation

**Base URL:** `http://localhost:3000`

**Version:** v1, v2

---

## Authentication

```
Authorization: Bearer <access_token>
```

---

## Authentication Endpoints

### 1. Register

**POST** `/api/v1/auth/register`

Create a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe"
}
```

**Response:** `201 Created`
```json
{
  "message": "User registered successfully",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "user"
  }
}
```

**Errors:**
- `400` - Email already exists or validation error

---

### 2. Login

**POST** `/api/v1/auth/login`


**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:** `200 OK`
```json
{
  "message": "Login successful",
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "user",
    "isPremium": false
  }
}
```

**Token Expiry:**
- Access Token: 15 นาที
- Refresh Token: 7 วัน

**Errors:**
- `401` - Invalid credentials

---

### 3. Refresh Token

**POST** `/api/v1/auth/refresh`


**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Response:** `200 OK`
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Errors:**
- `401` - Invalid or expired refresh token

---

### 4. Logout

**POST** `/api/v1/auth/logout`


**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Response:** `200 OK`
```json
{
  "message": "Logged out successfully"
}
```

---

## User Endpoints

### 1. Get Current User

**GET** `/api/v1/users/me`

Get authenticated user's profile.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "name": "John Doe",
  "role": "user",
  "isPremium": false,
  "subscriptionExpiry": null,
  "createdAt": "2024-11-11T10:00:00Z"
}
```

---

### 2. Update Current User

**PUT** `/api/v1/users/me`

Update authenticated user's profile.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "name": "Jane Doe",
  "email": "newemail@example.com",
  "password": "newpassword123"
}
```

**Response:** `200 OK`
```json
{
  "message": "User updated successfully",
  "user": {
    "id": "uuid",
    "email": "newemail@example.com",
    "name": "Jane Doe",
    "role": "user",
    "isPremium": false
  }
}
```

---

### 3. Delete Current User

**DELETE** `/api/v1/users/me`

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response:** `200 OK`
```json
{
  "message": "Account deleted successfully"
}
```

---

### 4. Get All Users (Admin Only)

**GET** `/api/v1/users`

Get list of all users.

**Headers:**
```
Authorization: Bearer <admin_access_token>
```

**Response:** `200 OK`
```json
{
  "count": 10,
  "users": [
    {
      "id": "uuid",
      "email": "user@example.com",
      "name": "John Doe",
      "role": "user",
      "isPremium": false,
      "createdAt": "2024-11-11T10:00:00Z"
    }
  ]
}
```

**Errors:**
- `403` - Forbidden (not admin)

---

## Task Endpoints (v1)

### 1. Create Task

**POST** `/api/v1/tasks`

**Headers:**
```
Authorization: Bearer <access_token>
Idempotency-Key: <unique-uuid>
```

**Request Body:**
```json
{
  "title": "Complete project",
  "description": "Finish the API implementation",
  "status": "pending",
  "priority": "high",
  "assignedTo": "user-uuid",
  "isPublic": false
}
```

**Fields:**
- `title` (required): Task title
- `description` (optional): Task description
- `status` (optional): `pending` | `in_progress` | `completed` (default: `pending`)
- `priority` (optional): `low` | `medium` | `high` (default: `medium`)
- `assignedTo` (optional): User ID to assign
- `isPublic` (optional): Boolean (default: `false`)

**Response:** `201 Created`
```json
{
  "message": "Task created successfully",
  "task": {
    "id": "uuid",
    "title": "Complete project",
    "description": "Finish the API implementation",
    "status": "pending",
    "priority": "high",
    "ownerId": "uuid",
    "assignedTo": "uuid",
    "isPublic": false,
    "createdAt": "2024-11-11T10:00:00Z",
    "updatedAt": "2024-11-11T10:00:00Z"
  }
}
```

**Errors:**
- `400` - Missing Idempotency-Key or validation error
- `403` - Premium required for high priority (non-premium users)
- `409` - Conflict (same key, different body)

**Note:** High priority tasks require premium subscription.

---

### 2. Get All Tasks

**GET** `/api/v1/tasks`

Get list of tasks with filtering and pagination.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Query Parameters:**
- `status` (optional): `pending` | `in_progress` | `completed`
- `priority` (optional): `low` | `medium` | `high`
- `assignedTo` (optional): User ID
- `isPublic` (optional): `true` | `false`
- `sort` (optional): `createdAt:asc` | `createdAt:desc` | `updatedAt:asc` | `updatedAt:desc`
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)

**Example:**
```
GET /api/v1/tasks?status=pending&priority=high&page=1&limit=10&sort=createdAt:desc
```

**Response:** `200 OK`
```json
{
  "tasks": [
    {
      "id": "uuid",
      "title": "Task 1",
      "status": "pending",
      "priority": "high",
      "ownerId": "uuid",
      "createdAt": "2024-11-11T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 50,
    "totalPages": 5
  }
}
```

---

### 3. Get Single Task

**GET** `/api/v1/tasks/:id`

Get task details by ID.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "title": "Task 1",
  "description": "Description",
  "status": "pending",
  "priority": "medium",
  "ownerId": "uuid",
  "assignedTo": "uuid",
  "isPublic": false,
  "createdAt": "2024-11-11T10:00:00Z",
  "updatedAt": "2024-11-11T10:00:00Z"
}
```

**Access Control (ABAC):**
- เจ้าของสามารถอ่านได้
- ผู้ใช้ที่ได้รับมอบหมายสามารถอ่านได้
- ทุกคนสามารถอ่านpublic task ได้ (แต่ต้อง authenticated ก่อน)
- ผู้ดูแลระบบสามารถอ่านtaskทั้งหมดได้

**Errors:**
- `403` - Access denied (private task)
- `404` - Task not found

---

### 4. Update Task

**PUT** `/api/v1/tasks/:id`

Full update of task.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "title": "Updated title",
  "description": "Updated description",
  "status": "in_progress",
  "priority": "high",
  "assignedTo": "user-uuid",
  "isPublic": true
}
```

**Response:** `200 OK`
```json
{
  "message": "Task updated successfully",
  "task": { ... }
}
```

**Access Control:**
- Only owner or admin can update

**Errors:**
- `403` - Access denied
- `404` - Task not found

---

### 5. Update Task Status

**PATCH** `/api/v1/tasks/:id/status`

Update only task status (idempotent operation).

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "status": "completed"
}
```

**Response:** `200 OK`
```json
{
  "message": "Task status updated successfully",
  "task": { ... }
}
```

**Note:** This operation is idempotent - calling it multiple times with the same status produces the same result.

---

### 6. Delete Task

**DELETE** `/api/v1/tasks/:id`

Delete a task.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response:** `200 OK`
```json
{
  "message": "Task deleted successfully"
}
```

**Access Control:**
- Only owner or admin can delete

**Errors:**
- `403` - Access denied
- `404` - Task not found

---

## Task Endpoints (v2)

All v2 endpoints work the same as v1 but return additional metadata.

**Base Path:** `/api/v2/tasks`

**Response Difference:**
```json
{
  "id": "uuid",
  "title": "Task 1",
  "status": "pending",
  "metadata": {
    "createdAt": "2024-11-11T10:00:00Z",
    "updatedAt": "2024-11-11T10:00:00Z",
    "version": "v2"
  }
}
```

Endpoints:
- `POST /api/v2/tasks` - Create task
- `GET /api/v2/tasks` - Get all tasks (with metadata)
- `GET /api/v2/tasks/:id` - Get single task (with metadata)
- `PUT /api/v2/tasks/:id` - Update task
- `PATCH /api/v2/tasks/:id/status` - Update status
- `DELETE /api/v2/tasks/:id` - Delete task

---

## Rate Limiting

API implements rate limiting based on user role:

| Role | Limit | Window |
|------|-------|--------|
| Anonymous | 20 requests | 15 minutes |
| User | 100 requests | 15 minutes |
| Premium | 500 requests | 15 minutes |
| Admin | 500 requests | 15 minutes |

**Rate Limit Headers:**
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 87
X-RateLimit-Reset: 1699123456
```

**Error Response:** `429 Too Many Requests`
```json
{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests. Try again in 14 minutes",
    "retryAfter": 840,
    "timestamp": "2024-11-11T10:00:00Z",
    "path": "/api/v1/tasks"
  }
}
```

---

## Error Codes

All errors follow this format:
```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message",
    "details": { ... },
    "timestamp": "2024-11-11T10:00:00Z",
    "path": "/api/v1/endpoint"
  }
}
```

### HTTP Status Codes

| Code | Description |
|------|-------------|
| 200 | OK - Request successful |
| 201 | Created - Resource created |
| 400 | Bad Request - Validation error |
| 401 | Unauthorized - Authentication required/failed |
| 403 | Forbidden - No permission |
| 404 | Not Found - Resource doesn't exist |
| 409 | Conflict - Idempotency key conflict |
| 429 | Too Many Requests - Rate limit exceeded |
| 500 | Internal Server Error |

### Error Codes

| Code | Status | Description |
|------|--------|-------------|
| `VALIDATION_ERROR` | 400 | Invalid input data |
| `UNAUTHORIZED` | 401 | No/invalid token |
| `TOKEN_EXPIRED` | 401 | Token has expired |
| `FORBIDDEN` | 403 | Access denied |
| `ACCESS_DENIED` | 403 | No permission for resource |
| `PREMIUM_REQUIRED` | 403 | Premium subscription required |
| `NOT_FOUND` | 404 | Resource not found |
| `CONFLICT` | 409 | Idempotency key conflict |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Server error |

---

## Authorization

### RBAC (Role-Based Access Control)

Three roles available:

**User:**
- จัดการtaskของตนเอง
- View public tasks ได้ 
- ไม่สามารถสร้างtaskที่มีความสำคัญสูงได้
- Rate limit: 100 คำขอ/15 นาที

**Premium:**
- เหมือนกับ User เลย
- แต่สามารถสร้างtaskที่มีความสำคัญสูงได้
- Rate limit: 500 คำขอ/15 นาที

**Admin:**
- Access all tasks ได้
- สามารถ View/delete ผู้ใช้ทั้งหมดได้
- Full access to all resources
- Rate limit: 500 คำขอ/15 นาที

### ABAC (Attribute-Based Access Control)

Task access rules:

**Read Access:**
- Task is public (`isPublic: true`)
- OR User is owner (`ownerId`)
- OR User is assigned (`assignedTo`)
- OR User is admin

**Write Access:**
- User is owner
- OR User is admin

**High Priority Tasks:**
- Premium subscription active
- OR Admin role

---

## Test Users

Pre-configured test users:

```
Admin:
  email: admin@test.com
  password: admin123
  
Premium:
  email: premium@test.com
  password: premium123
  
User:
  email: user@test.com
  password: user123
```

---