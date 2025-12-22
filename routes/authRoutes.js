import express from "express";
import passportGoogle from "../middleware/googleAuth.js";

const router = express.Router();

/**Google Authentication Routes **/
router.get("/google", passportGoogle.authenticate("google", { scope: ["profile", "email"] }));

router.get(
  "/google/callback",
  passportGoogle.authenticate("google", { session: false }),
  (req, res) => {
    const { token, user } = req.user;
    res.redirect(`${process.env.FRONTEND_URL}/auth-success?token=${token}&user=${encodeURIComponent(JSON.stringify(user))}`);
  }
);

export default router;
