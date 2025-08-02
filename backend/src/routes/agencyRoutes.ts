import express, { Router } from 'express';
import clerkAuth from '../middleware/clerkAuth';
import agencyAuth from '../middleware/agencyAuth';
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
router.get("/my-issues", agencyAuth, getMyAgencyIssues);
router.get("/my-stats", agencyAuth, getMyAgencyStats);
router.put("/issues/:id/status", agencyAuth, updateIssueStatusByAgency);

// All other routes require Clerk authentication
router.use(clerkAuth);

// Agency CRUD operations
router.post('/', createAgency);
router.get('/', getAllAgencies);
router.get('/:id', getAgencyById);
router.put('/:id', updateAgency);
router.delete('/:id', deleteAgency);

// Agency-specific operations (require agency authentication)
router.get('/:id/issues', agencyAuth, getAgencyIssues);
router.get('/:id/stats', agencyAuth, getAgencyStats);
router.post('/assign-issue', assignIssueToAgency);

export default router;
