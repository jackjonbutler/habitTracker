# Habit Tracker Backend - Project Summary

## 📦 What's Included

This is a **complete, production-ready** Node.js backend for a habit tracking MVP application. Everything you need is included and ready to deploy.

## 🎯 Core Features Implemented

✅ **Authentication**
- Firebase Admin SDK integration
- JWT token verification middleware
- Automatic user creation/update on first login

✅ **Habit Management**
- Create, read, update, delete habits
- MVP: One active habit per user
- Customizable reminders and settings

✅ **Check-in System**
- Photo upload to Cloudflare R2
- AI-powered image verification using Claude Vision
- Duplicate check-in prevention
- Rate limiting (5 check-ins per day)

✅ **Streak Tracking**
- Automatic streak calculation
- Consecutive day tracking
- Streak break detection
- Historical streak records

✅ **Gamification**
- Points system with bonuses
- Level progression
- Milestone rewards (7, 30, 100, 365 days)
- Leaderboard functionality

✅ **Security & Performance**
- Helmet.js security headers
- CORS configuration
- Rate limiting
- Input validation
- Error handling
- Request logging

## 📊 Technology Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: Firebase Admin SDK
- **Storage**: Cloudflare R2 (S3-compatible)
- **AI**: Anthropic Claude API
- **File Upload**: Multer
- **Security**: Helmet, CORS, Rate Limiting

## 📁 Project Structure

```
backend/
├── src/
│   ├── config/           # Configuration files
│   │   ├── database.js
│   │   ├── firebase.js
│   │   ├── storage.js
│   │   └── anthropic.js
│   ├── middleware/       # Express middleware
│   │   ├── auth.js
│   │   ├── errorHandler.js
│   │   └── validation.js
│   ├── models/          # Mongoose schemas
│   │   ├── User.js
│   │   ├── Habit.js
│   │   ├── CheckIn.js
│   │   └── Streak.js
│   ├── routes/          # API endpoints
│   │   ├── auth.js
│   │   ├── users.js
│   │   ├── habits.js
│   │   ├── checkins.js
│   │   └── streaks.js
│   ├── services/        # Business logic
│   │   ├── streakService.js
│   │   ├── imageService.js
│   │   └── verificationService.js
│   ├── utils/           # Helper functions
│   │   ├── pointsCalculator.js
│   │   └── dateHelpers.js
│   └── app.js           # Express app configuration
├── server.js            # Entry point
├── package.json         # Dependencies
├── .env.example         # Environment template
├── .gitignore
├── README.md            # Full documentation
├── QUICK_START.md       # Quick setup guide
├── API_EXAMPLES.md      # API examples
└── DEPLOYMENT_CHECKLIST.md
```

## 🚀 Getting Started (3 Steps)

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
```bash
cp .env.example .env
# Edit .env with your credentials
```

### 3. Start Server
```bash
npm run dev
```

## 🔑 Required Credentials

You'll need:
1. **MongoDB** - Local or Atlas (free tier)
2. **Firebase Admin SDK** - From Firebase Console
3. **Cloudflare R2** - Free tier available
4. **Anthropic API Key** - From console.anthropic.com

See `QUICK_START.md` for detailed instructions on getting each credential.

## 📚 Documentation Files

| File | Purpose |
|------|---------|
| `README.md` | Complete documentation with API details |
| `QUICK_START.md` | 5-minute setup guide |
| `API_EXAMPLES.md` | Request/response examples for all endpoints |
| `DEPLOYMENT_CHECKLIST.md` | Production deployment guide |

## 🎮 How It Works

### User Flow
1. User authenticates with Firebase → Backend verifies token
2. User creates habit → Stored in MongoDB
3. User uploads photo → Uploaded to R2, verified by Claude AI
4. Check-in created → Streak updated, points awarded
5. User views progress → Stats, streaks, and level displayed

### Points Calculation
- Base: 10 points per check-in
- Streak: +5 points per day (max +50)
- Milestones: 7d(+50), 30d(+200), 100d(+1000), 365d(+5000)

### Level Calculation
- Level = floor(totalPoints / 500) + 1
- Each level requires 500 more points

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/verify` - Verify Firebase token

### Users
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update profile
- `GET /api/users/stats` - Get statistics

### Habits
- `POST /api/habits` - Create habit
- `GET /api/habits` - Get user's habits
- `GET /api/habits/:id` - Get specific habit
- `PUT /api/habits/:id` - Update habit

### Check-ins
- `POST /api/checkins` - Create check-in with photo
- `GET /api/checkins` - Get paginated check-ins
- `GET /api/checkins/today` - Check today's status
- `GET /api/checkins/:id` - Get specific check-in

### Streaks
- `GET /api/streaks/current` - Get current streak
- `GET /api/streaks/stats` - Get streak statistics
- `GET /api/streaks/history` - Get past streaks
- `GET /api/streaks/leaderboard` - Get top users

### Health
- `GET /api/health` - Server health check (no auth)

## 🛡️ Security Features

- Firebase token verification on all protected routes
- Rate limiting: 5 check-ins per day, 100 requests per 15 min
- Input validation for all requests
- File type and size validation
- CORS configured for specific origins
- Helmet.js security headers
- Error messages don't expose internals

## 📊 Database Schema

### User
- Firebase UID, email, display name
- Current/longest streak
- Total points and level
- Last check-in date

### Habit
- User reference
- Habit name and description
- Reminder time
- Active status

### CheckIn
- User and habit references
- Image URL and key
- Verification status (pending/verified/rejected)
- AI verification note
- Points earned
- Check-in date

### Streak
- User and habit references
- Start/end dates
- Streak length
- Active status

## 🎯 MVP Features

✅ Single habit per user
✅ Daily photo check-ins
✅ AI bed verification
✅ Automatic streak tracking
✅ Points and levels
✅ Milestone rewards
✅ Check-in history
✅ User profiles

## 🔮 Future Enhancements

Ideas for v2:
- Multiple habits per user
- Social features (friends, challenges)
- Habit categories and templates
- Advanced analytics
- Push notifications
- Email reminders
- Habit insights and patterns
- Achievement badges
- Custom streak rules
- Data export

## 📱 Frontend Integration

This backend is designed to work with:
- FlutterFlow mobile apps
- React/Vue/Angular web apps
- iOS/Android native apps
- Any REST API client

### Integration Steps
1. Configure your frontend API base URL
2. Implement Firebase authentication
3. Store Firebase token for API calls
4. Call endpoints with `Authorization: Bearer [token]`
5. Handle multipart/form-data for image uploads

## 🚀 Deployment Options

Recommended platforms:
- **Railway** - Easiest, auto-deploy from GitHub
- **Render** - Simple, free tier available
- **Fly.io** - Global edge network
- **AWS/GCP/Azure** - Full control
- **DigitalOcean** - Simple droplets

See `DEPLOYMENT_CHECKLIST.md` for complete guide.

## 📈 Production Considerations

Before launching:
- [ ] Set `NODE_ENV=production`
- [ ] Configure CORS for frontend domain
- [ ] Use production MongoDB (Atlas recommended)
- [ ] Set up monitoring (UptimeRobot, Sentry)
- [ ] Configure logging
- [ ] Test all endpoints
- [ ] Load test critical paths
- [ ] Set up backups
- [ ] Document emergency procedures

## 🧪 Testing

### Manual Testing
```bash
# Health check
curl http://localhost:3000/api/health

# Full flow - see API_EXAMPLES.md
```

### Test Users
Create test accounts in Firebase Console to test authentication.

## 💡 Best Practices Implemented

✅ Environment variables for configuration
✅ Separation of concerns (routes/services/models)
✅ Error handling middleware
✅ Input validation
✅ Database indexing
✅ Async error handling
✅ Request logging
✅ Security headers
✅ Rate limiting
✅ Code documentation

## 🐛 Troubleshooting

Common issues and solutions:

**MongoDB Connection Failed**
- Check MongoDB is running
- Verify connection string
- Check network access (Atlas)

**Firebase Auth Error**
- Verify private key formatting
- Check project ID matches
- Ensure service account permissions

**Image Upload Error**
- Verify R2 credentials
- Check bucket permissions
- Ensure public access enabled

**AI Verification Not Working**
- Check Anthropic API key
- Verify image is accessible
- Check API quotas

See `README.md` troubleshooting section for more.

## 📞 Support

- Documentation: See README.md
- Examples: See API_EXAMPLES.md
- Quick Setup: See QUICK_START.md
- Deployment: See DEPLOYMENT_CHECKLIST.md

## 📄 License

ISC License - Feel free to use and modify for your projects.

## 🎉 You're Ready!

This backend is complete and production-ready. Follow the Quick Start guide to get up and running in minutes.

**Key Files to Start With:**
1. `QUICK_START.md` - Get running fast
2. `.env.example` - Configure your environment
3. `API_EXAMPLES.md` - Test the API
4. `DEPLOYMENT_CHECKLIST.md` - Deploy to production

Happy habit tracking! 🏠✨

---

**Questions?** Check the documentation or test the API endpoints to see it in action.

**Next Steps:**
1. Run `npm install`
2. Configure `.env`
3. Start server with `npm run dev`
4. Test with curl or Postman
5. Connect your frontend
6. Deploy to production
