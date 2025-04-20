import mongoose from 'mongoose';
import { config } from './config/config';
import Organization from './models/Organization';
import User from './models/User';
import logger from './utils/logger';

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(config.mongoUri);
    logger.info('MongoDB connected');
  } catch (error) {
    logger.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Seed data
const seedData = async () => {
  try {
    // Clear existing data (only for development)
    if (process.env.NODE_ENV !== 'production') {
      logger.info('Clearing existing seed data...');
      // Don't delete all users and orgs, just check if our seed exists
    }

    // Create Videome organization if it doesn't exist
    logger.info('Creating Videome organization...');
    let organization = await Organization.findOne({ name: 'Videome' });

    if (!organization) {
      organization = await Organization.create({
        name: 'Videome',
        description: 'Video conferencing platform for teams',
        industry: 'Technology',
        size: '11-50',
        website: 'https://videome.com',
      });
      logger.info('Videome organization created');
    } else {
      logger.info('Videome organization already exists');
    }

    // Create org_admin user if it doesn't exist
    logger.info('Creating org admin user...');
    const existingAdmin = await User.findOne({
      email: 'admin@videome.com',
      organization: organization._id,
    });

    if (!existingAdmin) {
      await User.create({
        name: 'Videome Admin',
        email: 'admin@videome.com',
        password: 'password123', // This will be hashed by the pre-save hook
        role: 'org_admin',
        organization: organization._id,
      });
      logger.info('Org admin user created');
    } else {
      logger.info('Org admin user already exists');
    }

    logger.info('Seed completed successfully');
  } catch (error) {
    logger.error('Error seeding data:', error);
    process.exit(1);
  }
};

// Main function
const main = async () => {
  try {
    await connectDB();
    await seedData();

    // Disconnect from database
    await mongoose.disconnect();
    logger.info('MongoDB disconnected');

    process.exit(0);
  } catch (error) {
    logger.error('Error in seed script:', error);
    process.exit(1);
  }
};

// Run the seed script
main();
