import express, { Router } from 'express';
import clerkAuth from '../middleware/clerkAuth';
import agencyAuth from '../middleware/agencyAuth';
import { AgencyAuthenticatedRequest } from "../types/express";
import {
    createAgency,
    getAllAgencies,
    getAgencyById,
    updateAgency,
    deleteAgency,
    getAgencyIssues,
    getAgencyStats,
    assignIssueToAgency,
    registerAgency,
    validateSetupToken,
    setupAgencyCredentials,
    loginAgency,
    verifyAgencySession,
    getMyAgencyIssues,
    getMyAgencyStats,
    debugAgencyIssues,
    updateIssueStatusByAgency,
} from "../controllers/agencyController";

const router: Router = express.Router();

// Public route for agency registration (no auth required)
router.post("/register", registerAgency);

// Debug route (no auth required for testing)
router.get("/debug-issues", debugAgencyIssues);

// Public routes for agency setup and login
router.get("/validate-setup-token", validateSetupToken);
router.post("/setup-credentials", setupAgencyCredentials);
router.post("/login", loginAgency);
router.post("/verify-session", verifyAgencySession);

// Agency dashboard routes (require agency session authentication)
router.get("/my-issues", agencyAuth, (req, res) => {
    return getMyAgencyIssues(req as AgencyAuthenticatedRequest, res);
});
router.get("/my-stats", agencyAuth, (req, res) => {
    return getMyAgencyStats(req as AgencyAuthenticatedRequest, res);
});
router.put("/issues/:id/status", agencyAuth, (req, res) => {
    return updateIssueStatusByAgency(req as AgencyAuthenticatedRequest, res);
});

// All other routes require Clerk authentication
router.use(clerkAuth);

// Agency CRUD operations
router.post("/", createAgency);
router.get("/", getAllAgencies);
router.get("/:id", getAgencyById);
router.put("/:id", updateAgency);
router.delete("/:id", deleteAgency);

// Agency-specific operations (use clerk auth from router.use above)
router.get("/:id/issues", getAgencyIssues);
router.get("/:id/stats", getAgencyStats);
router.post('/assign-issue', assignIssueToAgency);

export default router;
