import { Request, Response } from 'express';
import multer from 'multer';
import IssueReport, { IIssueReport, IssueType, IssueStatus } from '../models/IssueReport';
import User from '../models/User';
import { uploadToCloudinary } from '../config/cloudinary';
import { AuthenticatedRequest } from '../middleware/clerkAuth';
import AgencyAssignmentService from '../services/AgencyAssignmentService';
import NotificationService from '../services/NotificationService';

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    console.log('[Multer] Processing file:', {
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size
    });

    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      console.log('[Multer] Rejected file - not an image:', file.mimetype);
      cb(new Error('Only image files are allowed'));
    }
  },
});

export const uploadMiddleware = upload.single('image');

export const createIssue = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
      console.log("[CreateIssue] Request body:", req.body);
      console.log(
          "[CreateIssue] Request file:",
          req.file ? "Present" : "Not present"
      );

      const { userId } = req.auth!;
      const { title, description, type, coordinates, address } = req.body;

      // Find the user in our database
      const user = await User.findOne({ clerkId: userId });
      if (!user) {
          console.log("[CreateIssue] User not found for clerkId:", userId);
          res.status(404).json({
              success: false,
              error: "User not found",
          });
          return;
      }

      let imageUrl: string | undefined;
      let imagePublicId: string | undefined;

      // Handle image upload if present
      if (req.file) {
          console.log("[CreateIssue] Processing image upload:", {
              filename: req.file.originalname,
              size: req.file.size,
              mimetype: req.file.mimetype,
          });

          try {
              const result = await uploadToCloudinary(req.file.buffer);
              imageUrl = result.secure_url;
              imagePublicId = result.public_id;
              console.log("[CreateIssue] Image upload successful:", imageUrl);
          } catch (uploadError) {
              console.error("[CreateIssue] Image upload failed:", uploadError);
              res.status(400).json({
                  success: false,
                  error: `Image upload failed: ${
                      uploadError instanceof Error
                          ? uploadError.message
                          : "Unknown error"
                  }`,
              });
              return;
          }
      } else {
          console.log("[CreateIssue] No image file provided");
      }

      // Parse coordinates
      let coords;
      try {
          coords = JSON.parse(coordinates);
          console.log("[CreateIssue] Parsed coordinates:", coords);

          if (
              !coords ||
              typeof coords.lat !== "number" ||
              typeof coords.lng !== "number"
          ) {
              throw new Error("Invalid coordinates format");
          }
      } catch (parseError) {
          console.error(
              "[CreateIssue] Failed to parse coordinates:",
              parseError
          );
          res.status(400).json({
              success: false,
              error: "Invalid coordinates format",
          });
          return;
      }

      console.log("[CreateIssue] Creating issue with data:", {
          title,
          description,
          type,
          coordinates: coords,
          address,
          hasImage: !!imageUrl,
      });

      const issue = await IssueReport.create({
          title,
          description,
          type,
          location: {
              type: "Point",
              coordinates: [coords.lng, coords.lat],
          },
          address,
          imageUrl,
          imagePublicId,
          reportedBy: user._id,
          priority: "medium", // Default priority
      });

      await issue.populate("reportedBy", "firstName lastName email role");

      console.log("[CreateIssue] Issue created successfully:", issue._id);

      // Send immediate notification to citizen about successful report
      const notificationService = new NotificationService(req.io);
      await notificationService.notifyIssueReported(issue);

      // Auto-assign to appropriate agency
      const assignmentService = new AgencyAssignmentService(req.io);
      const assignmentResult = await assignmentService.autoAssignIssue(issue);

      if (assignmentResult.success && assignmentResult.agency) {
          console.log(
              "[CreateIssue] Issue auto-assigned to agency:",
              assignmentResult.agency.name
          );

          // Notify the agency about the new assignment
          await notificationService.notifyIssueAssignment(
              issue,
              assignmentResult.agency
          );

          // Notify the citizen that their issue has been assigned
          await notificationService.notifyIssueAssignedToCitizen(
              issue,
              assignmentResult.agency
          );

          // If it's a high priority issue, notify other relevant agencies too
          if (issue.priority === "high" || issue.priority === "urgent") {
              // Find other agencies that handle this type of issue
              const relevantAgencies = await(
                  await import("../models/Agency")
              ).default.find({
                  isActive: true,
                  issueTypes: { $in: [issue.type] },
                  _id: { $ne: assignmentResult.agency._id },
              });

              if (relevantAgencies.length > 0) {
                  await notificationService.notifyAgenciesAboutCriticalIssue(
                      issue,
                      relevantAgencies
                  );
              }
          }
      } else {
          console.log(
              "[CreateIssue] Auto-assignment failed:",
              assignmentResult.reason
          );
      }

      // Emit real-time update to all users
      req.io.emit("new_issue", issue);

      res.status(201).json({
          success: true,
          data: issue,
      });
  } catch (error) {
    console.error('[CreateIssue] Server error:', error);
    res.status(500).json({
      success: false,
      error: `Server Error: ${error instanceof Error ? error.message : 'Unknown error'}`
    });
  }
};

export const getIssues = async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, type, limit = '20', offset = '0' } = req.query;

    const filter: any = {};
    if (status) filter.status = status;
    if (type) filter.type = type;

    const issues = await IssueReport.find(filter)
      .populate('reportedBy', 'firstName lastName email role')
      .populate('assignedTo', 'firstName lastName email role')
      .populate('assignedAgency', 'name type email')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit as string))
      .skip(parseInt(offset as string));

    const total = await IssueReport.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: issues,
      pagination: {
        total,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

export const getIssueById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const issue = await IssueReport.findById(id)
      .populate('reportedBy', 'firstName lastName email role')
      .populate('assignedTo', 'firstName lastName email role')
      .populate('assignedAgency', 'name type email contactPerson');

    if (!issue) {
      res.status(404).json({
        success: false,
        error: 'Issue not found'
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: issue
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

export const updateIssueStatus = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { userId } = req.auth!;
    const { id } = req.params;
    const { status, agencyNotes } = req.body;

    // Check if user is authority or agency admin
    const user = await User.findOne({ clerkId: userId });
    if (!user || !['authority', 'agency_admin'].includes(user.role)) {
      res.status(403).json({
        success: false,
        error: 'Only authorities or agency admins can update issue status'
      });
      return;
    }

    if (!['reported', 'under_review', 'resolved'].includes(status)) {
      res.status(400).json({
        success: false,
        error: 'Invalid status'
      });
      return;
    }

    const updateData: any = {
      status,
      assignedTo: user._id
    };

    if (agencyNotes) {
      updateData.agencyNotes = agencyNotes;
    }

    const issue = await IssueReport.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    ).populate('reportedBy', 'firstName lastName email role')
     .populate('assignedTo', 'firstName lastName email role')
     .populate('assignedAgency', 'name type email');

    if (!issue) {
      res.status(404).json({
        success: false,
        error: 'Issue not found'
      });
      return;
    }

    // Send notification to citizen about status update
    const notificationService = new NotificationService(req.io);
    await notificationService.notifyIssueStatusUpdate(issue, user);

    // Emit real-time update
    req.io.emit('issue_updated', issue);
    req.io.to(`issue_${issue._id}`).emit('issue_status_updated', issue);

    res.status(200).json({
      success: true,
      data: issue
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

export const getUserIssues = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { userId } = req.auth!;

    const user = await User.findOne({ clerkId: userId });
    if (!user) {
      res.status(404).json({
        success: false,
        error: 'User not found'
      });
      return;
    }

    const issues = await IssueReport.find({ reportedBy: user._id })
      .populate('reportedBy', 'firstName lastName email role')
      .populate('assignedTo', 'firstName lastName email role')
      .populate('assignedAgency', 'name type email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: issues
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};
