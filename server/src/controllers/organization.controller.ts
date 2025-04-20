import { Request, Response } from 'express';
import Organization, { IOrganization } from '@/models/Organization';
import User, { IUser } from '@/models/User';
import logger from '@/utils/logger';

// Extended request interface
interface AuthRequest extends Request {
  user?: IUser & { _id: any };
}

/**
 * @desc    Get all organizations (super admin only)
 * @route   GET /api/v1/organizations
 * @access  Private/SuperAdmin
 */
export const getOrganizations = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Check if the user making the request is a super_admin
    if (req.user?.role !== 'super_admin') {
      res.status(403).json({ message: 'Not authorized to access this resource' });
      return;
    }

    const organizations = await Organization.find().sort({ name: 1 });

    res.status(200).json({
      success: true,
      count: organizations.length,
      data: organizations,
    });
  } catch (error) {
    logger.error(`Error in getOrganizations: ${error}`);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * @desc    Get single organization
 * @route   GET /api/v1/organizations/:id
 * @access  Private
 */
export const getOrganization = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const organization = await Organization.findById(req.params.id);

    if (!organization) {
      res.status(404).json({ message: 'Organization not found' });
      return;
    }

    // Check if user is a super_admin or belongs to this organization
    const userBelongsToOrg = req.user?.organization?.toString() === organization._id.toString();
    if (req.user?.role !== 'super_admin' && !userBelongsToOrg) {
      res.status(403).json({ message: 'Not authorized to access this organization' });
      return;
    }

    res.status(200).json({
      success: true,
      data: organization,
    });
  } catch (error) {
    logger.error(`Error in getOrganization: ${error}`);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * @desc    Create new organization (super admin only)
 * @route   POST /api/v1/organizations
 * @access  Private/SuperAdmin
 */
export const createOrganization = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Check if the user making the request is a super_admin
    if (req.user?.role !== 'super_admin') {
      res.status(403).json({ message: 'Not authorized to create organizations' });
      return;
    }

    const organization = await Organization.create(req.body);

    res.status(201).json({
      success: true,
      data: organization,
    });
  } catch (error) {
    logger.error(`Error in createOrganization: ${error}`);

    // Handle duplicate key error
    if ((error as any).code === 11000) {
      res.status(400).json({ message: 'Organization with that name already exists' });
      return;
    }

    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * @desc    Update organization
 * @route   PUT /api/v1/organizations/:id
 * @access  Private/SuperAdmin/OrgAdmin
 */
export const updateOrganization = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    let organization = await Organization.findById(req.params.id);

    if (!organization) {
      res.status(404).json({ message: 'Organization not found' });
      return;
    }

    // Check if user is authorized to update this organization
    const isOrgAdmin =
      req.user?.role === 'org_admin' &&
      req.user?.organization?.toString() === organization._id.toString();
    if (req.user?.role !== 'super_admin' && !isOrgAdmin) {
      res.status(403).json({ message: 'Not authorized to update this organization' });
      return;
    }

    organization = await Organization.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      data: organization,
    });
  } catch (error) {
    logger.error(`Error in updateOrganization: ${error}`);

    // Handle duplicate key error
    if ((error as any).code === 11000) {
      res.status(400).json({ message: 'Organization with that name already exists' });
      return;
    }

    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * @desc    Delete organization (super admin only)
 * @route   DELETE /api/v1/organizations/:id
 * @access  Private/SuperAdmin
 */
export const deleteOrganization = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Check if the user making the request is a super_admin
    if (req.user?.role !== 'super_admin') {
      res.status(403).json({ message: 'Not authorized to delete organizations' });
      return;
    }

    const organization = await Organization.findById(req.params.id);

    if (!organization) {
      res.status(404).json({ message: 'Organization not found' });
      return;
    }

    // Check if there are users associated with this organization
    const userCount = await User.countDocuments({ organization: organization._id });
    if (userCount > 0) {
      res.status(400).json({
        message:
          'Cannot delete organization with active users. Please reassign or delete the users first.',
        userCount,
      });
      return;
    }

    await organization.deleteOne();

    res.status(200).json({
      success: true,
      data: {},
    });
  } catch (error) {
    logger.error(`Error in deleteOrganization: ${error}`);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * @desc    Get users in an organization
 * @route   GET /api/v1/organizations/:id/users
 * @access  Private/SuperAdmin/OrgAdmin
 */
export const getOrganizationUsers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const organization = await Organization.findById(req.params.id);

    if (!organization) {
      res.status(404).json({ message: 'Organization not found' });
      return;
    }

    // Check if user is authorized to view organization users
    const isOrgAdmin =
      req.user?.role === 'org_admin' &&
      req.user?.organization?.toString() === organization._id.toString();
    const isSuperAdmin = req.user?.role === 'super_admin';

    if (!isOrgAdmin && !isSuperAdmin) {
      res.status(403).json({ message: 'Not authorized to view organization users' });
      return;
    }

    const users = await User.find({ organization: organization._id })
      .select('-password')
      .sort({ name: 1 });

    res.status(200).json({
      success: true,
      count: users.length,
      data: users,
    });
  } catch (error) {
    logger.error(`Error in getOrganizationUsers: ${error}`);
    res.status(500).json({ message: 'Server error' });
  }
};
