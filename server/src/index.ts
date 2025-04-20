import dotenv from 'dotenv';
import logger from './utils/logger';
import app from './app';
import { initializeSocketIO } from './webrtc/socket';
import { connectDB } from './config/database';
import { createServer } from 'http';

dotenv.config();

// Get port from environment variable
const PORT = process.env.PORT || 5000;

// Create HTTP server
const server = createServer(app);

// Socket.io setup
initializeSocketIO(server);

// Start the server
const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB();

    // Check if we should seed the database
    if (process.env.SEED_DB === 'true') {
      logger.info('Seeding database with initial data...');
      // Import and run seed function instead of inline code
      try {
        const { seedData } = require('./seed');
        await seedData();
        logger.info('Database seeded successfully');
      } catch (error) {
        logger.error(`Error seeding database: ${error}`);
      }
    }

    server.listen(PORT, () => {
      logger.info(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  logger.error('Unhandled Rejection:', err);
  // Close server & exit process
  server.close(() => process.exit(1));
});

startServer();
