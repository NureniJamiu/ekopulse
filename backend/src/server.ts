import dotenv from 'dotenv';
dotenv.config();

import express, { Application, Request, Response, NextFunction } from 'express';
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
import sseRoutes from './routes/sseRoutes';
import { initializeSocketServer } from './websockets/socketServer';
import { getUniversalNotificationService } from './services/UniversalNotificationService';
import ScheduledNotificationService from "./services/ScheduledNotificationService";
import logger from './utils/logger';

const app: Application = express();
const server = createServer(app);

// Configure allowed origins based on environment
const getAllowedOrigins = () => {
    const origins = [];

    // Add environment-specific frontend URL
    if (process.env.FRONTEND_URL) {
        origins.push(process.env.FRONTEND_URL);
    }

    // Add production domains
    if (process.env.NODE_ENV === 'production') {
        origins.push('https://ekopulse.vercel.app');
        origins.push('https://ekopulse-frontend.vercel.app'); // In case you have this too
    } else {
        // Development origins
        origins.push('http://localhost:5173');
        origins.push('http://localhost:3000');
        origins.push('http://127.0.0.1:5173');
    }

    return origins;
};

// Only initialize Socket.IO for non-Vercel environments
let io: SocketIOServer | null = null;
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
    io = new SocketIOServer(server, {
        cors: {
            origin: getAllowedOrigins(),
            methods: ["GET", "POST"],
        },
    });
} else {
    logger.info("WebSocket connection skipped in production environment");
}

connectDB();

app.use(
    helmet({
        crossOriginResourcePolicy: { policy: "cross-origin" },
    })
);
app.use(
    cors({
        origin: (origin, callback) => {
            const allowedOrigins = getAllowedOrigins();

            // Allow requests with no origin (mobile apps, Postman, etc.)
            if (!origin) return callback(null, true);

            if (allowedOrigins.includes(origin)) {
                callback(null, true);
            } else {
                logger.warn(`CORS blocked origin: ${origin}. Allowed origins: ${allowedOrigins.join(', ')}`);
                callback(new Error('Not allowed by CORS'));
            }
        },
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

// Handle preflight requests explicitly
app.options('*', (req: Request, res: Response) => {
    const allowedOrigins = getAllowedOrigins();
    const origin = req.headers.origin;

    if (!origin || allowedOrigins.includes(origin)) {
        res.header('Access-Control-Allow-Origin', origin || '*');
        res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
        res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With, Accept, Origin');
        res.header('Access-Control-Allow-Credentials', 'true');
        res.sendStatus(200);
    } else {
        res.sendStatus(403);
    }
});

app.use((req: Request, res: Response, next: NextFunction) => {
    req.io = io || undefined;
    next();
});

app.use("/api/auth", authRoutes);
app.use("/api/issues", issueRoutes);
app.use("/api/agencies", agencyRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/sse", sseRoutes);

app.get("/api/health", (req: Request, res: Response) => {
    res.status(200).json({
        status: "OK",
        message: "EkoPulse API is running",
        timestamp: new Date().toISOString(),
    });
});

app.use(errorHandler);

if (io) {
    initializeSocketServer(io);

    const scheduledNotificationService = new ScheduledNotificationService(io);
    scheduledNotificationService.startScheduledTasks();
}

// Initialize Universal Notification Service (works with or without WebSocket)
const universalNotificationService = getUniversalNotificationService(io);
logger.info(`🔔 Universal Notification Service initialized (WebSocket: ${io ? 'enabled' : 'disabled'}, SSE: enabled)`);

const PORT = process.env.PORT || 5000;

// For local development
if (process.env.NODE_ENV !== 'production') {
    server.listen(PORT, () => {
        logger.info(`🚀 EkoPulse server running on port ${PORT}`);
        logger.info(`📍 Environment: ${process.env.NODE_ENV}`);
    });
}

// Export for Vercel
export default app;
