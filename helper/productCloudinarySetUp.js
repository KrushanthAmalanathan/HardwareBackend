// helper/productCloudinarySetUp.js 
import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const productImageUpload = async (fileBuffer) => {
  try {
    const base64String = fileBuffer.toString('base64');
    const dataUri = `data:image/jpeg;base64,${base64String}`;
    const uploadResult = await cloudinary.uploader.upload(dataUri, {
      resource_type: 'auto',
      folder: 'product_images',
      timeout: 30000,
    });
    return uploadResult;
  } catch (err) {
    console.error('Product Cloudinary upload error:', err);
    throw new Error('Product Cloudinary upload failed');
  }
};
