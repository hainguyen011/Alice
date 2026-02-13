import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import connectDB from '../services/database.js';
import { User } from '../services/models.js';

const seedAdmin = async () => {
    try {
        await connectDB();

        const username = process.env.ADMIN_USERNAME || 'admin';
        const password = process.env.ADMIN_PASSWORD || 'admin123';

        const hashedPassword = await bcrypt.hash(password, 10);

        await User.findOneAndUpdate(
            { username },
            {
                username,
                password: hashedPassword,
                role: 'admin'
            },
            { upsert: true, new: true }
        );

        console.log('Admin account created/updated successfully!');

        console.log('Username:', username);
        console.log('Password:', password);
        process.exit(0);
    } catch (error) {
        console.error('Error seeding admin:', error);
        process.exit(1);
    }
};

seedAdmin();
