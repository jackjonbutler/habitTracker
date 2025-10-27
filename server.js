require('dotenv').config();
const app = require('./src/app');
const connectDB = require('./src/config/database');

/**
 * Server Entry Point
 * Starts the Express server and connects to MongoDB
 */

const PORT = process.env.PORT || 3000;

// Connect to MongoDB
connectDB();

// Start server
const server = app.listen(PORT, () => {
  console.log(`
  ╔════════════════════════════════════════════════╗
  ║                                                ║
  ║   🏠 Habit Tracker API Server Running          ║
  ║                                                ║
  ║   Port: ${PORT}                                   ║
  ║   Environment: ${process.env.NODE_ENV || 'development'}                    ║
  ║   MongoDB: Connected                           ║
  ║                                                ║
  ║   API Endpoints:                               ║
  ║   - Health: http://localhost:${PORT}/api/health   ║
  ║   - Auth: http://localhost:${PORT}/api/auth       ║
  ║   - Users: http://localhost:${PORT}/api/users     ║
  ║   - Habits: http://localhost:${PORT}/api/habits   ║
  ║   - Check-ins: http://localhost:${PORT}/api/checkins ║
  ║   - Streaks: http://localhost:${PORT}/api/streaks ║
  ║                                                ║
  ╚════════════════════════════════════════════════╝
  `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('\nSIGINT signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Promise Rejection:', err);
  server.close(() => {
    process.exit(1);
  });
});
