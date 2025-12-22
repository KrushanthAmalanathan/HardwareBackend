import http from "http";
import open from "open";
import { google } from "googleapis";
import "dotenv/config.js";

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  "https://skillsharecyberbackend-production.up.railway.app/auth/google/callback"
);

const SCOPES = ["https://www.googleapis.com/auth/drive.file"];
const authUrl = oauth2Client.generateAuthUrl({
  access_type: "offline",
  prompt: "consent",
  scope: SCOPES,
});

if (!process.env.RAILWAY_STATIC_URL) {
  console.log("Opening browser to:", authUrl);
  open(authUrl); // Only works locally
} else {
  console.log("Visit this URL manually:", authUrl);
}

const PORT = process.env.PORT || 3000;
http
  .createServer(async (req, res) => {
    if (req.url.startsWith("/auth/google/callback")) {
      const url = new URL(req.url, `http://${req.headers.host}`);
      const code = url.searchParams.get("code");
      res.end("✅ Google Auth completed. You may close this tab.");

      const { tokens } = await oauth2Client.getToken(code);
      console.log("\n✅ Tokens received:\n", JSON.stringify(tokens, null, 2));
      console.log("\n🔒 Copy the `refresh_token` into your .env file.");
      process.exit(0); // Optionally stop the server after use
    }
  })
  .listen(PORT, () => console.log(`Listening on port ${PORT}`));
