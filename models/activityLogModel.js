// activityLogModel.js
import mongoose from "mongoose";

const activityLogSchema = new mongoose.Schema(
  {
    category: {
      type: String,
      enum: [
        "User Login",
        "Product Added",
        "Product Updated",
        "Product Deleted",
        "Page Viewed",
        "Settings Changed",
        "Add to card",
        "Password Changed",
        "Profile Updated",
        "Other",
      ],
    },
    description: {
      type: String,
    },
    userEmail: {
      type: String,
    },
    userName: {
      type: String,
    },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt
  }
);

export const ActivityLog = mongoose.model("ActivityLog", activityLogSchema);
