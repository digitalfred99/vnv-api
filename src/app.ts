import "reflect-metadata";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";
import path from "path";

dotenv.config();

// Routes
import categoryRoutes       from "@modules/category/category.route";
import accessCodeRoutes     from "@modules/access-code/access-code.route";
import adminRoutes          from "@modules/admin/admin.route";
import seatingRoutes        from "@modules/seating/seating.route";
import participantRoutes    from "@modules/participant/participant.route";
import checkinRoutes        from "@modules/checkin/checkin.route";
import seatAssignmentRoutes from "@modules/seat-assignment/seat-assignment.route";

// Middleware
import { errorHandler, notFoundHandler } from "@middleware/errorHandler";

const app = express();

// ── CORS — must be first, before everything ───────────────────
const allowedOrigins = (process.env.CORS_ORIGINS || "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true); // Postman / curl
      if (allowedOrigins.includes(origin)) return callback(null, true);
      callback(new Error(`CORS: origin ${origin} not allowed`));
    },
    credentials: true,
  })
);

// Handle OPTIONS preflight globally before any other middleware touches it
app.options("*", cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true,
}));

// ── Security ──────────────────────────────────────────────────
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc:     ["'self'"],
        scriptSrc:      ["'self'", "'unsafe-inline'", "https://unpkg.com"],
        scriptSrcAttr:  ["'unsafe-inline'"],
        styleSrc:       ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        styleSrcElem:   ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc:        ["'self'", "https://fonts.gstatic.com"],
        imgSrc:         ["'self'", "data:", "blob:"],
        connectSrc:     ["'self'"],
        objectSrc:      ["'none'"],
        mediaSrc:       ["'self'", "blob:"],
        frameSrc:       ["'none'"],
      },
    },
  })
);

// ── Rate Limiting ─────────────────────────────────────────────
const limiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_MAX) || 100,
  skip: (req) => req.method === "OPTIONS",
  message: { success: false, message: "Too many requests, please try again later." },
});
app.use("/vnv/api", limiter);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  skip: (req) => req.method === "OPTIONS",
  message: { success: false, message: "Too many attempts, please wait 15 minutes." },
});

// ── Parsing & Logging ─────────────────────────────────────────
app.use(compression());
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

// ── Health Check ──────────────────────────────────────────────
app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "VnV API", timestamp: new Date().toISOString() });
});

// ── API Routes ────────────────────────────────────────────────
app.use("/vnv/api/categories",            categoryRoutes);
app.use("/vnv/api/access-codes",          accessCodeRoutes);
app.use("/vnv/api/seats",                 seatingRoutes);
app.use("/vnv/api/seat-assignments",      seatAssignmentRoutes);
app.use("/vnv/api/participants/register", authLimiter);
app.use("/vnv/api/participants/login",    authLimiter);
app.use("/vnv/api/participants",          participantRoutes);
app.use("/vnv/api/checkin",               checkinRoutes);
app.use("/vnv/api/admin",                 adminRoutes);

// ── Serve Frontend ────────────────────────────────────────────
// Serves everything inside /public (HTML, CSS, JS, images)
app.use(express.static(path.join(__dirname, "../public")));

// Fallback — for any non-API route, serve index.html
// This allows direct navigation to /register.html, /checkin.html etc.
app.get("*", (req, res, next) => {
  if (req.path.startsWith("/vnv/api")) return next();
  res.sendFile(path.join(__dirname, "../public/index.html"));
});

// ── Error Handling ────────────────────────────────────────────
app.use(notFoundHandler);
app.use(errorHandler);

export default app;