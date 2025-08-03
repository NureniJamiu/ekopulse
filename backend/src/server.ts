import dotenv from 'dotenv';
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
import logger from './utils/logger';

const app: Application = express();
const server = createServer(app);

const io = new SocketIOServer(server, {
    cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:5173",
        methods: ["GET", "POST"],
    },
});

connectDB();

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
        maxAge: 86400,
    })
);

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
});
app.use("/api/", limiter);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

app.use((req: Request, res: Response, next) => {
    req.io = io;
    next();
});

app.use("/api/auth", authRoutes);
app.use("/api/issues", issueRoutes);
app.use("/api/agencies", agencyRoutes);
app.use("/api/notifications", notificationRoutes);

app.get("/api/health", (req: Request, res: Response) => {
    res.status(200).json({
        status: "OK",
        message: "EkoPulse API is running",
        timestamp: new Date().toISOString(),
    });
});

app.use(errorHandler);

initializeSocketServer(io);

const scheduledNotificationService = new ScheduledNotificationService(io);
scheduledNotificationService.startScheduledTasks();

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
    logger.info(`🚀 EkoPulse server running on port ${PORT}`);
    logger.info(`📍 Environment: ${process.env.NODE_ENV}`);
});
