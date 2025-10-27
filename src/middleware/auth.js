const admin = require('../config/firebase');

/**
 * Firebase Authentication Middleware
 * Verifies Firebase ID tokens and attaches user info to request
 */

const authenticateUser = async (req, res, next) => {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Unauthorized - No token provided',
        status: 401,
      });
    }

    const token = authHeader.split('Bearer ')[1];

    // Verify the token with Firebase Admin SDK
    const decodedToken = await admin.auth().verifyIdToken(token);
    
    // Attach user info to request object
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      displayName: decodedToken.name || decodedToken.email,
    };

    next();
  } catch (error) {
    console.error('Authentication error:', error.message);
    
    // Handle specific Firebase auth errors
    if (error.code === 'auth/id-token-expired') {
      return res.status(401).json({
        error: 'Token expired - Please sign in again',
        status: 401,
      });
    }
    
    if (error.code === 'auth/id-token-revoked') {
      return res.status(401).json({
        error: 'Token revoked - Please sign in again',
        status: 401,
      });
    }

    return res.status(401).json({
      error: 'Unauthorized - Invalid token',
      status: 401,
    });
  }
};

module.exports = authenticateUser;