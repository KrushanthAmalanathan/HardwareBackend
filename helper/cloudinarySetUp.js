import { v2 as cloudinary } from 'cloudinary';
import multer from 'multer';
import dotenv from 'dotenv';

dotenv.config(); // Load environment variables

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = multer.memoryStorage();

async function imageUploadUnit(file) {
    try {
        const result = await cloudinary.uploader.upload(file, {
            resource_type: 'auto',
            timeout: 30000,
            folder: "profile_pictures", // Organizes uploads in Cloudinary
        });
        return result;
    } catch (err) {
        console.error('Cloudinary upload error:', err);
        throw new Error('Cloudinary upload failed');
    }
}

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // Max size: 5MB
});

export { upload, imageUploadUnit };
