const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('express-async-errors'); // Automatically catch async errors

const errorHandler = require('./middleware/errorHandler');

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const habitRoutes = require('./routes/habits');
const checkInRoutes = require('./routes/checkins');
const streakRoutes = require('./routes/streaks');

/**
 * Express Application Setup
 */

const app = express();

// Security middleware
app.set('trust proxy', 1);
app.use(helmet());

// CORS configuration for FlutterFlow frontend
app.use(cors({
  origin: '*', // Allow all origins for development
  credentials: true,
}));

// Request logging
app.use(morgan(process.env.NODE_ENV === 'development' ? 'dev' : 'combined'));

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting for check-in endpoint
const checkInLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: 100, // Max 5 check-ins per day
  message: {
    error: 'Too many check-ins today. Maximum 5 check-ins per day allowed.',
    status: 429,
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Skip successful requests
  skipSuccessfulRequests: false,
});

// General rate limiter for API
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Max 100 requests per 15 minutes
  message: {
    error: 'Too many requests from this IP, please try again later.',
    status: 429,
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply general rate limiter to all routes
app.use('/api/', apiLimiter);

// Health check endpoint (no auth required)
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/habits', habitRoutes);
app.use('/api/checkins', checkInLimiter, checkInRoutes); // Apply check-in rate limiter
app.use('/api/streaks', streakRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    message: 'Habit Tracker API',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth',
      users: '/api/users',
      habits: '/api/habits',
      checkins: '/api/checkins',
      streaks: '/api/streaks',
    },
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Route not found',
    status: 404,
    path: req.path,
  });
});

// Global error handler (must be last)
app.use(errorHandler);

module.exports = app;
