import { Response, NextFunction } from "express";
import Agency from "../models/Agency";
import { AgencyAuthenticatedRequest } from "../types/express";

const agencyAuth = async (
    req: AgencyAuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            res.status(401).json({
                success: false,
                error: "No authorization token provided",
            });
            return;
        }

        const token = authHeader.substring(7); // Remove 'Bearer ' prefix

        // Find agency with valid session
        const agency = await Agency.findOne({
            sessionToken: token,
            sessionTokenExpiry: { $gt: new Date() },
            status: "active",
            isActive: true,
        }).select("+sessionToken");

        if (!agency) {
            res.status(401).json({
                success: false,
                error: "Invalid or expired session",
            });
            return;
        }

        // Add agency to request object
        req.agency = agency;
        next();
    } catch (error) {
        console.error("Agency authentication error:", error);
        res.status(500).json({
            success: false,
            error: "Authentication error",
        });
    }
};

export default agencyAuth;
