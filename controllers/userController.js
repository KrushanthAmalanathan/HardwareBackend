import { User } from "../models/userModel.js";
import { imageUploadUnit } from '../helper/cloudinarySetUp.js';
//import { sendWelcomeEmail } from '../helper/mail.js';
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { JWT_SECRET } from "../config.js";

// Generate JWT Token
export const generateToken = (user) => {
    return jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, {
      expiresIn: "7d",
    });
  };


// handle Image Upload Url
export const uploadProfilePicture = async (req, res) => {
  try {
      // Convert file buffer to Base64 format for Cloudinary
      const b64 = Buffer.from(req.file.buffer).toString('base64');
      const url = `data:${req.file.mimetype};base64,${b64}`;
      
      // Upload to Cloudinary
      const result = await imageUploadUnit(url);
      
      // Update user profile picture URL in DB
      const user = await User.findById(req.user.id);
      if (!user) return res.status(404).json({ message: "User not found" });

      user.profilePicture = result.secure_url;
      await user.save();

      res.status(200).json({ success: true, message: "Profile picture updated", url: result.secure_url });

  } catch (error) {
      console.error("Image upload error:", error);
      res.status(500).json({ success: false, message: "Error uploading image" });
  }
};

// Register User
export const registerUser = async (req, res) => {
  try {
    const { name, email, role, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ success: false, message: "User already exists" });

    const newUser = new User({
      name,
      email,
      role: role || "Viewer",
      hashed_password: password, // Store hashed password
    });

    await newUser.save();
    
    return res.status(201).json({
      success: true,
      message: "User registered successfully",
      token: generateToken(newUser),
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        profilePicture: newUser.profilePicture,
        role: newUser.role
      }
    });

  } catch (error) {
    console.error("Registration Error:", error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};
  // Login User
  export const loginUser = async (req, res) => {
    try {
      const { email, password } = req.body;
      const user = await User.findOne({ email });
      if (!user) return res.status(401).json({ message: "Invalid email or password" });
  
      const isMatch = await bcrypt.compare(password, user.hashed_password);
      if (!isMatch) {
        console.log("Password Mismatch: ");
        return res.status(401).json({ message: "Invalid email or password" });
      }
  
      res.status(200).json({
        message: "Login successful",
        token: generateToken(user),
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          profilePicture: user.profilePicture,
          role: user.role
        }
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  };

  // Get user profile
export const getUserProfile = async (req, res) => {
    try {
      const user = await User.findById(req.user.id).select("-hashed_password");
      if (!user) return res.status(404).json({ message: "User not found" });
      res.status(200).json(user);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };

  // Update user profile
  export const updateUser = async (req, res) => {
    try {
      const user = await User.findById(req.user.id);
      if (!user) return res.status(404).json({ message: "User not found" });
  
      if (req.body.name) user.name = req.body.name;
      if (req.body.profilePicture) user.profilePicture = req.body.profilePicture;
      if (req.body.email && req.body.email !== user.email) {
        const emailExists = await User.findOne({ email: req.body.email });
        if (emailExists) {
          return res.status(400).json({ message: "Email is already in use" });
        }
        user.email = req.body.email;
      }
  
      if (req.body.dateOfBirth) {
        const dob = new Date(req.body.dateOfBirth);
        if (isNaN(dob.getTime())) {
          return res.status(400).json({ message: "Invalid date of birth format" });
        }
        user.dateOfBirth = dob;
      }
  
      if (req.body.password) {
        const salt = await bcrypt.genSalt(10);
        user.hashed_password = await bcrypt.hash(req.body.password, salt);
      }
  
      await user.save();
      
      const { hashed_password, ...updatedUser } = user.toObject();
      res.status(200).json({ message: "User updated successfully", user: updatedUser });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Server error" });
    }
  };

  // Delete user (Admin only)
export const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    await user.deleteOne();
    res.status(200).json({ message: "User deleted successfully" });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update user role (Admin only)
export const updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!role) {
      return res.status(400).json({ message: "Role is required" });
    }

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.role = role;
    await user.save();

    res.status(200).json({ message: "User role updated successfully", role: user.role });
  } catch (error) {
    console.error("Update Role Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};


// Get all users (Admin only)
export const getUsers = async (req, res) => {
  try {
    const users = await User.find().select("-hashed_password");
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

