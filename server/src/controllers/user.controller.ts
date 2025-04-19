import { Request, Response } from 'express';
import User, { IUser } from '@/models/User';
import logger from '@/utils/logger';

// Extended request interface
interface AuthRequest extends Request {
  user?: IUser & { _id: any };
}

/**
 * @desc    Get all users
 * @route   GET /api/v1/users
 * @access  Private/Admin
 */
export const getUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const users = await User.find().select('-password');

    res.status(200).json({
      success: true,
      count: users.length,
      data: users,
    });
  } catch (error) {
    logger.error(`Error in getUsers: ${error}`);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * @desc    Get single user
 * @route   GET /api/v1/users/:id
 * @access  Private
 */
export const getUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.params.id).select('-password');

    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    // Check if user is trying to access their own profile or is an admin
    if (req.user?.role !== 'admin' && req.user?._id.toString() !== req.params.id) {
      res.status(403).json({ message: 'Not authorized to access this user' });
      return;
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    logger.error(`Error in getUser: ${error}`);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * @desc    Update user
 * @route   PUT /api/v1/users/:id
 * @access  Private
 */
export const updateUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    let user = await User.findById(req.params.id);

    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    // Check if user is trying to update their own profile or is an admin
    if (req.user?.role !== 'admin' && req.user?._id.toString() !== req.params.id) {
      res.status(403).json({ message: 'Not authorized to update this user' });
      return;
    }

    // Prevent non-admins from changing role
    if (req.user?.role !== 'admin' && req.body.role) {
      delete req.body.role;
    }

    // Never update password this way - use a dedicated route for that
    if (req.body.password) {
      delete req.body.password;
    }

    user = await User.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    logger.error(`Error in updateUser: ${error}`);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * @desc    Delete user
 * @route   DELETE /api/v1/users/:id
 * @access  Private
 */
export const deleteUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    // Check if user is trying to delete their own profile or is an admin
    if (req.user?.role !== 'admin' && req.user?._id.toString() !== req.params.id) {
      res.status(403).json({ message: 'Not authorized to delete this user' });
      return;
    }

    await user.deleteOne();

    res.status(200).json({
      success: true,
      data: {},
    });
  } catch (error) {
    logger.error(`Error in deleteUser: ${error}`);
    res.status(500).json({ message: 'Server error' });
  }
};
