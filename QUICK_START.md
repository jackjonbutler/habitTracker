# Quick Start Guide - Habit Tracker Backend

Get your habit tracker backend running in under 10 minutes!

## ⚡ Quick Setup (5 Steps)

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Set Up Environment Variables

```bash
cp .env.example .env
```

Edit `.env` and add your credentials:
- MongoDB URI (local or Atlas)
- Firebase Admin SDK credentials
- Cloudflare R2 credentials
- Anthropic API key

### 3. Start MongoDB

**Local:**
```bash
mongod
```

**Or use MongoDB Atlas** and update `MONGODB_URI` in `.env`

### 4. Run the Server

```bash
npm run dev
```

Server starts at: `http://localhost:3000`

### 5. Test the API

```bash
curl http://localhost:3000/api/health
```

You should see:
```json
{
  "status": "healthy",
  "timestamp": "2025-01-20T10:30:00.000Z",
  "uptime": 5.123,
  "environment": "development"
}
```

## 🔑 Getting Your Credentials

### Firebase Admin SDK (5 minutes)

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project (or create one)
3. Click ⚙️ Settings → Project Settings
4. Go to "Service Accounts" tab
5. Click "Generate New Private Key"
6. Download the JSON file
7. Copy these values to `.env`:
   - `FIREBASE_PROJECT_ID`: project_id from JSON
   - `FIREBASE_PRIVATE_KEY`: private_key from JSON (keep the \n)
   - `FIREBASE_CLIENT_EMAIL`: client_email from JSON

### Cloudflare R2 (5 minutes)

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Navigate to R2 Storage
3. Click "Create Bucket"
4. Name it (e.g., `habit-tracker-images`)
5. Go to "Manage R2 API Tokens"
6. Create token with Read & Write permissions
7. Copy to `.env`:
   - Account ID (from R2 overview page)
   - Access Key ID
   - Secret Access Key
   - Bucket name
   - Public URL (e.g., `https://[bucket-name].r2.dev`)

**Enable Public Access:**
- Go to your bucket settings
- Enable "Public Access" or set up custom domain

### Anthropic API Key (2 minutes)

1. Go to [Anthropic Console](https://console.anthropic.com)
2. Sign up or log in
3. Navigate to API Keys
4. Create a new API key
5. Copy to `.env` as `ANTHROPIC_API_KEY`

### MongoDB Atlas (Optional - 5 minutes)

If you don't have MongoDB installed locally:

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free cluster
3. Create a database user
4. Whitelist your IP (or use 0.0.0.0/0 for development)
5. Get connection string
6. Add to `.env` as `MONGODB_URI`

## 🧪 Testing the Complete Flow

### 1. Get a Firebase Token

From your Flutter/web app, after user signs in:
```javascript
const token = await user.getIdToken();
```

### 2. Test Authentication

```bash
curl -X POST http://localhost:3000/api/auth/verify \
  -H "Authorization: Bearer YOUR_FIREBASE_TOKEN"
```

### 3. Create a Habit

```bash
curl -X POST http://localhost:3000/api/habits \
  -H "Authorization: Bearer YOUR_FIREBASE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"habitName": "Make my bed"}'
```

### 4. Upload Check-in Photo

```bash
curl -X POST http://localhost:3000/api/checkins \
  -H "Authorization: Bearer YOUR_FIREBASE_TOKEN" \
  -F "image=@/path/to/bed-photo.jpg"
```

### 5. Check Your Streak

```bash
curl http://localhost:3000/api/streaks/current \
  -H "Authorization: Bearer YOUR_FIREBASE_TOKEN"
```

## 📱 Connect to FlutterFlow

### 1. In FlutterFlow, add API Group

- Base URL: `http://localhost:3000/api` (or your deployed URL)
- Add header: `Authorization: Bearer [auth_token]`

### 2. Create API Calls

**Verify Auth:**
- Method: POST
- Path: `/auth/verify`
- Headers: Authorization: Bearer [Firebase Token]

**Create Check-in:**
- Method: POST
- Path: `/checkins`
- Headers: Authorization: Bearer [Firebase Token]
- Body Type: Multipart
- Add file field: `image`

**Get Profile:**
- Method: GET
- Path: `/users/profile`
- Headers: Authorization: Bearer [Firebase Token]

## 🐛 Common Issues & Fixes

### "MongoDB connection error"
**Fix:** Make sure MongoDB is running or check Atlas connection string

### "Firebase auth error: invalid token"
**Fix:** Verify your Firebase private key has literal `\n` characters in `.env`

### "Image upload fails"
**Fix:** Check R2 bucket name and ensure public access is enabled

### "ANTHROPIC_API_KEY not found"
**Fix:** Make sure you've added your API key to `.env` file

## 🚀 Deploy to Production

### Quick Deploy to Railway

1. Create account at [Railway](https://railway.app)
2. Click "New Project" → "Deploy from GitHub"
3. Connect your repository
4. Add environment variables
5. Deploy!

Railway will:
- Auto-detect Node.js
- Run `npm install`
- Start with `npm start`

### Environment Variables for Production

Set these in your hosting platform:
- `NODE_ENV=production`
- `PORT=3000`
- All credentials from `.env`
- Set `CORS` origin to your frontend URL

## 📊 Monitor Your Backend

### View Logs

```bash
# Development
npm run dev

# Production with PM2
pm2 logs habit-tracker
```

### Check Health

```bash
curl http://localhost:3000/api/health
```

### Database Queries

```bash
# Connect to MongoDB
mongosh

# Use database
use habit-tracker

# View users
db.users.find().pretty()

# View check-ins
db.checkins.find().limit(5).pretty()
```

## 🎯 Next Steps

1. ✅ Backend running locally
2. ✅ Test with sample requests
3. 📱 Connect FlutterFlow frontend
4. 🎨 Customize gamification rules
5. 🚀 Deploy to production
6. 📊 Add analytics
7. 🔔 Add push notifications

## 📚 Additional Resources

- Full API Documentation: `README.md`
- API Examples: `API_EXAMPLES.md`
- Code Documentation: Inline comments in source files

## 💡 Pro Tips

1. **Use ngrok for mobile testing:**
   ```bash
   ngrok http 3000
   ```
   Then use the ngrok URL in your mobile app

2. **Test AI verification:**
   Upload different images to see how Claude verifies them

3. **Check rate limits:**
   Try uploading 6 times in a day to test rate limiting

4. **Monitor streak logic:**
   Check in daily to see streaks increment properly

## 🆘 Need Help?

- Check `README.md` for detailed documentation
- Review error logs in terminal
- Check MongoDB for data issues
- Verify environment variables
- Test endpoints with curl or Postman

---

**Ready to build habits!** 🏠✨

The backend is now running and ready to track daily check-ins, calculate streaks, and award points. Start building your frontend!
