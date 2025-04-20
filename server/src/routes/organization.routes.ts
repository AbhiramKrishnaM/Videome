import { Router } from 'express';
import {
  getOrganizations,
  getOrganization,
  createOrganization,
  updateOrganization,
  deleteOrganization,
  getOrganizationUsers,
  getPublicOrganizations,
} from '../controllers/organization.controller';
import { protect, authorize } from '../middleware/auth';

const router = Router();

// Get all organizations - public access
router.get('/public', getPublicOrganizations);

// Get all organizations - super admin only
router.get('/', protect, authorize('super_admin'), getOrganizations);

// Get single organization
router.get('/:id', protect, authorize('super_admin', 'org_admin'), getOrganization);

// Create organization - super admin only
router.post('/', protect, authorize('super_admin'), createOrganization);

// Update organization - org admin or super admin
router.put('/:id', protect, authorize('super_admin', 'org_admin'), updateOrganization);

// Delete organization - super admin only
router.delete('/:id', protect, authorize('super_admin'), deleteOrganization);

// Get all users in an organization
router.get('/:id/users', protect, authorize('super_admin', 'org_admin'), getOrganizationUsers);

export default router;
