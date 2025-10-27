const multer = require('multer');
const path = require('path');

/**
 * Validation Middleware
 * Request validation and file upload configuration
 */

// Configure multer for memory storage (we'll upload to R2 from memory)
const storage = multer.memoryStorage();

// File filter for image uploads
const imageFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, and WebP images are allowed.'), false);
  }
};

// Multer configuration
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max file size
  },
  fileFilter: imageFilter,
});

/**
 * Validate required fields in request body
 */
const validateRequiredFields = (requiredFields) => {
  return (req, res, next) => {
    const missingFields = [];
    
    for (const field of requiredFields) {
      if (!req.body[field]) {
        missingFields.push(field);
      }
    }
    
    if (missingFields.length > 0) {
      return res.status(400).json({
        error: `Missing required fields: ${missingFields.join(', ')}`,
        status: 400,
      });
    }
    
    next();
  };
};

/**
 * Validate date format (YYYY-MM-DD)
 */
const validateDate = (dateString) => {
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  
  if (!regex.test(dateString)) {
    return false;
  }
  
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date);
};

module.exports = {
  upload,
  validateRequiredFields,
  validateDate,
};
