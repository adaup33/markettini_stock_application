import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

declare global {
    // This augments the NodeJS global namespace so TS knows about our cache
    // Note: declare does not create the property; we assign it below on globalThis.
    var mongooseCache: {
        conn: typeof mongoose | null;
        promise: Promise<typeof mongoose> | null;
    } | undefined;
}

const globalWithCache = globalThis as unknown as {
    mongooseCache?: {
        conn: typeof mongoose | null;
        promise: Promise<typeof mongoose> | null;
    };
};

let cached = globalWithCache.mongooseCache;

if (!cached) {
    cached = {
        conn: null,
        promise: null,
    };
    globalWithCache.mongooseCache = cached;
}

export const connectToDb = async () => {
    if (!MONGODB_URI) throw new Error('MONGODB_URI is not defined within .env file');

    if (cached!.conn) {
        return cached!.conn;
    }

    if (!cached!.promise) {
        cached!.promise = mongoose.connect(MONGODB_URI, { bufferCommands: false });
    }

    try {
        cached!.conn = await cached!.promise;
    } catch (error) {
        cached!.promise = null;
        throw error;
    }

    console.log(`Connected to MongoDB: ${process.env.NODE_ENV} - ${MONGODB_URI}`);

    return cached!.conn;
};

