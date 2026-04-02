const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongoServer;

const connectDB = async () => {
    const envUri = process.env.MONGO_URI;
    let mongoUri = envUri || 'mongodb://127.0.0.1:27017/volunteer-system';

    if (!envUri) {
        console.warn('Warning: MONGO_URI is not defined. Trying local MongoDB at', mongoUri);
    }

    try {
        await mongoose.connect(mongoUri);
        console.log('MongoDB connected');
    } catch (err) {
        console.error('MongoDB connection error:', err.message);

        if (!envUri) {
            console.warn('Falling back to an in-memory MongoDB instance for development. Data will not persist after restart.');
            mongoServer = await MongoMemoryServer.create();
            const memoryUri = mongoServer.getUri();
            await mongoose.connect(memoryUri);
            console.log('Connected to in-memory MongoDB');
            return;
        }

        process.exit(1);
    }
};

module.exports = connectDB;