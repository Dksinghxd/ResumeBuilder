import mongoose from 'mongoose';
import config from './environment.js';
import logger from '../utils/logger.js';

const connectDB = async (): Promise<void> => {
  try {
    const uri =
      config.env === 'test' ? config.database.testUri : config.database.uri;

    await mongoose.connect(uri, {
      maxPoolSize: 10,
      minPoolSize: 5,
      serverSelectionTimeoutMS: 5000,
    });

    logger.info(`MongoDB connected successfully to ${uri}`);

    // Handle connection events
    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected');
    });

    mongoose.connection.on('error', (err) => {
      logger.error('MongoDB connection error:', err);
    });
  } catch (error) {
    logger.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

const disconnectDB = async (): Promise<void> => {
  try {
    await mongoose.disconnect();
    logger.info('MongoDB disconnected');
  } catch (error) {
    logger.error('MongoDB disconnection error:', error);
    process.exit(1);
  }
};

export { connectDB, disconnectDB };
