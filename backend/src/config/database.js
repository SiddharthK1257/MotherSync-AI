const mongoose = require('mongoose');

let isConnected = false;
let mockDbMode = false;
let activeConnection = null;

/**
 * Connects to MongoDB Atlas cluster using a reusable connection.
 * Default database name: pregnancy_guardian
 */
const connectDatabase = async () => {
  if (isConnected && mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  let uri = process.env.MONGODB_URI;

  if (!uri || uri.includes('<db_password>') || uri.includes('<password>')) {
    console.warn('\n?? [MongoDB Atlas] MONGODB_URI contains placeholder or is missing.');
    console.warn('   Running In-Memory State Store mode with full feature parity.\n');
    mockDbMode = true;
    isConnected = true;
    return null;
  }

  // Ensure default database name if none provided in URI
  if (!uri.includes('?') && !uri.split('?')[0].includes('/', 15)) {
    uri = uri + '/pregnancy_guardian?retryWrites=true&w=majority';
  }

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 6000,
      dbName: 'pregnancy_guardian'
    });

    isConnected = true;
    mockDbMode = false;
    activeConnection = conn;

    console.log('MongoDB connected successfully');
    return conn;
  } catch (error) {
    // Sanitize error message to prevent accidental credential leakage
    const sanitizedError = error.message.replace(/mongodb(\+srv)?:\/\/[^@]+@/i, 'mongodb+srv://***:***@');
    console.warn(`?? [MongoDB Connection Notice]: Failed to connect to remote cluster (${sanitizedError}). Using In-Memory fallback store.`);
    mockDbMode = true;
    isConnected = true;
    return null;
  }
};

const getStatus = () => ({
  connected: isConnected,
  mode: mockDbMode ? 'In-Memory State Store' : 'MongoDB Atlas (pregnancy_guardian)',
  readyState: mongoose.connection.readyState
});

module.exports = {
  connectDatabase,
  connectDB: connectDatabase,
  isConnected: () => isConnected,
  isMockMode: () => mockDbMode,
  getStatus
};
