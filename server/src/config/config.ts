import dotenv from 'dotenv';
dotenv.config();

// Configuration interface
interface Config {
  port: number;
  nodeEnv: string;
  mongoUri: string;
  jwtSecret: string;
  jwtExpiresIn: string;
  corsOrigin: string;
  logLevel: string;
  turnServerUrl?: string;
  turnServerUsername?: string;
  turnServerCredential?: string;
}

// Export configuration with sensible defaults
export const config: Config = {
  port: parseInt(process.env.PORT || '5000'),
  nodeEnv: process.env.NODE_ENV || 'development',
  mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/videome',
  jwtSecret: process.env.JWT_SECRET || 'development_secret_key',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  logLevel: process.env.LOG_LEVEL || 'info',
  turnServerUrl: process.env.TURN_SERVER_URL,
  turnServerUsername: process.env.TURN_SERVER_USERNAME,
  turnServerCredential: process.env.TURN_SERVER_CREDENTIAL,
}; 