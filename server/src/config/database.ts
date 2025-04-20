import mongoose from 'mongoose';
import { config } from './config';
import logger from '../utils/logger';

/**
 * Connect to MongoDB database
 */
export const connectDB = async (): Promise<void> => {
  try {
    const conn = await mongoose.connect(config.mongoUri);

    logger.info(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    logger.error(`Error connecting to MongoDB: ${error}`);
    // Exit process with failure
    process.exit(1);
  }
};
