const { S3Client } = require('@aws-sdk/client-s3');

/**
 * Cloudflare R2 Storage Configuration
 * R2 is S3-compatible, so we use the AWS SDK
 */

const r2Client = new S3Client({
  region: 'auto', // Cloudflare R2 uses 'auto' region
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

const storageConfig = {
  client: r2Client,
  bucketName: process.env.R2_BUCKET_NAME,
  publicUrl: process.env.R2_PUBLIC_URL,
};

console.log('✅ Cloudflare R2 client configured');

module.exports = storageConfig;
