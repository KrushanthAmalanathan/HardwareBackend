// server.js

import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import swaggerUi from 'swagger-ui-express';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const OpenApiValidator = require('express-openapi-validator');
import session from 'express-session';
// import passport from './middleware/azureAuth.js';
import cron from "node-cron";
import { exec } from "child_process";
// Load config (PORT, MongoDB URL, etc.)
import { PORT, mongodbURL } from './config.js';


// Import main and versioned API routes
import userRoute from './routes/userRoute.js';
import authRoute from './routes/authRoutes.js';
import activityLogRoutes from './routes/activityLogRoutes.js';
import productRoutes from "./routes/productRoutes.js";
import wishlistRoutes from "./routes/wishlistRoutes.js";
import cartRoutes from "./routes/cartRoutes.js";

dotenv.config();

const app = express();


// Fix __dirname in ES modules
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const spec = path.join(__dirname, 'api-spec', 'openapi.yaml');



// Middleware: JSON parsing, CORS
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
//app.use(cors());
const allowedOrigins = [
  "http://localhost:5173",
  // "https://skill-share-cyber-frondend-alpha.vercel.app"
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
}));

app.options("*", cors());



// Session and authentication setup
app.set('trust proxy', 1);
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: 'none', // allow cross-site POST from Azure
    secure: process.env.NODE_ENV === 'production',
  }
}));
// app.use(passport.initialize());
// app.use(passport.session());


// OpenAPI docs and request/response validation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(null, {
  swaggerOptions: { url: '/api-spec/openapi.yaml' }
}));
app.use('/api-spec', express.static(path.dirname(spec)));
app.use(
  '/api/v1',
  OpenApiValidator.middleware({
    apiSpec: spec,
    validateRequests: true,
    validateResponses: true,
  })
);



// Health check and welcome route
app.get('/', (req, res) => {
  return res.status(234).send('Welcome to MERN Stack');
});


// Main API routes
app.use('/users', userRoute);
app.use('/auth', authRoute);
app.use("/api/products", productRoutes);
app.use("/api/wishlist", wishlistRoutes);
app.use("/api/cart", cartRoutes);
//app.use("/api/activities", activityLogRoutes);

// Health check
app.get("/ping", (req, res) => res.send("pong"));


// Error handler for OpenAPI validation errors
app.use((err, req, res, next) => {
  if (err.status && err.errors) {
    return res.status(err.status).json({
      message: err.message,
      errors: err.errors,
    });
  }
  next(err);
});


// Connect to MongoDB and start server
mongoose.connect(mongodbURL, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log('App Connected to MongoDB');
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.log('Failed to connect to MongoDB', error);
  });
