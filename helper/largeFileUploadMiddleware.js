// helper/largeFileUploadMiddleware.js
import multer from "multer";

const storage = multer.memoryStorage();
export const uploadLarge = multer({
  storage,
  limits: { fileSize: 200 * 1024 * 1024 }, // 200MB
});
