import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import cookieParser from 'cookie-parser'
import connectDB from './services/database.js'
import { botManager } from './services/botService.js'
import { initCollection } from './services/qdrantService.js'
import * as authController from './controllers/authController.js'
import { authMiddleware } from './middleware/authMiddleware.js'
import { logger } from './services/loggerService.js'
import apiRoutes from './routes/index.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const PORT = process.env.DASHBOARD_PORT || 3000

const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:5174'
];

app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (allowedOrigins.includes(origin) || origin === process.env.FRONTEND_URL) {
        res.setHeader('Access-Control-Allow-Origin', origin);
    }
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Cookie');

    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});

app.use(express.json())
app.use(cookieParser())

// Serve static files from uploads folder
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}
app.use('/uploads', express.static(uploadDir));

// Middleware log yêu cầu
app.use((req, res, next) => {
    let logUrl = req.url;
    if (logUrl.includes('token=')) {
        logUrl = logUrl.replace(/token=[^&]+/, 'token=***');
    }
    logger.info(`${req.method} ${logUrl}`);
    next();
});

// Endpoint streaming log cho Terminal
app.get('/api/logs/stream', (req, res) => logger.handleSSE(req, res));

// --- Auth Routes ---
app.post('/api/auth/login', authController.login);
app.post('/api/auth/refresh', authController.refresh);
app.post('/api/auth/logout', authController.logout);

/**
 * Health Check & API Routes
 */
app.get('/api/health', (req, res) => res.json({ status: 'ok', time: new Date() }));

// --- Protected Routes Middleware ---
app.use('/api', (req, res, next) => {
    const publicPaths = ['/health', '/auth/login', '/auth/refresh', '/auth/logout', '/logs/stream'];
    if (publicPaths.some(path => req.path === path)) {
        return next();
    }
    return authMiddleware(req, res, next);
});

// --- Modular API Routes ---
app.use('/api', apiRoutes);

// Database and Bot initialization
connectDB().then(async () => {
    console.log('Connected to MongoDB Strategy...');
    await initCollection();
    await botManager.initializeBots();

    app.listen(PORT, () => {
        logger.system(`🚀 Dashboard API is running on http://localhost:${PORT}`);
    });
}).catch(err => {
    console.error('Database connection error:', err);
});
