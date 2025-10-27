# Habit Tracker Backend API

A complete Node.js backend for a habit tracking MVP application with daily photo check-ins, streak tracking, and AI-powered image verification using Claude Vision.

## 🚀 Features

- **Firebase Authentication**: Secure user authentication with Firebase Admin SDK
- **Image Upload & Storage**: Cloudflare R2 (S3-compatible) storage for check-in photos
- **AI Verification**: Anthropic Claude API for intelligent bed image verification
- **Streak Tracking**: Automatic calculation and management of daily streaks
- **Gamification**: Points system, levels, and milestone rewards
- **Rate Limiting**: Protection against abuse with configurable rate limits
- **RESTful API**: Clean, well-documented API endpoints

## 📋 Prerequisites

- Node.js >= 18.0.0
- MongoDB (local or Atlas)
- Firebase Project with Admin SDK credentials
- Cloudflare R2 account (or AWS S3)
- Anthropic API key

## 🛠️ Installation

### 1. Clone and Install Dependencies

```bash
cd backend
npm install
```

### 2. Set Up Environment Variables

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` with your credentials:

```env
NODE_ENV=development
PORT=3000

# MongoDB
MONGODB_URI=mongodb://localhost:27017/habit-tracker

# Firebase Admin SDK
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour private key here\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@your-project-id.iam.gserviceaccount.com

# Cloudflare R2
R2_ACCOUNT_ID=your-r2-account-id
R2_ACCESS_KEY_ID=your-access-key
R2_SECRET_ACCESS_KEY=your-secret-key
R2_BUCKET_NAME=habit-tracker-images
R2_PUBLIC_URL=https://your-bucket.r2.dev

# Anthropic Claude API
ANTHROPIC_API_KEY=sk-ant-your-api-key-here
```

### 3. Start MongoDB

If using local MongoDB:

```bash
mongod
```

Or use MongoDB Atlas connection string in `MONGODB_URI`.

### 4. Run the Server

Development mode with auto-reload:

```bash
npm run dev
```

Production mode:

```bash
npm start
```

The server will start at `http://localhost:3000`

## 📚 API Documentation

### Base URL

```
http://localhost:3000/api
```

### Authentication

All protected endpoints require a Firebase ID token in the Authorization header:

```
Authorization: Bearer <firebase-id-token>
```

### Endpoints

#### Health Check

```http
GET /api/health
```

Returns server status (no auth required).

#### Authentication

##### Verify Firebase Token

```http
POST /api/auth/verify
Authorization: Bearer <firebase-id-token>
```

Creates or updates user in database. Returns user profile.

#### Users

##### Get User Profile

```http
GET /api/users/profile
Authorization: Bearer <firebase-id-token>
```

Returns complete user profile with statistics.

##### Update Profile

```http
PUT /api/users/profile
Authorization: Bearer <firebase-id-token>
Content-Type: application/json

{
  "displayName": "John Doe"
}
```

##### Get User Statistics

```http
GET /api/users/stats
Authorization: Bearer <firebase-id-token>
```

#### Habits

##### Create Habit

```http
POST /api/habits
Authorization: Bearer <firebase-id-token>
Content-Type: application/json

{
  "habitName": "Make my bed",
  "description": "Daily bed-making habit",
  "reminderTime": "09:00"
}
```

##### Get User's Habits

```http
GET /api/habits
Authorization: Bearer <firebase-id-token>
```

##### Get Specific Habit

```http
GET /api/habits/:id
Authorization: Bearer <firebase-id-token>
```

##### Update Habit

```http
PUT /api/habits/:id
Authorization: Bearer <firebase-id-token>
Content-Type: application/json

{
  "habitName": "Make my bed perfectly",
  "reminderTime": "08:00"
}
```

#### Check-ins

##### Create Check-in (Upload Photo)

```http
POST /api/checkins
Authorization: Bearer <firebase-id-token>
Content-Type: multipart/form-data

Form Data:
- image: <image file> (required, max 5MB, JPEG/PNG/WebP)
```

**Rate Limit**: 5 check-ins per 24 hours

Response includes:
- Check-in details
- Points earned
- Current streak
- Milestone status

##### Get Check-ins (Paginated)

```http
GET /api/checkins?page=1&limit=30
Authorization: Bearer <firebase-id-token>
```

##### Check Today's Status

```http
GET /api/checkins/today
Authorization: Bearer <firebase-id-token>
```

Returns whether user has checked in today.

##### Get Specific Check-in

```http
GET /api/checkins/:id
Authorization: Bearer <firebase-id-token>
```

#### Streaks

##### Get Current Streak

```http
GET /api/streaks/current
Authorization: Bearer <firebase-id-token>
```

Returns current active streak with milestone information.

##### Get Streak Statistics

```http
GET /api/streaks/stats
Authorization: Bearer <firebase-id-token>
```

##### Get Streak History

```http
GET /api/streaks/history
Authorization: Bearer <firebase-id-token>
```

##### Get Leaderboard

```http
GET /api/streaks/leaderboard
Authorization: Bearer <firebase-id-token>
```

## 🎮 Points & Gamification System

### Points Calculation

- **Base check-in**: 10 points
- **Streak bonus**: +5 points per consecutive day (max +50 at 10+ day streak)
- **Milestone bonuses**:
  - 7 days: +50 bonus points
  - 30 days: +200 bonus points
  - 100 days: +1000 bonus points
  - 365 days: +5000 bonus points

### Level System

Level = floor(totalPoints / 500) + 1

Examples:
- 0-499 points: Level 1
- 500-999 points: Level 2
- 1000-1499 points: Level 3

## 🤖 AI Verification

The system uses Anthropic Claude Vision API to verify that uploaded images show a made bed. The verification process:

1. User uploads image → Status: `pending`
2. Image is uploaded to R2 storage
3. Background task sends image to Claude API
4. Claude analyzes if the bed is made
5. Status updated to `verified` or `rejected`
6. AI explanation stored in `aiVerificationNote`

## 📁 Project Structure

```
backend/
├── src/
│   ├── config/
│   │   ├── database.js          # MongoDB connection
│   │   ├── firebase.js          # Firebase Admin initialization
│   │   ├── storage.js           # R2/S3 client setup
│   │   └── anthropic.js         # Claude API setup
│   ├── middleware/
│   │   ├── auth.js              # Firebase token verification
│   │   ├── errorHandler.js      # Global error handling
│   │   └── validation.js        # Request validation
│   ├── models/
│   │   ├── User.js              # User schema
│   │   ├── Habit.js             # Habit schema
│   │   ├── CheckIn.js           # Check-in schema
│   │   └── Streak.js            # Streak schema
│   ├── routes/
│   │   ├── auth.js              # Authentication routes
│   │   ├── users.js             # User routes
│   │   ├── habits.js            # Habit routes
│   │   ├── checkins.js          # Check-in routes
│   │   └── streaks.js           # Streak routes
│   ├── services/
│   │   ├── streakService.js     # Streak calculation logic
│   │   ├── imageService.js      # Image upload/delete
│   │   └── verificationService.js # AI image verification
│   ├── utils/
│   │   ├── pointsCalculator.js  # Points and level logic
│   │   └── dateHelpers.js       # Date utilities
│   └── app.js                   # Express app setup
├── .env.example
├── .gitignore
├── package.json
└── server.js                    # Entry point
```

## 🔧 Configuration

### Firebase Admin SDK Setup

1. Go to Firebase Console → Project Settings → Service Accounts
2. Click "Generate New Private Key"
3. Download the JSON file
4. Extract the following values for your `.env`:
   - `FIREBASE_PROJECT_ID`: The project ID
   - `FIREBASE_PRIVATE_KEY`: The private_key field (keep the \n characters)
   - `FIREBASE_CLIENT_EMAIL`: The client_email field

### Cloudflare R2 Setup

1. Create an R2 bucket in Cloudflare dashboard
2. Go to R2 → Manage R2 API Tokens
3. Create API token with read/write permissions
4. Set up public access or custom domain for the bucket
5. Update `.env` with:
   - Account ID
   - Access Key ID
   - Secret Access Key
   - Bucket name
   - Public URL

### MongoDB Setup

**Local MongoDB:**
```bash
mongod --dbpath /path/to/data
```

**MongoDB Atlas:**
1. Create cluster at mongodb.com/atlas
2. Create database user
3. Whitelist your IP
4. Get connection string and add to `MONGODB_URI`

## 🧪 Testing the API

### Using cURL

```bash
# Health check
curl http://localhost:3000/api/health

# Verify Firebase token
curl -X POST http://localhost:3000/api/auth/verify \
  -H "Authorization: Bearer YOUR_FIREBASE_TOKEN"

# Create check-in with image
curl -X POST http://localhost:3000/api/checkins \
  -H "Authorization: Bearer YOUR_FIREBASE_TOKEN" \
  -F "image=@/path/to/bed-photo.jpg"
```

### Using Postman

1. Import the API endpoints
2. Set Authorization header: `Bearer <token>`
3. For file uploads, use form-data with key `image`

## 🛡️ Security Features

- **Helmet**: Security headers
- **CORS**: Configured for frontend domain
- **Rate Limiting**: API and check-in specific limits
- **Firebase Auth**: Industry-standard authentication
- **Input Validation**: File type, size, and data validation
- **Error Handling**: Consistent error responses without exposing internals

## 📊 Database Indexes

The following indexes are automatically created for optimal performance:

- `User.firebaseUid`: Unique index
- `Habit.userId` + `Habit.isActive`: Compound index
- `CheckIn.userId` + `CheckIn.checkInDate`: Compound index
- `CheckIn.userId` + `CheckIn.habitId` + `CheckIn.checkInDate`: Compound index
- `Streak.userId` + `Streak.habitId` + `Streak.isActive`: Compound index

## 🚀 Deployment

### Environment Variables for Production

Update `.env` with production values:

```env
NODE_ENV=production
PORT=3000
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/habit-tracker
# ... other production credentials
```

### Recommended Hosting

- **API Server**: Railway, Render, Fly.io, AWS EC2, DigitalOcean
- **Database**: MongoDB Atlas
- **Storage**: Cloudflare R2 (included in free tier)

### PM2 Process Manager

```bash
npm install -g pm2
pm2 start server.js --name habit-tracker
pm2 save
pm2 startup
```

## 🐛 Troubleshooting

### Common Issues

**MongoDB Connection Error:**
- Check MongoDB is running: `mongod`
- Verify connection string in `.env`
- Check network/firewall settings for Atlas

**Firebase Auth Error:**
- Verify private key has literal `\n` characters
- Check Firebase project ID matches
- Ensure service account has proper permissions

**Image Upload Fails:**
- Check R2 credentials are correct
- Verify bucket name and public URL
- Ensure bucket has public read access

**AI Verification Not Working:**
- Verify Anthropic API key is valid
- Check API quota/limits
- Review logs for specific error messages

## 📝 Example Requests

See `examples/` directory for sample requests (to be created) or use the following:

### Complete User Flow

1. **Authenticate**:
```bash
POST /api/auth/verify
```

2. **Create Habit**:
```bash
POST /api/habits
Body: { "habitName": "Make my bed" }
```

3. **Daily Check-in**:
```bash
POST /api/checkins
Form-data: image=<file>
```

4. **View Progress**:
```bash
GET /api/streaks/current
GET /api/users/profile
```

## 🤝 Contributing

This is an MVP project. For improvements:

1. Fork the repository
2. Create a feature branch
3. Commit changes
4. Push to the branch
5. Open a pull request

## 📄 License

ISC License - See LICENSE file for details

## 🙏 Acknowledgments

- Firebase for authentication
- Anthropic for Claude AI
- Cloudflare for R2 storage
- MongoDB for database
- Express.js community

## 📞 Support

For issues or questions:
- Open an issue on GitHub
- Check troubleshooting section above
- Review API documentation

---

Built with ❤️ for habit tracking enthusiasts
