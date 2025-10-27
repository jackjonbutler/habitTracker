const { PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const storageConfig = require('../config/storage');
const crypto = require('crypto');

/**
 * Image Service
 * Handles image upload to and deletion from Cloudflare R2
 */

/**
 * Upload image to R2 storage
 * @param {Buffer} fileBuffer - Image file buffer from multer
 * @param {string} mimetype - File MIME type
 * @param {string} userId - User ID for organizing uploads
 * @returns {Object} - { imageUrl, imageKey }
 */
const uploadImage = async (fileBuffer, mimetype, userId) => {
  try {
    // Generate unique filename
    const timestamp = Date.now();
    const randomString = crypto.randomBytes(8).toString('hex');
    const extension = getExtensionFromMimetype(mimetype);
    const imageKey = `checkins/${userId}/${timestamp}-${randomString}.${extension}`;

    // Upload to R2
    const command = new PutObjectCommand({
      Bucket: storageConfig.bucketName,
      Key: imageKey,
      Body: fileBuffer,
      ContentType: mimetype,
    });

    await storageConfig.client.send(command);

    // Construct public URL
    const imageUrl = `${storageConfig.publicUrl}/${imageKey}`;

    return {
      imageUrl,
      imageKey,
    };
  } catch (error) {
    console.error('Error uploading image to R2:', error);
    throw new Error(`Failed to upload image: ${error.message}`);
  }
};

/**
 * Delete image from R2 storage
 * @param {string} imageKey - The key/path of the image in R2
 */
const deleteImage = async (imageKey) => {
  try {
    const command = new DeleteObjectCommand({
      Bucket: storageConfig.bucketName,
      Key: imageKey,
    });

    await storageConfig.client.send(command);
    console.log(`Image deleted: ${imageKey}`);
  } catch (error) {
    console.error('Error deleting image from R2:', error);
    // Don't throw error - deletion failures shouldn't break the app
  }
};

/**
 * Get file extension from MIME type
 */
const getExtensionFromMimetype = (mimetype) => {
  const mimetypeMap = {
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
  };
  
  return mimetypeMap[mimetype] || 'jpg';
};

/**
 * Validate image buffer
 */
const isValidImage = (buffer) => {
  // Check for common image file signatures
  const jpg = buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF;
  const png = buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47;
  const webp = buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50;
  
  return jpg || png || webp;
};

module.exports = {
  uploadImage,
  deleteImage,
  isValidImage,
};
