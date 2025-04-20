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

    // ====================================================
    // Create Organizations
    // ====================================================
    logger.info('Creating organizations...');

    // Create Videome Organization (Main)
    let videoMeOrg = await Organization.findOne({ name: 'Videome' });
    if (!videoMeOrg) {
      videoMeOrg = await Organization.create({
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

    // Create Acme Corp Organization
    let acmeOrg = await Organization.findOne({ name: 'Acme Corporation' });
    if (!acmeOrg) {
      acmeOrg = await Organization.create({
        name: 'Acme Corporation',
        description: 'Innovative product company',
        industry: 'Manufacturing',
        size: '51-200',
        website: 'https://acme.example.com',
      });
      logger.info('Acme Corp organization created');
    } else {
      logger.info('Acme Corp organization already exists');
    }

    // Create Tech Innovators Organization
    let techOrg = await Organization.findOne({ name: 'Tech Innovators' });
    if (!techOrg) {
      techOrg = await Organization.create({
        name: 'Tech Innovators',
        description: 'Cutting-edge technology solutions',
        industry: 'Information Technology',
        size: '11-50',
        website: 'https://techinnovators.example.com',
      });
      logger.info('Tech Innovators organization created');
    } else {
      logger.info('Tech Innovators organization already exists');
    }

    // ====================================================
    // Create Super Admin User (System-wide access)
    // ====================================================
    logger.info('Creating super admin user...');
    const superAdminExists = await User.findOne({ email: 'superadmin@videome.com' });
    if (!superAdminExists) {
      await User.create({
        name: 'Super Admin',
        email: 'superadmin@videome.com',
        password: 'superadmin123',
        role: 'super_admin',
      });
      logger.info('Super admin user created');
    } else {
      logger.info('Super admin user already exists');
    }

    // ====================================================
    // Create Admin User (Primary admin role)
    // ====================================================
    logger.info('Creating admin user...');
    const adminExists = await User.findOne({ email: 'admin@videome.com', role: 'admin' });
    if (!adminExists) {
      await User.create({
        name: 'Admin User',
        email: 'admin@videome.com',
        password: 'admin123',
        role: 'admin',
      });
      logger.info('Admin user created');
    } else {
      logger.info('Admin user already exists');
    }

    // ====================================================
    // Create Org Admins (One for each organization)
    // ====================================================

    // Create Videome Org Admin
    logger.info('Creating Videome org admin...');
    const videomeOrgAdminExists = await User.findOne({
      email: 'orgadmin@videome.com',
      organization: videoMeOrg._id,
    });

    if (!videomeOrgAdminExists) {
      await User.create({
        name: 'Videome Org Admin',
        email: 'orgadmin@videome.com',
        password: 'password123',
        role: 'org_admin',
        organization: videoMeOrg._id,
      });
      logger.info('Videome org admin created');
    } else {
      logger.info('Videome org admin already exists');
    }

    // Create Acme Org Admin
    logger.info('Creating Acme org admin...');
    const acmeOrgAdminExists = await User.findOne({
      email: 'orgadmin@acme.com',
      organization: acmeOrg._id,
    });

    if (!acmeOrgAdminExists) {
      await User.create({
        name: 'Acme Org Admin',
        email: 'orgadmin@acme.com',
        password: 'password123',
        role: 'org_admin',
        organization: acmeOrg._id,
      });
      logger.info('Acme org admin created');
    } else {
      logger.info('Acme org admin already exists');
    }

    // Create Tech Innovators Org Admin
    logger.info('Creating Tech Innovators org admin...');
    const techOrgAdminExists = await User.findOne({
      email: 'orgadmin@techinnovators.com',
      organization: techOrg._id,
    });

    if (!techOrgAdminExists) {
      await User.create({
        name: 'Tech Innovators Org Admin',
        email: 'orgadmin@techinnovators.com',
        password: 'password123',
        role: 'org_admin',
        organization: techOrg._id,
      });
      logger.info('Tech Innovators org admin created');
    } else {
      logger.info('Tech Innovators org admin already exists');
    }

    // ====================================================
    // Create Regular Users (Several for each organization)
    // ====================================================

    // Create Videome Regular Users
    logger.info('Creating regular users for Videome...');
    const videomeUsers = [
      { name: 'John Doe', email: 'john@videome.com' },
      { name: 'Jane Smith', email: 'jane@videome.com' },
      { name: 'Mike Johnson', email: 'mike@videome.com' },
    ];

    for (const userData of videomeUsers) {
      const existingUser = await User.findOne({ email: userData.email });
      if (!existingUser) {
        await User.create({
          name: userData.name,
          email: userData.email,
          password: 'password123',
          role: 'user',
          organization: videoMeOrg._id,
        });
        logger.info(`Created user: ${userData.name}`);
      } else {
        logger.info(`User ${userData.email} already exists`);
      }
    }

    // Create Acme Regular Users
    logger.info('Creating regular users for Acme Corp...');
    const acmeUsers = [
      { name: 'Robert Brown', email: 'robert@acme.com' },
      { name: 'Sarah Williams', email: 'sarah@acme.com' },
    ];

    for (const userData of acmeUsers) {
      const existingUser = await User.findOne({ email: userData.email });
      if (!existingUser) {
        await User.create({
          name: userData.name,
          email: userData.email,
          password: 'password123',
          role: 'user',
          organization: acmeOrg._id,
        });
        logger.info(`Created user: ${userData.name}`);
      } else {
        logger.info(`User ${userData.email} already exists`);
      }
    }

    // Create Tech Innovators Regular Users
    logger.info('Creating regular users for Tech Innovators...');
    const techUsers = [
      { name: 'David Miller', email: 'david@techinnovators.com' },
      { name: 'Emma Davis', email: 'emma@techinnovators.com' },
    ];

    for (const userData of techUsers) {
      const existingUser = await User.findOne({ email: userData.email });
      if (!existingUser) {
        await User.create({
          name: userData.name,
          email: userData.email,
          password: 'password123',
          role: 'user',
          organization: techOrg._id,
        });
        logger.info(`Created user: ${userData.name}`);
      } else {
        logger.info(`User ${userData.email} already exists`);
      }
    }

    logger.info('Seed completed successfully');
  } catch (error) {
    logger.error('Error seeding data:', error);
    throw error; // Re-throw to handle differently when called from index.ts
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

// Run the seed script if called directly
if (require.main === module) {
  main();
}

// Export for use in index.ts
export { seedData, connectDB };
