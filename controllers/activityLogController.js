// backend/controllers/activityLogController.js
import { ActivityLog } from "../models/activityLogModel.js";

// POST /activities
export const addActivity = async (req, res) => {
  try {
    const { category, description } = req.body;
    // pull identity off req.user (set by your protect middleware)
    const { email: userEmail, name: userName } = req.user;

    const newActivity = await ActivityLog.create({
      category,
      description,
      userEmail,
      userName,
    });

    return res.status(201).json(newActivity);
  } catch (err) {
    return res
      .status(500)
      .json({ message: "Error adding activity", error: err.message });
  }
};


// GET /activities
export const getActivities = async (req, res) => {
  try {
    const { category, userEmail, startDate, endDate } = req.query;
    const filter = {};

    if (category && category !== "All") filter.category = category;
    if (userEmail && userEmail !== "All") filter.userEmail = userEmail;
    if (startDate && endDate) {
      filter.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    const logs = await ActivityLog.find(filter).sort({ createdAt: -1 });
    return res.status(200).json(logs);
  } catch (err) {
    return res
      .status(500)
      .json({ message: "Error fetching activities", error: err.message });
  }
};

// GET /activities/stats
export const getStats = async (req, res) => {
  try {
    const totalActivities = await ActivityLog.countDocuments();
    const templateActions = await ActivityLog.countDocuments({
      category: /Template/,
    });
    const productActions = await ActivityLog.countDocuments({
      category: /Product/,
    });
    const uniqueUsers = (await ActivityLog.distinct("userEmail")).length;

    return res.status(200).json({
      totalActivities,
      templateActions,
      productActions,
      uniqueUsers,
    });
  } catch (err) {
    return res
      .status(500)
      .json({ message: "Error fetching stats", error: err.message });
  }
};
