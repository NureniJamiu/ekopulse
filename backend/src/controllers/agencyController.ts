import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Agency, { IAgency } from '../models/Agency';
import IssueReport from '../models/IssueReport';
import User from '../models/User';
import { AuthenticatedRequest } from '../middleware/clerkAuth';
import AgencyAssignmentService from '../services/AgencyAssignmentService';
import NotificationService from '../services/NotificationService';
import crypto from 'crypto';
import nodemailer from 'nodemailer';

// Interface for agency-authenticated requests
interface AgencyAuthenticatedRequest extends Request {
  agency: IAgency;
}

export const createAgency = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { userId } = req.auth!;

    // Check if user is authorized to create agencies (admin only)
    const user = await User.findOne({ clerkId: userId });
    if (!user || !['authority', 'agency_admin'].includes(user.role)) {
      res.status(403).json({
        success: false,
        error: 'Insufficient permissions to create agency'
      });
      return;
    }

    const {
      name,
      type,
      description,
      email,
      phone,
      address,
      serviceAreas,
      issueTypes,
      contactPerson,
      workingHours,
      priority
    } = req.body;

    // Validate required fields
    if (!name || !type || !email || !issueTypes || issueTypes.length === 0) {
      res.status(400).json({
        success: false,
        error: 'Missing required fields: name, type, email, and issueTypes'
      });
      return;
    }

    const agency = new Agency({
      name,
      type,
      description,
      email: email.toLowerCase(),
      phone,
      address,
      serviceAreas,
      issueTypes,
      contactPerson,
      workingHours,
      priority: priority || 1
    });

    const savedAgency = await agency.save();

    // If the user creating the agency is an agency_admin, link them to this agency
    if (user.role === 'agency_admin') {
      await User.findOneAndUpdate(
        { clerkId: userId },
        { agency: savedAgency._id },
        { new: true }
      );
    }

    res.status(201).json({
      success: true,
      data: savedAgency
    });
  } catch (error: any) {
    if (error.code === 11000) {
      res.status(400).json({
        success: false,
        error: 'Agency with this email already exists'
      });
    } else {
      console.error('Error creating agency:', error);
      res.status(500).json({
        success: false,
        error: 'Server Error'
      });
    }
  }
};

export const getAllAgencies = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { type, isActive, issueType } = req.query;

    const query: any = {};

    if (type) query.type = type;
    if (isActive !== undefined) query.isActive = isActive === 'true';
    if (issueType) query.issueTypes = { $in: [issueType] };

    const agencies = await Agency.find(query).sort({ priority: 1, name: 1 });

    res.status(200).json({
      success: true,
      data: agencies
    });
  } catch (error) {
    console.error('Error fetching agencies:', error);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

export const getAgencyById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const agency = await Agency.findById(id);
    if (!agency) {
      res.status(404).json({
        success: false,
        error: 'Agency not found'
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: agency
    });
  } catch (error) {
    console.error('Error fetching agency:', error);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

export const updateAgency = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { userId } = req.auth!;
    const { id } = req.params;

    // Check if user is authorized to update agencies
    const user = await User.findOne({ clerkId: userId });
    if (!user || !['authority', 'agency_admin'].includes(user.role)) {
      res.status(403).json({
        success: false,
        error: 'Insufficient permissions to update agency'
      });
      return;
    }

    const updatedAgency = await Agency.findByIdAndUpdate(
      id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!updatedAgency) {
      res.status(404).json({
        success: false,
        error: 'Agency not found'
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: updatedAgency
    });
  } catch (error: any) {
    if (error.code === 11000) {
      res.status(400).json({
        success: false,
        error: 'Agency with this email already exists'
      });
    } else {
      console.error('Error updating agency:', error);
      res.status(500).json({
        success: false,
        error: 'Server Error'
      });
    }
  }
};

export const deleteAgency = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { userId } = req.auth!;
    const { id } = req.params;

    // Check if user is authorized to delete agencies
    const user = await User.findOne({ clerkId: userId });
    if (!user || !['authority', 'agency_admin'].includes(user.role)) {
      res.status(403).json({
        success: false,
        error: 'Insufficient permissions to delete agency'
      });
      return;
    }

    const agency = await Agency.findByIdAndDelete(id);
    if (!agency) {
      res.status(404).json({
        success: false,
        error: 'Agency not found'
      });
      return;
    }

    // Reassign or unassign issues from this agency
    await IssueReport.updateMany(
      { assignedAgency: id },
      { $unset: { assignedAgency: 1, assignedAt: 1 }, status: 'reported' }
    );

    res.status(200).json({
      success: true,
      message: 'Agency deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting agency:', error);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

export const getAgencyIssues = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { userId } = req.auth!;
    const { id } = req.params;
    const { status, type, priority, page = 1, limit = 20 } = req.query;

    // Check if user has access to this agency's issues
    const user = await User.findOne({ clerkId: userId });
    if (!user) {
      res.status(404).json({
        success: false,
        error: 'User not found'
      });
      return;
    }

    // Agency admins can only see their own agency's issues
    if (user.role === 'agency_admin' && user.agency?.toString() !== id) {
      res.status(403).json({
        success: false,
        error: 'Access denied to this agency\'s issues'
      });
      return;
    }

    const query: any = { assignedAgency: id };

    if (status) query.status = status;
    if (type) query.type = type;
    if (priority) query.priority = priority;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const [issues, total] = await Promise.all([
      IssueReport.find(query)
        .populate('reportedBy', 'firstName lastName email')
        .populate('assignedTo', 'firstName lastName email')
        .populate('assignedAgency', 'name type email')
        .sort({ createdAt: -1 })
        .limit(limitNum)
        .skip(skip),
      IssueReport.countDocuments(query)
    ]);

    res.status(200).json({
      success: true,
      data: {
        issues,
        pagination: {
          current: pageNum,
          pages: Math.ceil(total / limitNum),
          total
        }
      }
    });
  } catch (error) {
    console.error('Error fetching agency issues:', error);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// Agency-authenticated version of getAgencyIssues
export const getMyAgencyIssues = async (req: AgencyAuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { status, type, priority, page = 1, limit = 20 } = req.query;
    const agency = req.agency;

    console.log('[getMyAgencyIssues] Agency:', {
      id: agency._id,
      name: agency.name,
      type: agency.type,
      issueTypes: agency.issueTypes
    });

    // Build query to get issues assigned to this agency
    // Ensure proper ObjectId comparison
    const query: any = {
      assignedAgency: new mongoose.Types.ObjectId(agency._id)
    };

    // Filter by agency's issue types - only show issues that match their specialization
    if (agency.issueTypes && agency.issueTypes.length > 0) {
      if (type && agency.issueTypes.includes(type as string)) {
        // If a specific type is requested and it's supported by the agency
        query.type = type;
      } else if (!type) {
        // If no specific type is requested, show all supported types
        query.type = { $in: agency.issueTypes };
      } else {
        // If specific type is requested but not supported, return empty result
        console.log('[getMyAgencyIssues] Requested type not supported by agency:', type);
        res.status(200).json({
          success: true,
          data: {
            issues: [],
            pagination: {
              current: 1,
              pages: 0,
              total: 0
            }
          }
        });
        return;
      }
    }

    // Apply additional filters if provided
    if (status) query.status = status;
    if (priority) query.priority = priority;

    console.log('[getMyAgencyIssues] Query:', query);

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const [issues, total] = await Promise.all([
      IssueReport.find(query)
        .populate('reportedBy', 'firstName lastName email')
        .populate('assignedTo', 'firstName lastName email')
        .populate('assignedAgency', 'name type email')
        .sort({ createdAt: -1 })
        .limit(limitNum)
        .skip(skip),
      IssueReport.countDocuments(query)
    ]);

    console.log('[getMyAgencyIssues] Results:', {
      totalFound: total,
      issuesReturned: issues.length,
      page: pageNum,
      limit: limitNum
    });

    if (issues.length > 0) {
      console.log('[getMyAgencyIssues] Sample issue types:', issues.slice(0, 3).map(i => i.type));
    }

    res.status(200).json({
      success: true,
      data: {
        issues,
        pagination: {
          current: pageNum,
          pages: Math.ceil(total / limitNum),
          total
        }
      }
    });
  } catch (error) {
    console.error('Error fetching agency issues:', error);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

export const getAgencyStats = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { userId } = req.auth!;
    const { id } = req.params;

    // Check if user has access to this agency's stats
    const user = await User.findOne({ clerkId: userId });
    if (!user) {
      res.status(404).json({
        success: false,
        error: 'User not found'
      });
      return;
    }

    if (user.role === 'agency_admin' && user.agency?.toString() !== id) {
      res.status(403).json({
        success: false,
        error: 'Access denied to this agency\'s statistics'
      });
      return;
    }

    const stats = await IssueReport.aggregate([
      { $match: { assignedAgency: id } },
      {
        $facet: {
          statusBreakdown: [
            {
              $group: {
                _id: '$status',
                count: { $sum: 1 }
              }
            }
          ],
          typeBreakdown: [
            {
              $group: {
                _id: '$type',
                count: { $sum: 1 }
              }
            }
          ],
          priorityBreakdown: [
            {
              $group: {
                _id: '$priority',
                count: { $sum: 1 }
              }
            }
          ],
          monthlyTrend: [
            {
              $group: {
                _id: {
                  year: { $year: '$createdAt' },
                  month: { $month: '$createdAt' }
                },
                count: { $sum: 1 }
              }
            },
            { $sort: { '_id.year': -1, '_id.month': -1 } },
            { $limit: 12 }
          ],
          avgResolutionTime: [
            {
              $match: { status: 'resolved' }
            },
            {
              $project: {
                resolutionTime: {
                  $subtract: ['$updatedAt', '$createdAt']
                }
              }
            },
            {
              $group: {
                _id: null,
                avgTime: { $avg: '$resolutionTime' }
              }
            }
          ]
        }
      }
    ]);

    const result = stats[0] || {};

    res.status(200).json({
      success: true,
      data: {
        statusBreakdown: result.statusBreakdown || [],
        typeBreakdown: result.typeBreakdown || [],
        priorityBreakdown: result.priorityBreakdown || [],
        monthlyTrend: result.monthlyTrend || [],
        avgResolutionTime: result.avgResolutionTime[0]?.avgTime || null
      }
    });
  } catch (error) {
    console.error('Error fetching agency stats:', error);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// Agency session-authenticated version for agency dashboard
export const getMyAgencyStats = async (req: AgencyAuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const agency = req.agency!;
    const agencyId = agency._id;

    // Build match criteria - filter by assigned agency and agency's issue types
    const matchCriteria: any = { assignedAgency: agencyId };

    // Filter by agency's issue types if available
    if (agency.issueTypes && agency.issueTypes.length > 0) {
      matchCriteria.type = { $in: agency.issueTypes };
    }

    const stats = await IssueReport.aggregate([
      { $match: matchCriteria },
      {
        $facet: {
          statusBreakdown: [
            {
              $group: {
                _id: '$status',
                count: { $sum: 1 }
              }
            }
          ],
          typeBreakdown: [
            {
              $group: {
                _id: '$type',
                count: { $sum: 1 }
              }
            }
          ],
          priorityBreakdown: [
            {
              $group: {
                _id: '$priority',
                count: { $sum: 1 }
              }
            }
          ],
          monthlyTrend: [
            {
              $group: {
                _id: {
                  year: { $year: '$createdAt' },
                  month: { $month: '$createdAt' }
                },
                count: { $sum: 1 }
              }
            },
            { $sort: { '_id.year': -1, '_id.month': -1 } },
            { $limit: 12 }
          ],
          avgResolutionTime: [
            {
              $match: { status: 'resolved' }
            },
            {
              $project: {
                resolutionTime: {
                  $subtract: ['$updatedAt', '$createdAt']
                }
              }
            },
            {
              $group: {
                _id: null,
                avgTime: { $avg: '$resolutionTime' }
              }
            }
          ]
        }
      }
    ]);

    const result = stats[0] || {};

    res.status(200).json({
      success: true,
      data: {
        statusBreakdown: result.statusBreakdown || [],
        typeBreakdown: result.typeBreakdown || [],
        priorityBreakdown: result.priorityBreakdown || [],
        monthlyTrend: result.monthlyTrend || [],
        avgResolutionTime: result.avgResolutionTime[0]?.avgTime || null
      }
    });
  } catch (error) {
    console.error('Error fetching agency stats:', error);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

export const assignIssueToAgency = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { userId } = req.auth!;
    const { issueId, agencyId } = req.body;

    // Check if user is authorized to assign issues
    const user = await User.findOne({ clerkId: userId });
    if (!user || !['authority', 'agency_admin'].includes(user.role)) {
      res.status(403).json({
        success: false,
        error: 'Insufficient permissions to assign issues'
      });
      return;
    }

    const assignmentService = new AgencyAssignmentService(req.io!);
    const result = await assignmentService.manualAssignIssue(issueId, agencyId, userId);

    if (result.success) {
      res.status(200).json({
        success: true,
        data: result.agency,
        message: 'Issue assigned successfully'
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.reason
      });
    }
  } catch (error) {
    console.error('Error assigning issue to agency:', error);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// Agency Registration Functions

export const registerAgency = async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('[Agency Registration] Processing registration request');

    const {
      name,
      type,
      description,
      email,
      phone,
      address,
      issueTypes,
      contactPerson,
      workingHours,
      priority
    } = req.body;

    // Validate required fields
    if (!name || !email || !type || !issueTypes || issueTypes.length === 0) {
      res.status(400).json({
        success: false,
        error: 'Missing required fields: name, email, type, and issueTypes are required'
      });
      return;
    }

    // Check if agency with this email already exists
    const existingAgency = await Agency.findOne({ email: email.toLowerCase() });
    if (existingAgency) {
      res.status(400).json({
        success: false,
        error: 'An agency with this email already exists'
      });
      return;
    }

    // Generate unique agency ID and setup token
    const agencyId = `AG${Date.now()}${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
    const setupToken = crypto.randomBytes(32).toString('hex');
    const setupTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now

    // Create agency with pending status
    const agency = new Agency({
      agencyId,
      name,
      type,
      description,
      email: email.toLowerCase(),
      phone,
      address,
      issueTypes,
      contactPerson,
      workingHours,
      priority: priority || 1,
      isActive: false, // Will be activated after email verification
      setupToken,
      setupTokenExpiry,
      status: 'pending_setup'
    });

    const savedAgency = await agency.save();

    // Send setup email
    await sendAgencySetupEmail(savedAgency);

    res.status(201).json({
      success: true,
      message: 'Agency registration submitted successfully',
      data: {
        agencyId: savedAgency.agencyId,
        status: 'pending_setup',
        message: 'Please check your email for setup instructions'
      }
    });

  } catch (error: any) {
    console.error('[Agency Registration] Error:', error);

    if (error.code === 11000) {
      res.status(400).json({
        success: false,
        error: 'Agency with this email already exists'
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to process agency registration'
      });
    }
  }
};

export const validateSetupToken = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token } = req.query;

    if (!token) {
      res.status(400).json({
        success: false,
        error: 'Setup token is required'
      });
      return;
    }

    const agency = await Agency.findOne({
      setupToken: token,
      setupTokenExpiry: { $gt: new Date() },
      status: 'pending_setup'
    });

    if (!agency) {
      res.status(400).json({
        success: false,
        error: 'Invalid or expired setup token'
      });
      return;
    }

    res.status(200).json({
      success: true,
      agency: {
        agencyId: agency.agencyId,
        name: agency.name,
        email: agency.email,
        type: agency.type
      }
    });

  } catch (error) {
    console.error('[Token Validation] Error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error during token validation'
    });
  }
};

export const setupAgencyCredentials = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      res.status(400).json({
        success: false,
        error: 'Token and password are required'
      });
      return;
    }

    // Validate password strength
    if (password.length < 8) {
      res.status(400).json({
        success: false,
        error: 'Password must be at least 8 characters long'
      });
      return;
    }

    const agency = await Agency.findOne({
      setupToken: token,
      setupTokenExpiry: { $gt: new Date() },
      status: 'pending_setup'
    });

    if (!agency) {
      res.status(400).json({
        success: false,
        error: 'Invalid or expired setup token'
      });
      return;
    }

    // In a real implementation, you'd hash the password
    // For now, we'll just store it (THIS IS NOT SECURE - use bcrypt in production)
    const hashedPassword = crypto.createHash('sha256').update(password).digest('hex');

    // Update agency with credentials and activate
    agency.password = hashedPassword;
    agency.isActive = true;
    agency.status = 'active';
    agency.setupToken = undefined;
    agency.setupTokenExpiry = undefined;
    agency.credentialsSetAt = new Date();

    await agency.save();

    res.status(200).json({
      success: true,
      message: 'Agency credentials set up successfully',
      data: {
        agencyId: agency.agencyId,
        status: 'active'
      }
    });

  } catch (error) {
    console.error('[Credential Setup] Error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error during credential setup'
    });
  }
};

export const loginAgency = async (req: Request, res: Response): Promise<void> => {
  try {
    const { identifier, password } = req.body; // Changed from agencyId to identifier

    if (!identifier || !password) {
        res.status(400).json({
            success: false,
            error: "Agency ID/Email and password are required",
        });
        return;
    }

    // Find agency by either agencyId or email and include password field
    const agency = await Agency.findOne({
        $or: [{ agencyId: identifier }, { email: identifier.toLowerCase() }],
        status: "active",
        isActive: true,
    }).select("+password"); // Include password field

    if (!agency) {
      res.status(401).json({
        success: false,
        error: 'Invalid agency credentials'
      });
      return;
    }

    // Verify password (in production, use bcrypt.compare)
    const hashedPassword = crypto.createHash('sha256').update(password).digest('hex');

    if (agency.password !== hashedPassword) {
      res.status(401).json({
        success: false,
        error: 'Invalid agency credentials'
      });
      return;
    }

    // Create a simple JWT-like token for the session (in production, use proper JWT)
    const token = crypto.randomBytes(32).toString('hex');
    const tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Update agency with login session info
    agency.lastLoginAt = new Date();
    agency.sessionToken = token;
    agency.sessionTokenExpiry = tokenExpiry;
    await agency.save();

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      agency: {
        id: agency._id,
        agencyId: agency.agencyId,
        name: agency.name,
        email: agency.email,
        type: agency.type,
        issueTypes: agency.issueTypes
      }
    });

  } catch (error) {
    console.error('[Agency Login] Error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error during login'
    });
  }
};

export const verifyAgencySession = async (req: Request, res: Response): Promise<void> => {
  try {
    const { agencyId } = req.body;
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        error: 'No authorization token provided'
      });
      return;
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    if (!agencyId || !token) {
      res.status(400).json({
        success: false,
        error: 'Agency ID and token are required'
      });
      return;
    }

    // Find agency with valid session
    const agency = await Agency.findOne({
      agencyId: agencyId,
      sessionToken: token,
      sessionTokenExpiry: { $gt: new Date() },
      status: 'active',
      isActive: true
    }).select('+sessionToken');

    if (!agency) {
      res.status(401).json({
        success: false,
        error: 'Invalid or expired session'
      });
      return;
    }

    res.status(200).json({
      success: true,
      agency: {
        id: agency._id,
        agencyId: agency.agencyId,
        name: agency.name,
        email: agency.email,
        type: agency.type,
        issueTypes: agency.issueTypes
      }
    });

  } catch (error) {
    console.error('[Agency Session Verification] Error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error during session verification'
    });
  }
};

// Email Service Function
async function sendAgencySetupEmail(agency: IAgency): Promise<void> {
  try {
    const setupUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/agency-setup?token=${agency.setupToken}`;

    // Always log the setup link for development/backup purposes
    console.log(`\n🔗 AGENCY SETUP LINK (BACKUP):`);
    console.log(`Agency: ${agency.name}`);
    console.log(`Email: ${agency.email}`);
    console.log(`Setup URL: ${setupUrl}`);
    console.log(`This link expires in 24 hours.\n`);

    // Always attempt to send email - removed development mode skip
    console.log('[Email] Attempting to send setup email...');

    // Create nodemailer transporter with improved configuration
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      },
      tls: {
        rejectUnauthorized: false // Accept self-signed certificates
      }
    });

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Complete Your Agency Setup - EcoPulse</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #059669, #3B82F6); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; }
          .agency-info { background: white; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #3B82F6; }
          .cta-button { display: inline-block; background: #3B82F6; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: bold; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
          .warning { background: #FEF3C7; border: 1px solid #F59E0B; padding: 15px; border-radius: 6px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🌍 Welcome to EcoPulse</h1>
            <p>Complete Your Agency Setup</p>
          </div>

          <div class="content">
            <h2>Hello ${agency.contactPerson?.name || 'Agency Administrator'},</h2>

            <p>Thank you for registering your agency with EcoPulse! We're excited to have you join our environmental monitoring platform.</p>

            <div class="agency-info">
              <h3>📋 Agency Details</h3>
              <p><strong>Agency Name:</strong> ${agency.name}</p>
              <p><strong>Agency ID:</strong> ${agency.agencyId}</p>
              <p><strong>Email:</strong> ${agency.email}</p>
              <p><strong>Type:</strong> ${agency.type}</p>
            </div>

            <h3>🔐 Next Steps</h3>
            <p>To complete your agency setup and start managing environmental reports, please:</p>
            <ol>
              <li>Click the setup button below</li>
              <li>Create a secure password for your agency account</li>
              <li>Start managing environmental issues in your area</li>
            </ol>

            <div style="text-align: center;">
              <a href="${setupUrl}" class="cta-button">Complete Agency Setup</a>
            </div>

            <div class="warning">
              <p><strong>⚠️ Important:</strong> This setup link will expire in 24 hours. If you don't complete the setup within this time, you'll need to register again.</p>
            </div>

            <p>If you have any questions or need assistance, please don't hesitate to contact our support team.</p>

            <p>Best regards,<br>The EcoPulse Team</p>
          </div>

          <div class="footer">
            <p>This email was sent to ${agency.email} because you registered an agency account with EcoPulse.</p>
            <p>If you didn't register for this account, please ignore this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    await transporter.sendMail({
      from: `"EcoPulse" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
      to: agency.email,
      subject: `Complete Your Agency Setup - ${agency.name}`,
      html: emailHtml
    });

    console.log(`[Email] Setup email sent successfully to ${agency.email}`);
    console.log('[Email] Agency can use either the email link or the console backup link above');

  } catch (error) {
    console.error('[Email] Failed to send setup email:', error);
    console.log('[Email] Email delivery failed, but backup link is available in console above');

    // For any error, always log the setup link as a fallback
    const setupUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/agency-setup?token=${agency.setupToken}`;
    console.log(`\n🔗 EMAIL FAILED - USE THIS SETUP LINK INSTEAD:`);
    console.log(`Agency: ${agency.name}`);
    console.log(`Email: ${agency.email}`);
    console.log(`Setup URL: ${setupUrl}`);
    console.log(`This link expires in 24 hours.\n`);

    // Don't throw error - registration should still succeed even if email fails
  }
}

// Debug endpoint to help troubleshoot agency-issue relationships
export const debugAgencyIssues = async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('[Debug] Fetching agency-issue relationships...');

    // Get all agencies
    const agencies = await Agency.find({}).select('name type issueTypes isActive status');

    // Get all issues with populated assignedAgency
    const issues = await IssueReport.find({})
      .populate('assignedAgency', 'name type issueTypes')
      .select('title type status assignedAgency createdAt');

    const debugInfo = {
      totalAgencies: agencies.length,
      totalIssues: issues.length,
      assignedIssues: issues.filter(i => i.assignedAgency).length,
      unassignedIssues: issues.filter(i => !i.assignedAgency).length,
      agencies: agencies.map(agency => {
        const agencyIssues = issues.filter(issue =>
          issue.assignedAgency &&
          issue.assignedAgency._id.toString() === agency._id.toString()
        );

        return {
          id: agency._id,
          name: agency.name,
          type: agency.type,
          issueTypes: agency.issueTypes,
          isActive: agency.isActive,
          status: agency.status,
          assignedIssuesCount: agencyIssues.length,
          assignedIssueTypes: [...new Set(agencyIssues.map(i => i.type))],
          typeMismatches: agencyIssues.filter(issue =>
            !agency.issueTypes || !agency.issueTypes.includes(issue.type)
          ).map(i => ({ title: i.title, type: i.type }))
        };
      }),
      issuesByType: issues.reduce((acc, issue) => {
        acc[issue.type] = (acc[issue.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    };

    console.log('[Debug] Analysis complete:', debugInfo);

    res.status(200).json({
      success: true,
      data: debugInfo
    });
  } catch (error) {
    console.error('[Debug] Error:', error);
    res.status(500).json({
      success: false,
      error: 'Debug failed'
    });
  }
};

// Agency-specific issue status update (using agency authentication)
export const updateIssueStatusByAgency = async (req: AgencyAuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const agency = req.agency!;
    const { id } = req.params;
    const { status, agencyNotes } = req.body;

    // Validate status
    if (!['reported', 'under_review', 'resolved'].includes(status)) {
      res.status(400).json({
        success: false,
        error: 'Invalid status'
      });
      return;
    }

    // Find the issue and verify it's assigned to this agency
    const issue = await IssueReport.findById(id);
    if (!issue) {
      res.status(404).json({
        success: false,
        error: 'Issue not found'
      });
      return;
    }

    // Check if the issue is assigned to this agency
    if (!issue.assignedAgency || issue.assignedAgency.toString() !== agency._id.toString()) {
      res.status(403).json({
        success: false,
        error: 'This issue is not assigned to your agency'
      });
      return;
    }

    const updateData: any = {
      status,
      assignedAgency: agency._id
    };

    if (agencyNotes) {
      updateData.agencyNotes = agencyNotes;
    }

    const updatedIssue = await IssueReport.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    ).populate('reportedBy', 'firstName lastName email role')
     .populate('assignedAgency', 'name type email');

    if (!updatedIssue) {
      res.status(404).json({
        success: false,
        error: 'Issue not found'
      });
      return;
    }

    // Send notification to citizen about status update (if needed)
    try {
      const NotificationService = require('../services/NotificationService').NotificationService;
      const notificationService = new NotificationService(req.io);

      // Create a mock user object for the agency to satisfy the notification service
      const mockAgencyUser = {
        _id: agency._id,
        firstName: agency.name,
        lastName: 'Agency',
        email: agency.email,
        role: 'agency_admin'
      };

      await notificationService.notifyIssueStatusUpdate(updatedIssue, mockAgencyUser);
    } catch (notificationError) {
      console.warn('Failed to send status update notification:', notificationError);
      // Don't fail the status update if notification fails
    }

    // Emit real-time update
    if (req.io) {
      req.io.emit('issue_updated', updatedIssue);
      req.io.to(`issue_${updatedIssue._id}`).emit('issue_status_updated', updatedIssue);
    }

    res.status(200).json({
      success: true,
      data: updatedIssue
    });
  } catch (error) {
    console.error('Error updating issue status:', error);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};
