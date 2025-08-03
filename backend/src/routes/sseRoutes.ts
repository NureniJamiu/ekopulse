import { Router, Request, Response } from "express";
import clerkAuth from "../middleware/clerkAuth";
import agencyAuth from "../middleware/agencyAuth";
import { AuthenticatedRequest, AgencyAuthenticatedRequest } from "../types/express";
import logger from "../utils/logger";

const router: Router = Router();

// Store active SSE connections
const sseConnections = new Map<string, Response>();

// SSE endpoint for regular users
router.get("/notifications", clerkAuth, (req: AuthenticatedRequest, res: Response) => {
    const userId = req.auth?.userId;
    if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
    }

    // Set up SSE headers
    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': process.env.FRONTEND_URL || '*',
        'Access-Control-Allow-Credentials': 'true',
    });

    // Send initial connection event
    res.write(`data: ${JSON.stringify({ type: 'connected', message: 'SSE connected' })}\n\n`);

    // Store the connection
    sseConnections.set(userId, res);

    logger.info(`SSE connection established for user: ${userId}`);

    // Handle client disconnect
    req.on('close', () => {
        sseConnections.delete(userId);
        logger.info(`SSE connection closed for user: ${userId}`);
    });

    req.on('aborted', () => {
        sseConnections.delete(userId);
        logger.info(`SSE connection aborted for user: ${userId}`);
    });

    // Keep connection alive with periodic heartbeat
    const heartbeat = setInterval(() => {
        try {
            res.write(`data: ${JSON.stringify({ type: 'heartbeat', timestamp: Date.now() })}\n\n`);
        } catch (error) {
            clearInterval(heartbeat);
            sseConnections.delete(userId);
        }
    }, 30000); // 30 seconds

    // Clean up on close
    res.on('close', () => {
        clearInterval(heartbeat);
        sseConnections.delete(userId);
    });
});

// SSE endpoint for agencies
router.get("/agency-notifications", agencyAuth, (req: AgencyAuthenticatedRequest, res: Response) => {
    const agency = req.agency;
    if (!agency) {
        return res.status(401).json({ message: "Unauthorized" });
    }

    const agencyId = agency._id.toString();

    // Set up SSE headers
    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': process.env.FRONTEND_URL || '*',
        'Access-Control-Allow-Credentials': 'true',
    });

    // Send initial connection event
    res.write(`data: ${JSON.stringify({ type: 'connected', message: 'Agency SSE connected' })}\n\n`);

    // Store the connection with agency prefix
    sseConnections.set(`agency_${agencyId}`, res);

    logger.info(`SSE connection established for agency: ${agencyId}`);

    // Handle client disconnect
    req.on('close', () => {
        sseConnections.delete(`agency_${agencyId}`);
        logger.info(`SSE connection closed for agency: ${agencyId}`);
    });

    req.on('aborted', () => {
        sseConnections.delete(`agency_${agencyId}`);
        logger.info(`SSE connection aborted for agency: ${agencyId}`);
    });

    // Keep connection alive with periodic heartbeat
    const heartbeat = setInterval(() => {
        try {
            res.write(`data: ${JSON.stringify({ type: 'heartbeat', timestamp: Date.now() })}\n\n`);
        } catch (error) {
            clearInterval(heartbeat);
            sseConnections.delete(`agency_${agencyId}`);
        }
    }, 30000); // 30 seconds

    // Clean up on close
    res.on('close', () => {
        clearInterval(heartbeat);
        sseConnections.delete(`agency_${agencyId}`);
    });
});

// Function to send SSE messages (replaces socket.emit functionality)
export const sendSSEMessage = (userId: string, event: string, data: any) => {
    const connection = sseConnections.get(userId);
    if (connection) {
        try {
            connection.write(`data: ${JSON.stringify({ type: event, data })}\n\n`);
            logger.info(`SSE message sent to user ${userId}: ${event}`);
        } catch (error) {
            logger.error(`Failed to send SSE message to user ${userId}:`, error as any);
            sseConnections.delete(userId);
        }
    }
};

// Function to send SSE messages to agencies
export const sendSSEMessageToAgency = (agencyId: string, event: string, data: any) => {
    const connection = sseConnections.get(`agency_${agencyId}`);
    if (connection) {
        try {
            connection.write(`data: ${JSON.stringify({ type: event, data })}\n\n`);
            logger.info(`SSE message sent to agency ${agencyId}: ${event}`);
        } catch (error) {
            logger.error(`Failed to send SSE message to agency ${agencyId}:`, error as any);
            sseConnections.delete(`agency_${agencyId}`);
        }
    }
};

// Function to broadcast to all connected users
export const broadcastSSE = (event: string, data: any, excludeUser?: string) => {
    sseConnections.forEach((connection, userId) => {
        if (excludeUser && userId === excludeUser) return;
        if (userId.startsWith('agency_')) return; // Skip agencies in user broadcast

        try {
            connection.write(`data: ${JSON.stringify({ type: event, data })}\n\n`);
        } catch (error) {
            logger.error(`Failed to broadcast SSE message to user ${userId}:`, error as any);
            sseConnections.delete(userId);
        }
    });
};

// Function to get active SSE connections count
export const getSSEConnectionsCount = () => {
    return sseConnections.size;
};

export default router;
