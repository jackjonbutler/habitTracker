# System Architecture

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT APPS                               │
│         (FlutterFlow / React / Mobile / Web)                     │
└────────────────────────┬────────────────────────────────────────┘
                         │ HTTPS / REST API
                         │ Authorization: Bearer <Firebase Token>
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                    EXPRESS.JS SERVER                             │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Middleware Layer                                         │  │
│  │  • CORS                  • Rate Limiting                  │  │
│  │  • Helmet (Security)     • Request Logging               │  │
│  │  • Body Parser           • Error Handler                 │  │
│  └──────────────────────────────────────────────────────────┘  │
│                         │                                        │
│  ┌──────────────────────┴───────────────────────────────────┐  │
│  │  Authentication Middleware                                │  │
│  │  • Verify Firebase Token                                  │  │
│  │  • Attach user to request                                 │  │
│  └──────────────────────┬───────────────────────────────────┘  │
│                         │                                        │
│  ┌──────────────────────┴───────────────────────────────────┐  │
│  │  Route Handlers                                           │  │
│  │  /api/auth  /api/users  /api/habits  /api/checkins       │  │
│  │  /api/streaks                                             │  │
│  └──────────────────────┬───────────────────────────────────┘  │
│                         │                                        │
│  ┌──────────────────────┴───────────────────────────────────┐  │
│  │  Services Layer                                           │  │
│  │  • Streak Service (calculate/update streaks)             │  │
│  │  • Image Service (upload/delete to R2)                   │  │
│  │  • Verification Service (AI image verification)          │  │
│  └──────────────────────┬───────────────────────────────────┘  │
│                         │                                        │
│  ┌──────────────────────┴───────────────────────────────────┐  │
│  │  Models (Mongoose)                                        │  │
│  │  User  |  Habit  |  CheckIn  |  Streak                   │  │
│  └──────────────────────┬───────────────────────────────────┘  │
└─────────────────────────┼────────────────────────────────────────┘
                          │
        ┌─────────────────┼─────────────────┐
        │                 │                 │
        ▼                 ▼                 ▼
   ┌─────────┐      ┌──────────┐     ┌──────────┐
   │ MongoDB │      │ R2 Store │     │ Claude   │
   │         │      │ (Images) │     │ API      │
   └─────────┘      └──────────┘     └──────────┘
```

## Request Flow

### 1. User Authentication Flow

```
Client                Server              Firebase        MongoDB
  │                     │                    │               │
  │ POST /auth/verify   │                    │               │
  ├────────────────────>│                    │               │
  │                     │ Verify Token       │               │
  │                     ├───────────────────>│               │
  │                     │ Token Valid        │               │
  │                     │<───────────────────┤               │
  │                     │                    │               │
  │                     │ Find/Create User   │               │
  │                     ├───────────────────────────────────>│
  │                     │ User Data          │               │
  │                     │<───────────────────────────────────┤
  │ User Profile        │                    │               │
  │<────────────────────┤                    │               │
```

### 2. Check-in Creation Flow

```
Client          Server          R2 Storage      Claude API      MongoDB
  │               │                  │              │              │
  │ POST /checkins│                  │              │              │
  │ (with image)  │                  │              │              │
  ├──────────────>│                  │              │              │
  │               │ Validate         │              │              │
  │               │ Auth & File      │              │              │
  │               │                  │              │              │
  │               │ Upload Image     │              │              │
  │               ├─────────────────>│              │              │
  │               │ Image URL        │              │              │
  │               │<─────────────────┤              │              │
  │               │                  │              │              │
  │               │ Create CheckIn   │              │              │
  │               ├────────────────────────────────────────────────>│
  │               │                  │              │              │
  │               │ Update Streak    │              │              │
  │               ├────────────────────────────────────────────────>│
  │               │                  │              │              │
  │               │ Award Points     │              │              │
  │               ├────────────────────────────────────────────────>│
  │ Success       │                  │              │              │
  │<──────────────┤                  │              │              │
  │               │                  │              │              │
  │               │ [Async] Verify   │              │              │
  │               │ Image            │              │              │
  │               ├─────────────────────────────────>│              │
  │               │ Verification     │              │              │
  │               │ Result           │              │              │
  │               │<─────────────────────────────────┤              │
  │               │                  │              │              │
  │               │ Update Status    │              │              │
  │               ├────────────────────────────────────────────────>│
```

## Data Flow

### Streak Calculation Logic

```
┌─────────────────────────────────────────────────────────────┐
│ New Check-in Created                                         │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
         ┌───────────────────────┐
         │ Get Last Check-in     │
         │ Date from User        │
         └──────────┬────────────┘
                    │
        ┌───────────┴────────────┐
        │                        │
        ▼                        ▼
   [Yesterday]             [Other Day]
        │                        │
        ▼                        ▼
┌──────────────┐          ┌──────────────┐
│ Increment    │          │ Break Streak │
│ Streak       │          │ Start New    │
│ Add Points   │          │ Streak = 1   │
└──────────────┘          └──────────────┘
        │                        │
        └────────────┬───────────┘
                     │
                     ▼
         ┌───────────────────────┐
         │ Update User:          │
         │ • Current Streak      │
         │ • Total Points        │
         │ • Level               │
         │ • Last Check-in Date  │
         └───────────────────────┘
```

### Points Calculation

```
Base Points (10)
     +
Streak Bonus (min(streak * 5, 50))
     +
Milestone Bonus (if applicable)
     ║
     ║  7 days  → +50
     ║  30 days → +200
     ║  100 days→ +1000
     ║  365 days→ +5000
     ║
     ▼
Total Points Earned
     │
     ▼
Update User Total Points
     │
     ▼
Recalculate Level
(Level = floor(totalPoints / 500) + 1)
```

## Database Schema Relationships

```
┌─────────────────┐
│     User        │
│  firebaseUid    │◄────────┐
│  email          │         │
│  currentStreak  │         │
│  totalPoints    │         │
│  level          │         │
└────────┬────────┘         │
         │                  │
         │ 1:N              │ N:1
         │                  │
         ▼                  │
┌─────────────────┐         │
│     Habit       │         │
│  userId         ├─────────┘
│  habitName      │
│  isActive       │
└────────┬────────┘
         │
         │ 1:N
         │
         ├──────────────┬──────────────┐
         │              │              │
         ▼              ▼              ▼
┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│  CheckIn    │  │   Streak    │  │   (Other)   │
│  habitId    │  │  habitId    │  │             │
│  userId     │  │  userId     │  │             │
│  imageUrl   │  │  length     │  │             │
│  status     │  │  isActive   │  │             │
└─────────────┘  └─────────────┘  └─────────────┘
```

## Security Layers

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Network Layer                                             │
│    • HTTPS (TLS/SSL)                                         │
│    • CORS Configuration                                      │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. Application Layer                                         │
│    • Helmet Security Headers                                 │
│    • Rate Limiting (API & Check-in specific)                │
│    • Request Size Limits                                     │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. Authentication Layer                                      │
│    • Firebase Token Verification                             │
│    • User Identity Validation                                │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. Authorization Layer                                       │
│    • Resource Ownership Checks                               │
│    • User-specific Data Access                               │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. Input Validation Layer                                    │
│    • File Type/Size Validation                               │
│    • Request Body Validation                                 │
│    • Sanitization                                            │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│ 6. Data Layer                                                │
│    • MongoDB Connection Encryption                           │
│    • Parameterized Queries (Mongoose)                        │
│    • Access Control                                          │
└─────────────────────────────────────────────────────────────┘
```

## Scalability Considerations

### Current Architecture (MVP)

```
┌──────────────┐
│   Client     │
└──────┬───────┘
       │
       ▼
┌──────────────┐     ┌──────────────┐
│   Server     │────>│   MongoDB    │
│  (Single)    │     │  (Atlas)     │
└──────┬───────┘     └──────────────┘
       │
       ├───────────>┌──────────────┐
       │            │  R2 Storage  │
       │            └──────────────┘
       │
       └───────────>┌──────────────┐
                    │  Claude API  │
                    └──────────────┘
```

### Future Scaling (High Traffic)

```
┌──────────────┐
│   Clients    │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ Load Balancer│
└──────┬───────┘
       │
       ├──────┬──────┬──────┐
       ▼      ▼      ▼      ▼
     [S1]   [S2]   [S3]   [S4]  ← Multiple Server Instances
       │      │      │      │
       └──────┴───┬──┴──────┘
                  │
         ┌────────┴────────┐
         │                 │
         ▼                 ▼
    ┌─────────┐      ┌─────────┐
    │ MongoDB │      │  Redis  │
    │ Cluster │      │ (Cache) │
    └─────────┘      └─────────┘
         │
         ├──────────────────────┐
         │                      │
         ▼                      ▼
    ┌─────────┐          ┌──────────┐
    │R2 Storage│          │Queue (AI)│
    └─────────┘          └──────────┘
```

## Technology Stack Details

```
┌─────────────────────────────────────────────────┐
│ Frontend (Not Included)                          │
│ • FlutterFlow / React / Vue / Angular           │
└─────────────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────┐
│ Backend (This Project)                           │
│ ┌─────────────────────────────────────────────┐ │
│ │ Runtime: Node.js 18+                        │ │
│ │ Framework: Express.js 4                     │ │
│ │ Language: JavaScript (ES6+)                 │ │
│ └─────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────┘
                      │
      ┌───────────────┼───────────────┐
      │               │               │
      ▼               ▼               ▼
┌──────────┐    ┌──────────┐   ┌──────────┐
│ MongoDB  │    │    R2    │   │ Firebase │
│ + ODM    │    │ Storage  │   │   Auth   │
│(Mongoose)│    │(AWS SDK) │   │  Admin   │
└──────────┘    └──────────┘   └──────────┘
      │               │               │
      ▼               ▼               ▼
┌──────────┐    ┌──────────┐   ┌──────────┐
│ Atlas/   │    │Cloudflare│   │ Google   │
│ Local    │    │          │   │ Firebase │
└──────────┘    └──────────┘   └──────────┘
```

## API Design Patterns

### RESTful Endpoints

```
Resource-Based URLs:
/api/{resource}/{id?}/{sub-resource?}

Examples:
GET    /api/users/profile
GET    /api/habits
POST   /api/habits
GET    /api/checkins
POST   /api/checkins
GET    /api/streaks/current
```

### Response Format

```javascript
// Success Response
{
  "message": "...",
  "data": { ... }
}

// Error Response
{
  "error": "...",
  "status": 400
}
```

### Authentication Pattern

```
All protected routes require:
Header: Authorization: Bearer <firebase-token>

Flow:
1. Client gets Firebase token
2. Client includes in request header
3. Server validates with Firebase Admin
4. Server attaches user info to req.user
5. Route handler uses req.user
```

---

This architecture is designed to be:
- **Scalable**: Can handle growth from MVP to production
- **Maintainable**: Clear separation of concerns
- **Secure**: Multiple layers of security
- **Testable**: Modular design enables easy testing
- **Documented**: Each component well-documented
