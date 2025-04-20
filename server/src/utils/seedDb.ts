import mongoose from 'mongoose';
import User from '@/models/User';
import { connectDB } from '@/config/database';
import logger from '@/utils/logger';

/**
 * DEPRECATED: This seed function is now moved to src/seed.ts
 * Please use the main seed script instead with 'npm run seed'
 *
 * This file is kept for backward compatibility only.
 */
const seedAdminUser = async (): Promise<void> => {
  try {
    logger.warn('Using deprecated seedDb.ts - Please use the main seed.ts script instead');
    await connectDB(); // Ensure database is connected

    // Check if admin user already exists
    const adminExists = await User.findOne({ email: 'admin@example.com' });

    if (adminExists) {
      logger.info('Admin user already exists - no need to seed');
    } else {
      // Create admin user
      const adminUser = await User.create({
        name: 'Admin User',
        email: 'admin@example.com',
        password: 'admin123', // Minimum 6 characters
        role: 'admin',
      });

      logger.info(`Admin user created: ${adminUser.name} (${adminUser.email})`);
    }

    // Check if super admin user already exists
    const superAdminExists = await User.findOne({ email: 'superadmin@example.com' });

    if (superAdminExists) {
      logger.info('Super admin user already exists - no need to seed');
    } else {
      // Create super admin user
      const superAdminUser = await User.create({
        name: 'Super Admin',
        email: 'superadmin@example.com',
        password: 'superadmin123', // Minimum 6 characters
        role: 'super_admin',
      });

      logger.info(`Super admin user created: ${superAdminUser.name} (${superAdminUser.email})`);
    }
  } catch (error) {
    logger.error(`Error seeding database: ${error}`);
  } finally {
    // Close database connection
    await mongoose.connection.close();
    logger.info('Database connection closed');
  }
};

// Run the seed function if this file is executed directly
if (require.main === module) {
  seedAdminUser()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      logger.error(`Error in seed script: ${error}`);
      process.exit(1);
    });
}

export { seedAdminUser };
