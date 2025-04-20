import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import User, { IUser } from '@/models/User';
import logger from '@/utils/logger';
import mongoose from 'mongoose';

// Extended request interface
interface AuthRequest extends Request {
  user?: IUser & { _id: any };
}

/**
 * @desc    Register a new user
 * @route   POST /api/v1/auth/register
 * @access  Public
 */
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errors.array(),
      });
      return;
    }

    const { name, email, password, organization, organizationName } = req.body;

    // Check for missing required fields
    if (!name || !email || !password) {
      res.status(400).json({
        success: false,
        message: 'Please provide name, email and password',
      });
      return;
    }

    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      res.status(409).json({
        success: false,
        message: 'Email is already registered',
      });
      return;
    }

    // Validate password length
    if (password.length < 6) {
      res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long',
      });
      return;
    }

    // Handle organization
    let organizationId = null;

    // Check if organization ID was provided (from dropdown)
    if (organization) {
      // Verify that the organization exists
      const Organization = mongoose.model('Organization');
      const existingOrg = await Organization.findById(organization);

      if (existingOrg) {
        organizationId = existingOrg._id;
        logger.info(`User assigned to existing organization: ${existingOrg.name}`);
      } else {
        logger.warn(`Organization ID ${organization} not found`);
      }
    }
    // For backward compatibility, also check organizationName
    else if (organizationName) {
      // Check if organization already exists
      const Organization = mongoose.model('Organization');
      let foundOrg = await Organization.findOne({ name: organizationName });

      if (!foundOrg) {
        // Create new organization
        foundOrg = await Organization.create({
          name: organizationName,
        });
        logger.info(`Created new organization: ${organizationName}`);
      }

      organizationId = foundOrg._id;
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      organization: organizationId,
    });

    // Generate token
    const token = user.getSignedJwtToken();

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        organization: organizationId,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    logger.error(`Error in register: ${error}`);
    res.status(500).json({
      success: false,
      message: 'Registration failed. Please try again later.',
    });
  }
};

/**
 * @desc    Login user
 * @route   POST /api/v1/auth/login
 * @access  Public
 */
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errors.array(),
      });
      return;
    }

    const { email, password } = req.body;

    // Check for missing fields
    if (!email || !password) {
      res.status(400).json({
        success: false,
        message: 'Please provide email and password',
      });
      return;
    }

    // Check if user exists with organization info
    const user = await User.findOne({ email })
      .select('+password')
      .populate('organization', 'name description logo');

    if (!user) {
      res.status(401).json({
        success: false,
        message: 'No account found with this email address',
      });
      return;
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      res.status(401).json({
        success: false,
        message: 'Incorrect password',
      });
      return;
    }

    // Update last login time
    user.lastLogin = new Date();
    await user.save();

    // Generate token
    const token = user.getSignedJwtToken();

    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        organization: user.organization,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    logger.error(`Error in login: ${error}`);
    res.status(500).json({
      success: false,
      message: 'Login failed. Please try again later.',
    });
  }
};

/**
 * @desc    Get current logged in user
 * @route   GET /api/v1/auth/me
 * @access  Private
 */
export const getMe = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Get user with organization details
    const userId = req.user?._id;
    const user = await User.findById(userId).populate('organization', 'name description logo');

    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found',
      });
      return;
    }

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        organization: user.organization,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    logger.error(`Error in getMe: ${error}`);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve user information',
    });
  }
};

/**
 * @desc    Logout user / clear cookie
 * @route   POST /api/v1/auth/logout
 * @access  Private
 */
export const logout = (_req: Request, res: Response): void => {
  res.status(200).json({
    success: true,
    message: 'Logged out successfully',
  });
};
