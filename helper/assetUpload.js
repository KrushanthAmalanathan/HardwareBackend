// helper/assetUpload.js
import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";
dotenv.config();

// Configure once here (or reuse your existing setup file if you prefer)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const FOLDERS = {
  videos: "assets/videos",
  docs:   "assets/docs",
  ppts:   "assets/presentations",
  other:  "assets/files",
};

// ---------- Type helpers ----------
export function isVideoMime(m) {
  return m?.startsWith("video/");
}
export function isPdfMime(m) {
  return m === "application/pdf";
}
export function isPptMime(m) {
  return m === "application/vnd.ms-powerpoint" ||
         m === "application/vnd.openxmlformats-officedocument.presentationml.presentation";
}
export function decideFolder(mime) {
  if (isVideoMime(mime)) return FOLDERS.videos;
  if (isPdfMime(mime))   return FOLDERS.docs;
  if (isPptMime(mime))   return FOLDERS.ppts;
  return FOLDERS.other;
}
export function decideResourceType(mime) {
  // Cloudinary best practice: videos as 'video', everything else here as 'raw'
  return isVideoMime(mime) ? "video" : "raw";
}

// ---------- Core uploader (stream) ----------
/**
 * Upload any asset (PDF/PPT/PPTX/Video) to Cloudinary.
 * Returns normalized metadata you can store in DB.
 */
export function uploadAssetToCloudinary({ buffer, originalName, mimeType, folder }) {
  return new Promise((resolve, reject) => {
    const resource_type = decideResourceType(mimeType);
    const targetFolder  = folder || decideFolder(mimeType);

    const stream = cloudinary.uploader.upload_stream(
      {
        resource_type,
        folder: targetFolder,
        use_filename: true,       // keep original name (Cloudinary will still uniquify)
        unique_filename: true,
        filename_override: originalName,
        timeout: 120000,          // 120s
      },
      (err, res) => {
        if (err) return reject(err);
        resolve(normalizeUploadResult(res));
      }
    );

    stream.end(buffer); // pipe buffer into the stream
  });
}

function normalizeUploadResult(res) {
  return {
    provider:     "cloudinary",
    publicId:     res.public_id,
    resourceType: res.resource_type, // 'raw' | 'video'
    format:       res.format,        // 'pdf' | 'pptx' | 'mp4' | etc.
    bytes:        res.bytes,
    secureUrl:    res.secure_url,    // direct URL (public by default)
    createdAt:    res.created_at,
    folder:       res.folder,
    duration:     res.duration || undefined, // videos
  };
}

// ---------- URL builders ----------
/**
 * Inline/view URL (for <video> src, <iframe> src, etc.)
 * For videos, applies f_auto/q_auto for better streaming.
 */
export function getInlineUrl(publicId, resourceType = "raw", opts = {}) {
  const { format } = opts;
  const isVideo = resourceType === "video";
  return cloudinary.url(publicId, {
    resource_type: resourceType,
    secure: true,
    ...(format ? { format } : {}),
    transformation: isVideo ? [{ fetch_format: "auto", quality: "auto" }] : [],
  });
}

/**
 * Download URL – forces "Save As" in browser.
 * Optionally pass a filename.
 */
export function getDownloadUrl(publicId, resourceType = "raw", filename) {
  // Cloudinary uses flags: 'attachment' to force download
  return cloudinary.url(publicId, {
    resource_type: resourceType,
    secure: true,
    flags: filename ? `attachment:${filename}` : "attachment",
  });
}

/**
 * Thumbnail for video (poster image). timeSec = second to grab the frame.
 */
export function getVideoPosterUrl(publicId, { timeSec = 1, width = 640, height = 360 } = {}) {
  return cloudinary.url(publicId, {
    resource_type: "video",
    secure: true,
    format: "jpg",
    transformation: [
      { start_offset: timeSec },
      { width, height, crop: "fill" },
      { fetch_format: "auto", quality: "auto" },
    ],
  });
}

/**
 * Office Online viewer embed URL for PPT/PPTX (uses the public Cloudinary URL).
 * Use this in an <iframe>. Requires the file URL to be publicly reachable.
 */
export function buildOfficeViewerUrl(fileDirectUrl) {
  return `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(fileDirectUrl)}`;
}
