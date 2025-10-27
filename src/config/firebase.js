const admin = require('firebase-admin');

/**
 * Firebase Admin SDK Configuration
 * Used for verifying Firebase Authentication tokens
 */

// Initialize Firebase Admin SDK
try {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    }),
  });

  console.log('✅ Firebase Admin SDK initialized');
} catch (error) {
  console.error('❌ Error initializing Firebase Admin SDK:', error.message);
  throw error;
}

module.exports = admin;
