import { Request, Response } from 'express';
import User, { IUser } from '../models/User';
import Agency from '../models/Agency';
import { AuthenticatedRequest } from "../types/express";
import crypto from 'crypto';

export const getOrCreateUser = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { userId } = req.auth!;
    const { email, firstName, lastName, role } = req.body;

    let user = await User.findOne({ clerkId: userId });

    if (!user) {
      user = await User.create({
        clerkId: userId,
        email,
        firstName,
        lastName,
        role: role || 'citizen'
      });
    }

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

export const updateUserRole = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { userId } = req.auth!;
    const { role } = req.body;

    if (!['citizen', 'authority', 'agency_admin'].includes(role)) {
      res.status(400).json({
        success: false,
        error: 'Invalid role'
      });
      return;
    }

    const user = await User.findOneAndUpdate(
      { clerkId: userId },
      { role },
      { new: true }
    );

    if (!user) {
      res.status(404).json({
        success: false,
        error: 'User not found'
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

export const getCurrentUser = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
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

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// Agency Authentication
export const agencyLogin = async (req: Request, res: Response): Promise<void> => {
  try {
    const { agencyId, password } = req.body;

    if (!agencyId || !password) {
      res.status(400).json({
        success: false,
        error: 'Agency ID and password are required'
      });
      return;
    }

    // Find agency with password included
    const agency = await Agency.findOne({
      agencyId: agencyId.toUpperCase(),
      status: 'active',
      isActive: true
    }).select('+password');

    if (!agency) {
      res.status(401).json({
        success: false,
        error: 'Invalid agency credentials'
      });
      return;
    }

    // Verify password (in production, use bcrypt)
    const hashedPassword = crypto.createHash('sha256').update(password).digest('hex');

    if (agency.password !== hashedPassword) {
      res.status(401).json({
        success: false,
        error: 'Invalid agency credentials'
      });
      return;
    }

    // Return agency data without password
    const agencyData = agency.toObject();
    delete agencyData.password;
    delete agencyData.setupToken;
    delete agencyData.setupTokenExpiry;

    res.status(200).json({
      success: true,
      data: {
        agency: agencyData,
        message: 'Login successful'
      }
    });

  } catch (error) {
    console.error('[Agency Login] Error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error during authentication'
    });
  }
};
