import dotenv from 'dotenv';
dotenv.config();

export const PORT = process.env.PORT || 5559;
export const mongodbURL = process.env.MONGODB_URL;
export const JWT_SECRET = process.env.JWT_SECRET;
export const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;