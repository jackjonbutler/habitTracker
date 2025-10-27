# API Request & Response Examples

This document provides complete examples of API requests and responses for testing and integration.

## Table of Contents

- [Authentication](#authentication)
- [User Management](#user-management)
- [Habits](#habits)
- [Check-ins](#check-ins)
- [Streaks](#streaks)

---

## Authentication

### Verify Firebase Token

**Request:**
```http
POST /api/auth/verify
Authorization: Bearer eyJhbGciOiJSUzI1NiIsImtpZCI6Ij...
Content-Type: application/json
```

**Response (200 OK):**
```json
{
  "message": "Authentication successful",
  "user": {
    "id": "6745a1b2c3d4e5f6a7b8c9d0",
    "firebaseUid": "abc123xyz789",
    "email": "user@example.com",
    "displayName": "John Doe",
    "currentStreak": 0,
    "longestStreak": 0,
    "totalPoints": 0,
    "level": 1,
    "createdAt": "2025-01-15T10:30:00.000Z"
  }
}
```

---

## User Management

### Get User Profile

**Request:**
```http
GET /api/users/profile
Authorization: Bearer eyJhbGciOiJSUzI1NiIsImtpZCI6Ij...
```

**Response (200 OK):**
```json
{
  "user": {
    "id": "6745a1b2c3d4e5f6a7b8c9d0",
    "firebaseUid": "abc123xyz789",
    "email": "user@example.com",
    "displayName": "John Doe",
    "currentStreak": 5,
    "longestStreak": 12,
    "totalPoints": 350,
    "level": 1,
    "levelProgress": 70,
    "lastCheckInDate": "2025-01-20T08:15:00.000Z",
    "nextMilestone": {
      "days": 7,
      "reward": 50,
      "name": "1 Week Warrior",
      "daysRemaining": 2
    },
    "createdAt": "2025-01-15T10:30:00.000Z"
  }
}
```

### Update User Profile

**Request:**
```http
PUT /api/users/profile
Authorization: Bearer eyJhbGciOiJSUzI1NiIsImtpZCI6Ij...
Content-Type: application/json

{
  "displayName": "Jane Smith"
}
```

**Response (200 OK):**
```json
{
  "message": "Profile updated successfully",
  "user": {
    "id": "6745a1b2c3d4e5f6a7b8c9d0",
    "displayName": "Jane Smith"
  }
}
```

### Get User Statistics

**Request:**
```http
GET /api/users/stats
Authorization: Bearer eyJhbGciOiJSUzI1NiIsImtpZCI6Ij...
```

**Response (200 OK):**
```json
{
  "stats": {
    "currentStreak": 5,
    "longestStreak": 12,
    "totalPoints": 350,
    "level": 1,
    "totalCheckIns": 15,
    "verifiedCheckIns": 14,
    "daysSinceJoining": 5,
    "lastCheckInDate": "2025-01-20T08:15:00.000Z"
  }
}
```

---

## Habits

### Create Habit

**Request:**
```http
POST /api/habits
Authorization: Bearer eyJhbGciOiJSUzI1NiIsImtpZCI6Ij...
Content-Type: application/json

{
  "habitName": "Make my bed",
  "description": "Start each day with a made bed",
  "reminderTime": "09:00"
}
```

**Response (201 Created):**
```json
{
  "message": "Habit created successfully",
  "habit": {
    "id": "6745a1b2c3d4e5f6a7b8c9d1",
    "habitName": "Make my bed",
    "description": "Start each day with a made bed",
    "reminderTime": "09:00",
    "verificationMethod": "photo",
    "isActive": true,
    "createdAt": "2025-01-15T10:35:00.000Z"
  }
}
```

**Error Response (400 - Already has habit):**
```json
{
  "error": "User already has an active habit. MVP limits one habit per user.",
  "status": 400,
  "existingHabit": {
    "id": "6745a1b2c3d4e5f6a7b8c9d1",
    "habitName": "Make my bed"
  }
}
```

### Get User's Habits

**Request:**
```http
GET /api/habits
Authorization: Bearer eyJhbGciOiJSUzI1NiIsImtpZCI6Ij...
```

**Response (200 OK):**
```json
{
  "habits": [
    {
      "id": "6745a1b2c3d4e5f6a7b8c9d1",
      "habitName": "Make my bed",
      "description": "Start each day with a made bed",
      "reminderTime": "09:00",
      "verificationMethod": "photo",
      "isActive": true,
      "createdAt": "2025-01-15T10:35:00.000Z"
    }
  ]
}
```

### Update Habit

**Request:**
```http
PUT /api/habits/6745a1b2c3d4e5f6a7b8c9d1
Authorization: Bearer eyJhbGciOiJSUzI1NiIsImtpZCI6Ij...
Content-Type: application/json

{
  "reminderTime": "08:30",
  "description": "Make my bed perfectly every morning"
}
```

**Response (200 OK):**
```json
{
  "message": "Habit updated successfully",
  "habit": {
    "id": "6745a1b2c3d4e5f6a7b8c9d1",
    "habitName": "Make my bed",
    "description": "Make my bed perfectly every morning",
    "reminderTime": "08:30",
    "isActive": true
  }
}
```

---

## Check-ins

### Create Check-in (Upload Photo)

**Request:**
```http
POST /api/checkins
Authorization: Bearer eyJhbGciOiJSUzI1NiIsImtpZCI6Ij...
Content-Type: multipart/form-data

Form Data:
  image: [binary file data - made_bed.jpg]
```

**Response (201 Created - First Check-in):**
```json
{
  "message": "Check-in created successfully",
  "checkIn": {
    "id": "6745a1b2c3d4e5f6a7b8c9d2",
    "imageUrl": "https://your-bucket.r2.dev/checkins/6745a1b2c3d4e5f6a7b8c9d0/1705315200000-a1b2c3d4e5f6a7b8.jpg",
    "verificationStatus": "pending",
    "checkInDate": "2025-01-15T00:00:00.000Z",
    "pointsEarned": 10,
    "createdAt": "2025-01-15T08:30:00.000Z"
  },
  "streak": {
    "current": 1,
    "isMilestone": false
  },
  "points": {
    "earned": 10,
    "total": 10,
    "level": 1
  }
}
```

**Response (201 Created - 7 Day Milestone):**
```json
{
  "message": "Check-in created successfully",
  "checkIn": {
    "id": "6745a1b2c3d4e5f6a7b8c9d9",
    "imageUrl": "https://your-bucket.r2.dev/checkins/6745a1b2c3d4e5f6a7b8c9d0/1705920000000-x9y8z7w6v5u4t3s2.jpg",
    "verificationStatus": "pending",
    "checkInDate": "2025-01-22T00:00:00.000Z",
    "pointsEarned": 95,
    "createdAt": "2025-01-22T07:45:00.000Z"
  },
  "streak": {
    "current": 7,
    "isMilestone": true
  },
  "points": {
    "earned": 95,
    "total": 395,
    "level": 1
  }
}
```

**Error Response (400 - Already checked in):**
```json
{
  "error": "Already checked in today",
  "status": 400,
  "checkIn": {
    "id": "6745a1b2c3d4e5f6a7b8c9d2",
    "checkInDate": "2025-01-15T00:00:00.000Z"
  }
}
```

**Error Response (400 - Invalid file type):**
```json
{
  "error": "Invalid file type. Only JPEG, PNG, and WebP images are allowed.",
  "status": 400
}
```

**Error Response (429 - Rate limit exceeded):**
```json
{
  "error": "Too many check-ins today. Maximum 5 check-ins per day allowed.",
  "status": 429
}
```

### Get Check-ins (Paginated)

**Request:**
```http
GET /api/checkins?page=1&limit=10
Authorization: Bearer eyJhbGciOiJSUzI1NiIsImtpZCI6Ij...
```

**Response (200 OK):**
```json
{
  "checkIns": [
    {
      "id": "6745a1b2c3d4e5f6a7b8c9d5",
      "habitName": "Make my bed",
      "imageUrl": "https://your-bucket.r2.dev/checkins/.../image.jpg",
      "verificationStatus": "verified",
      "aiVerificationNote": "The image clearly shows a neatly made bed with smoothed sheets and arranged pillows.",
      "checkInDate": "2025-01-20T00:00:00.000Z",
      "pointsEarned": 45,
      "createdAt": "2025-01-20T08:15:00.000Z"
    },
    {
      "id": "6745a1b2c3d4e5f6a7b8c9d4",
      "habitName": "Make my bed",
      "imageUrl": "https://your-bucket.r2.dev/checkins/.../image2.jpg",
      "verificationStatus": "verified",
      "aiVerificationNote": "The bed appears to be made with neat covers.",
      "checkInDate": "2025-01-19T00:00:00.000Z",
      "pointsEarned": 40,
      "createdAt": "2025-01-19T09:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 15,
    "totalPages": 2,
    "hasMore": true
  }
}
```

### Check Today's Status

**Request:**
```http
GET /api/checkins/today
Authorization: Bearer eyJhbGciOiJSUzI1NiIsImtpZCI6Ij...
```

**Response (200 OK - Has checked in):**
```json
{
  "hasCheckedIn": true,
  "checkIn": {
    "id": "6745a1b2c3d4e5f6a7b8c9d2",
    "imageUrl": "https://your-bucket.r2.dev/checkins/.../image.jpg",
    "verificationStatus": "verified",
    "checkInDate": "2025-01-20T00:00:00.000Z",
    "pointsEarned": 45,
    "createdAt": "2025-01-20T08:15:00.000Z"
  }
}
```

**Response (200 OK - Has not checked in):**
```json
{
  "hasCheckedIn": false,
  "checkIn": null
}
```

---

## Streaks

### Get Current Streak

**Request:**
```http
GET /api/streaks/current
Authorization: Bearer eyJhbGciOiJSUzI1NiIsImtpZCI6Ij...
```

**Response (200 OK):**
```json
{
  "streak": {
    "id": "6745a1b2c3d4e5f6a7b8c9d3",
    "streakLength": 5,
    "startDate": "2025-01-16T00:00:00.000Z",
    "isActive": true,
    "habitName": "Make my bed"
  },
  "nextMilestone": {
    "days": 7,
    "reward": 50,
    "name": "1 Week Warrior",
    "daysRemaining": 2
  },
  "user": {
    "longestStreak": 12
  }
}
```

### Get Streak Statistics

**Request:**
```http
GET /api/streaks/stats
Authorization: Bearer eyJhbGciOiJSUzI1NiIsImtpZCI6Ij...
```

**Response (200 OK):**
```json
{
  "stats": {
    "current": 5,
    "longest": 12,
    "isActive": true,
    "totalStreaks": 3,
    "startDate": "2025-01-16T00:00:00.000Z"
  }
}
```

### Get Streak History

**Request:**
```http
GET /api/streaks/history
Authorization: Bearer eyJhbGciOiJSUzI1NiIsImtpZCI6Ij...
```

**Response (200 OK):**
```json
{
  "streaks": [
    {
      "id": "6745a1b2c3d4e5f6a7b8c9d3",
      "streakLength": 5,
      "startDate": "2025-01-16T00:00:00.000Z",
      "endDate": null,
      "isActive": true
    },
    {
      "id": "6745a1b2c3d4e5f6a7b8c9d8",
      "streakLength": 12,
      "startDate": "2025-01-01T00:00:00.000Z",
      "endDate": "2025-01-12T00:00:00.000Z",
      "isActive": false
    },
    {
      "id": "6745a1b2c3d4e5f6a7b8c9d7",
      "streakLength": 3,
      "startDate": "2024-12-20T00:00:00.000Z",
      "endDate": "2024-12-22T00:00:00.000Z",
      "isActive": false
    }
  ],
  "total": 3
}
```

### Get Leaderboard

**Request:**
```http
GET /api/streaks/leaderboard
Authorization: Bearer eyJhbGciOiJSUzI1NiIsImtpZCI6Ij...
```

**Response (200 OK):**
```json
{
  "leaderboard": [
    {
      "rank": 1,
      "displayName": "Jane Smith",
      "currentStreak": 45,
      "longestStreak": 45,
      "level": 5
    },
    {
      "rank": 2,
      "displayName": "John Doe",
      "currentStreak": 30,
      "longestStreak": 35,
      "level": 4
    },
    {
      "rank": 3,
      "displayName": "Mike Wilson",
      "currentStreak": 22,
      "longestStreak": 28,
      "level": 3
    }
  ]
}
```

---

## Error Responses

### Common Error Formats

**401 Unauthorized:**
```json
{
  "error": "Unauthorized - No token provided",
  "status": 401
}
```

**404 Not Found:**
```json
{
  "error": "User not found",
  "status": 404
}
```

**500 Internal Server Error:**
```json
{
  "error": "Failed to create check-in",
  "status": 500
}
```

**Validation Error:**
```json
{
  "error": "Missing required fields: habitName, description",
  "status": 400
}
```

---

## Testing with cURL

### Complete User Flow

```bash
# 1. Verify authentication
curl -X POST http://localhost:3000/api/auth/verify \
  -H "Authorization: Bearer YOUR_FIREBASE_TOKEN"

# 2. Create habit
curl -X POST http://localhost:3000/api/habits \
  -H "Authorization: Bearer YOUR_FIREBASE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"habitName": "Make my bed", "reminderTime": "09:00"}'

# 3. Upload check-in photo
curl -X POST http://localhost:3000/api/checkins \
  -H "Authorization: Bearer YOUR_FIREBASE_TOKEN" \
  -F "image=@/path/to/bed-photo.jpg"

# 4. Check current streak
curl http://localhost:3000/api/streaks/current \
  -H "Authorization: Bearer YOUR_FIREBASE_TOKEN"

# 5. Get user profile
curl http://localhost:3000/api/users/profile \
  -H "Authorization: Bearer YOUR_FIREBASE_TOKEN"
```

---

## Notes

- All timestamps are in ISO 8601 format (UTC)
- Image URLs are publicly accessible after upload
- AI verification happens asynchronously - status will be `pending` initially
- Rate limits apply per IP address for check-ins (5 per 24 hours)
- File uploads must be multipart/form-data with field name `image`
- Maximum image size is 5MB
- Supported image formats: JPEG, PNG, WebP
