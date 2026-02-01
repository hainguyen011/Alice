import 'dotenv/config';
import connectDB from './services/database.js';
import { botManager } from './services/botService.js';
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const start = async () => {
    // 1. Kết nối Database
    await connectDB();

    // 2. Khởi chạy Dashboard (server.js) như một process riêng hoặc import
    // Ở đây ta chạy như một process để tách biệt bot logic và dashboard logic
    const dashboard = spawn('node', ['server.js'], {
        stdio: 'inherit',
        shell: true
    });

    dashboard.on('close', (code) => {
        console.log(`Dashboard process exited with code ${code}`);
    });

    console.log('🚀 Multi-Bot System (Master) is delegating to Dashboard...');
};

start().catch(err => {
    console.error('Failed to start system:', err);
});
