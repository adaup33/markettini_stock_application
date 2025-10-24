'use server';

import {connectToDb} from "@/database/mongoose";

export const getAllUsersForNewsEmail = async () => {
    try {
        const mongoose = await connectToDb();
        const db = mongoose.connection.db;
        if(!db) throw new Error('Mongoose connection not connected');

        const users = await db.collection('user').find(
            { email: { $exists: true, $ne: null }},
            { projection: { _id: 1, id: 1, email: 1, name: 1, country:1 }}
        ).toArray();

        return users.filter((user) => user.email && user.name).map((user) => ({
            id: user.id || user._id?.toString() || '',
            email: user.email,
            name: user.name
        }))
    } catch (e) {
        console.error('Error fetching users for news email:', e)
        return []
    }
}

export const getUserProfile = async (email: string) => {
    try {
        const mongoose = await connectToDb();
        const db = mongoose.connection.db;
        if (!db) throw new Error('Mongoose connection not connected');

        const user = await db.collection('user').findOne({ email });
        if (!user) return null;

        return {
            id: user.id || user._id?.toString() || '',
            email: user.email,
            name: user.name,
            country: user.country || '',
            investmentGoals: user.investmentGoals || '',
            riskTolerance: user.riskTolerance || '',
            preferredIndustry: user.preferredIndustry || '',
        };
    } catch (e) {
        console.error('Error fetching user profile:', e);
        return null;
    }
}

export const updateUserProfile = async (email: string, data: {
    name: string;
    country: string;
    investmentGoals: string;
    riskTolerance: string;
    preferredIndustry: string;
}) => {
    try {
        const mongoose = await connectToDb();
        const db = mongoose.connection.db;
        if (!db) throw new Error('Mongoose connection not connected');

        const result = await db.collection('user').updateOne(
            { email },
            { $set: {
                name: data.name,
                country: data.country,
                investmentGoals: data.investmentGoals,
                riskTolerance: data.riskTolerance,
                preferredIndustry: data.preferredIndustry,
            }}
        );

        if (result.matchedCount === 0) {
            return { success: false, error: 'User not found' };
        }

        return { success: true };
    } catch (e) {
        console.error('Error updating user profile:', e);
        return { success: false, error: 'Failed to update profile' };
    }
}