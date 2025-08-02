import dotenv from 'dotenv';

// Load environment variables first
dotenv.config();

import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';

import connectDB from './config/db';
import errorHandler from './middleware/errorHandler';
import authRoutes from './routes/authRoutes';
import issueRoutes from './routes/issueRoutes';
import agencyRoutes from './routes/agencyRoutes';
import notificationRoutes from './routes/notificationRoutes';
import { initializeSocketServer } from './websockets/socketServer';
import ScheduledNotificationService from "./services/ScheduledNotificationService";

const app: Application = express();
const server = createServer(app);

// Initialize Socket.IO
const io = new SocketIOServer(server, {
    cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:5173",
        methods: ["GET", "POST"],
    },
});

// Connect to MongoDB
connectDB();

// Security middleware
app.use(
    helmet({
        crossOriginResourcePolicy: { policy: "cross-origin" },
    })
);
app.use(
    cors({
        origin: process.env.FRONTEND_URL || "http://localhost:5173",
        credentials: true,
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allowedHeaders: [
            "Content-Type",
            "Authorization",
            "X-Requested-With",
            "Accept",
            "Origin",
        ],
        exposedHeaders: ["Content-Range", "X-Content-Range"],
        maxAge: 86400, // 24 hours
    })
);

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
});
app.use("/api/", limiter);

// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Make io accessible in routes
declare global {
    namespace Express {
        interface Request {
            io: SocketIOServer;
        }
    }
}

app.use((req: Request, res: Response, next) => {
    req.io = io;
    next();
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/issues", issueRoutes);
app.use("/api/agencies", agencyRoutes);
app.use("/api/notifications", notificationRoutes);

// Health check endpoint
app.get("/api/health", (req: Request, res: Response) => {
    res.status(200).json({
        status: "OK",
        message: "EcoPulse API is running",
        timestamp: new Date().toISOString(),
    });
});

// Test endpoint to verify requests are reaching the server
app.get("/api/test", (req: Request, res: Response) => {
    res.status(200).json({
        message: "Test endpoint working",
        headers: {
            authorization: req.headers.authorization ? "Present" : "Missing",
            cookie: req.headers.cookie ? "Present" : "Missing",
        },
    });
});

// Error handling middleware
app.use(errorHandler);

// Initialize WebSocket handlers
initializeSocketServer(io);

// Initialize scheduled notification service
const scheduledNotificationService = new ScheduledNotificationService(io);
scheduledNotificationService.startScheduledTasks();

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`🚀 EcoPulse server running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV}`);
});
