import mongoose from 'mongoose';
import User from '@/models/User';
import { connectDB } from '@/config/database';
import logger from '@/utils/logger';

/**
 * Seed admin user into database
 */
const seedAdminUser = async (): Promise<void> => {
  try {
    await connectDB(); // Ensure database is connected

    // Check if admin user already exists
    const adminExists = await User.findOne({ email: 'admin@example.com' });

    if (adminExists) {
      logger.info('Admin user already exists - no need to seed');
      return;
    }

    // Create admin user
    const adminUser = await User.create({
      name: 'Admin User',
      email: 'admin@example.com',
      password: 'admin123', // Minimum 6 characters
      role: 'admin',
    });

    logger.info(`Admin user created: ${adminUser.name} (${adminUser.email})`);
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
