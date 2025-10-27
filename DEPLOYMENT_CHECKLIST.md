# Production Deployment Checklist

Use this checklist to ensure your backend is production-ready.

## 🔐 Security

- [ ] All environment variables are set in production (not hardcoded)
- [ ] `NODE_ENV=production` is set
- [ ] Firebase private key is properly escaped
- [ ] R2 bucket has appropriate access controls
- [ ] CORS is configured with specific frontend domain (not `*`)
- [ ] Rate limiting is enabled and tested
- [ ] MongoDB connection uses authentication
- [ ] API keys are rotated from development keys
- [ ] HTTPS is enforced (handled by hosting platform)
- [ ] Sensitive data is not logged in production

## 🗄️ Database

- [ ] MongoDB Atlas cluster is created (or production MongoDB is set up)
- [ ] Database connection string is in environment variables
- [ ] Proper indexes are created (auto-created by Mongoose)
- [ ] Backup strategy is in place
- [ ] Database user has appropriate permissions (read/write only)
- [ ] Connection pooling is configured
- [ ] Database is in same region as backend for low latency

## ☁️ Storage (Cloudflare R2)

- [ ] R2 bucket is created for production
- [ ] Public access is properly configured
- [ ] Custom domain is set up (optional but recommended)
- [ ] CORS policy is configured on bucket
- [ ] Lifecycle rules are set for old images (optional)
- [ ] Separate buckets for dev/staging/prod (recommended)

## 🔑 API Keys & Credentials

- [ ] Firebase Admin SDK production credentials are set
- [ ] Anthropic API key is for production account
- [ ] R2 credentials are for production account
- [ ] All credentials are stored securely in hosting platform
- [ ] No `.env` file is committed to repository
- [ ] API key rotation plan is documented

## 🚀 Hosting Platform

- [ ] Choose hosting provider:
  - [ ] Railway
  - [ ] Render
  - [ ] Fly.io
  - [ ] AWS (EC2/ECS)
  - [ ] DigitalOcean
  - [ ] Heroku
  - [ ] Google Cloud Run

- [ ] Auto-deployment from GitHub is set up
- [ ] Environment variables are configured
- [ ] Health check endpoint is monitored
- [ ] Scaling rules are configured (if applicable)
- [ ] Domain name is configured
- [ ] SSL certificate is active

## 📊 Monitoring & Logging

- [ ] Logging service is configured:
  - [ ] CloudWatch (AWS)
  - [ ] LogDNA
  - [ ] Papertrail
  - [ ] Built-in platform logging

- [ ] Error tracking is set up:
  - [ ] Sentry
  - [ ] Rollbar
  - [ ] Built-in error reporting

- [ ] Uptime monitoring:
  - [ ] UptimeRobot
  - [ ] Pingdom
  - [ ] Better Uptime

- [ ] Performance monitoring (optional):
  - [ ] New Relic
  - [ ] DataDog
  - [ ] Application Insights

## ⚡ Performance

- [ ] Response time is < 500ms for most endpoints
- [ ] Image upload is < 5 seconds
- [ ] Database queries are indexed
- [ ] Rate limiting is properly configured
- [ ] Connection pooling is enabled
- [ ] Compression middleware is enabled (add if needed)
- [ ] Caching strategy is implemented (if needed)

## 🧪 Testing

- [ ] All API endpoints tested in production environment
- [ ] File upload tested with various image sizes
- [ ] Firebase authentication tested
- [ ] AI verification tested with real images
- [ ] Streak calculation tested over multiple days
- [ ] Rate limiting tested
- [ ] Error handling tested
- [ ] Edge cases tested (invalid tokens, missing data, etc.)

## 📱 Frontend Integration

- [ ] Frontend API base URL updated to production URL
- [ ] CORS allows frontend domain
- [ ] Firebase authentication works with production credentials
- [ ] Image uploads work from mobile/web
- [ ] All API responses are handled properly
- [ ] Error messages are user-friendly
- [ ] Loading states are implemented

## 📄 Documentation

- [ ] API documentation is up to date
- [ ] Environment variables are documented
- [ ] Deployment process is documented
- [ ] README includes production setup
- [ ] Emergency procedures are documented
- [ ] Team has access to credentials

## 🔄 CI/CD (Optional but Recommended)

- [ ] GitHub Actions or similar is configured
- [ ] Automated tests run on commit
- [ ] Automated deployment on merge to main
- [ ] Staging environment exists
- [ ] Rollback procedure is documented

## 💾 Backup & Recovery

- [ ] Database backups are automated
- [ ] Backup restoration has been tested
- [ ] Image storage backup strategy (R2 has built-in durability)
- [ ] Environment variables are backed up securely
- [ ] Recovery time objective (RTO) is defined
- [ ] Recovery point objective (RPO) is defined

## 🎯 Post-Deployment

- [ ] Run smoke tests
- [ ] Check health endpoint: `/api/health`
- [ ] Test authentication flow
- [ ] Test check-in creation
- [ ] Monitor error rates for 24 hours
- [ ] Check database connections
- [ ] Verify image uploads to R2
- [ ] Test AI verification
- [ ] Monitor response times
- [ ] Check logs for errors

## 🔔 Monitoring Alerts

Set up alerts for:
- [ ] Server downtime
- [ ] High error rates (> 5%)
- [ ] Slow response times (> 2s)
- [ ] High CPU usage (> 80%)
- [ ] High memory usage (> 80%)
- [ ] Database connection issues
- [ ] Failed AI verifications (> 20%)
- [ ] Rate limit hits (track if needed)

## 📈 Metrics to Track

- [ ] Total users
- [ ] Daily active users
- [ ] Check-in completion rate
- [ ] Average streak length
- [ ] AI verification accuracy
- [ ] API response times
- [ ] Error rates
- [ ] Storage usage

## 🆘 Emergency Contacts

Document:
- [ ] Hosting platform support
- [ ] Database administrator
- [ ] Team members with access
- [ ] Escalation procedures

## 🔧 Optional Enhancements

Nice-to-haves for later:
- [ ] Redis for caching
- [ ] Queue system for AI verification (Bull/BullMQ)
- [ ] WebSocket for real-time updates
- [ ] Email notifications
- [ ] Push notifications
- [ ] Admin dashboard
- [ ] Analytics integration
- [ ] A/B testing framework

## ✅ Final Checks

Before going live:
- [ ] All checklist items above are completed
- [ ] Staging environment tested thoroughly
- [ ] Team trained on monitoring and alerts
- [ ] Rollback plan is ready
- [ ] Users are notified of launch
- [ ] Support channels are ready

## 🎉 Launch Day

1. Deploy to production
2. Run smoke tests
3. Monitor for first hour closely
4. Check metrics dashboard
5. Be ready to rollback if needed
6. Celebrate! 🎊

## 📞 Support Resources

- Railway: https://railway.app/help
- MongoDB Atlas: https://support.mongodb.com
- Cloudflare: https://support.cloudflare.com
- Firebase: https://firebase.google.com/support
- Anthropic: https://support.anthropic.com

---

## Quick Deploy Commands

### Railway
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Link project
railway link

# Add environment variables
railway variables set NODE_ENV=production

# Deploy
railway up
```

### Render
```bash
# Push to GitHub
git push origin main

# Render auto-deploys from GitHub
# Configure environment variables in dashboard
```

### Manual Deploy (VPS)
```bash
# SSH to server
ssh user@your-server

# Clone repository
git clone your-repo
cd backend

# Install dependencies
npm install

# Set up environment variables
nano .env

# Install PM2
npm install -g pm2

# Start application
pm2 start server.js --name habit-tracker

# Save PM2 config
pm2 save
pm2 startup
```

---

**Good luck with your deployment!** 🚀

Remember: Start with a small number of test users, monitor closely, and scale up gradually.
