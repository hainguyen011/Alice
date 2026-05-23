import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import dns from 'node:dns';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Explicitly load .env from the root directory
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Fix for querySrv ECONNREFUSED on some networks/ISPs
dns.setServers(['1.1.1.1', '8.8.8.8']);

const connectDB = async () => {
    const uri = process.env.MONGODB_URI;

    if (!uri) {
        console.error('❌ Error: MONGODB_URI is not defined in .env file');
        console.error(`📂 Searching in: ${path.resolve(__dirname, '../.env')}`);
        process.exit(1);
    }

    try {
        const conn = await mongoose.connect(uri);
        console.log(`📡 MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`❌ MongoDB Connection Error: ${error.message}`);
        if (error.message.includes('ECONNREFUSED')) {
            console.error('👉 Tip: Check if your MongoDB Atlas IP Whitelist allows this connection.');
            console.error('👉 Tip: We have attempted to use Cloudflare/Google DNS to resolve the SRV record.');
        }
        process.exit(1);
    }
};

export default connectDB;
