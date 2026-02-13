import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { v4 as uuidv4 } from 'uuid'
import connectDB from './services/database.js'
import { Bot, Conversation, Knowledge, Channel, Guild } from './services/models.js'
import { getEmbedding, getAIResponse, listModels } from './services/aiService.js'
import {
    initCollection,
    upsertKnowledge,
    deleteKnowledge
} from './services/qdrantService.js'
import { getConversations, syncDiscordHistory } from './services/conversationService.js'
import { botManager } from './services/botService.js'
import { guildService } from './services/guildService.js'
import multer from 'multer'
import path from 'path'
import { fileURLToPath } from 'url'
import cookieParser from 'cookie-parser'
import * as authController from './controllers/authController.js'
import { authMiddleware } from './middleware/authMiddleware.js'


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


// Middleware log yêu cầu
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// --- API Routes (PHẢI TRƯỚC STATIC ĐỂ TRÁNH CONFLICT) ---

app.get('/api/health', (req, res) => res.json({ status: 'ok', time: new Date() }));

// --- Auth Routes ---
app.post('/api/auth/login', authController.login);
app.post('/api/auth/refresh', authController.refresh);
app.post('/api/auth/logout', authController.logout);

// --- Protected Routes Middleware ---
// Bảo vệ tất cả các API phía dưới trừ health check và auth
app.use('/api', (req, res, next) => {
    const publicPaths = ['/health', '/auth/login', '/auth/refresh', '/auth/logout'];
    if (publicPaths.some(path => req.path === path)) {
        return next();
    }
    return authMiddleware(req, res, next);
});


/**
 * AI Utilities
 */
app.get('/api/ai/models', async (req, res) => {
    try {
        const apiKey = req.query.apiKey;
        const models = await listModels(apiKey);
        res.json(models);
    } catch (error) {
        console.error('Error in GET /api/ai/models:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * Quản lý Bots
 */
app.get('/api/bots', async (req, res) => {
    try {
        console.log('Fetching all bots from DB...');
        const bots = await Bot.find();
        res.json(bots);
    } catch (error) {
        console.error('Error in GET /api/bots:', error);
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/bots', async (req, res) => {
    try {
        console.log('Creating new bot:', req.body.name, 'with data:', req.body);
        const bot = await Bot.create(req.body);
        if (bot.isActive) {
            await botManager.startBot(bot);
        }
        res.json(bot);
    } catch (error) {
        console.error('Error in POST /api/bots:', error);
        res.status(500).json({ error: error.message });
    }
});

app.patch('/api/bots/:id', async (req, res) => {
    try {
        console.log('Updating bot:', req.params.id, 'with data:', req.body);

        // Tránh ghi đè toàn bộ object config nếu chỉ gửi colors
        const updateData = { ...req.body };
        if (updateData.config && updateData.config.colors) {
            delete updateData.config;
            updateData['config.colors.success'] = req.body.config.colors.success;
        }

        const bot = await Bot.findByIdAndUpdate(req.params.id, updateData, { new: true });
        if (!bot) {
            return res.status(404).json({ error: 'Bot không tồn tại!' });
        }

        // Restart bot nếu có thay đổi quan trọng hoặc trạng thái active
        if (req.body.isActive === false) {
            await botManager.stopBot(req.params.id);
        } else if (req.body.isActive === true || req.body.bot_token || req.body.modelName || req.body.systemInstruction) {
            await botManager.stopBot(req.params.id);
            await botManager.startBot(bot);
        }
        res.json(bot);
    } catch (error) {
        console.error('Error in PATCH /api/bots:', error);
        res.status(500).json({ error: `Lỗi Server: ${error.message}` });
    }
});

app.delete('/api/bots/:id', async (req, res) => {
    try {
        console.log('Deleting bot:', req.params.id);
        await botManager.stopBot(req.params.id);
        await Bot.findByIdAndDelete(req.params.id);
        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting bot:', error);
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/bots/:id/sync', async (req, res) => {
    try {
        console.log('Syncing metadata for bot:', req.params.id);
        const metadata = await botManager.syncMetadata(req.params.id);
        res.json(metadata);
    } catch (error) {
        console.error('Error syncing bot metadata:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * Quản lý Channels
 */
app.get('/api/channels', async (req, res) => {
    try {
        const channels = await Channel.find().populate('botId', 'name');
        res.json(channels);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/channels', async (req, res) => {
    try {
        const { channelId, name, botId, description } = req.body;

        // Clean data strictly
        const data = {
            channelId: channelId?.trim(),
            name: name?.trim(),
            botId: botId === '' ? null : botId,
            description: description?.trim(),
            isActive: true
        };

        console.log('Final channel data to save:', data);

        const channel = await Channel.create(data);
        res.json(channel);
    } catch (error) {
        console.error('CRITICAL Error in POST /api/channels:', error);

        // Handle duplicate key error (MongoDB error code 11000)
        if (error.code === 11000) {
            return res.status(400).json({
                error: `Channel ID "${req.body.channelId}" đã được đăng ký trước đó. Vui lòng kiểm tra lại.`
            });
        }

        // Return detailed error for debugging
        res.status(500).json({
            error: 'Lỗi Server khi tạo channel',
            details: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

app.patch('/api/channels/:id', async (req, res) => {
    try {
        const data = { ...req.body };
        if (data.botId === '') data.botId = null;
        // _id không được phép thay đổi
        delete data._id;

        const channel = await Channel.findByIdAndUpdate(req.params.id, data, { new: true });
        res.json(channel);
    } catch (error) {
        console.error('Error in PATCH /api/channels:', error);
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/channels/:id', async (req, res) => {
    try {
        await Channel.findByIdAndDelete(req.params.id);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * Quản lý Guilds (Servers)
 */
app.get('/api/guilds', async (req, res) => {
    try {
        const guilds = await Guild.find();
        res.json(guilds);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/guilds', async (req, res) => {
    console.log('--- Incoming POST /api/guilds ---');
    console.log('Body:', req.body);
    try {
        const guildId = req.body.guildId?.trim();
        const description = req.body.description?.trim();

        if (!guildId) return res.status(400).json({ error: 'Vui lòng nhập Guild ID' });

        // Use guildService to verify guild existence and get name (auto-finds bot)
        const discordData = await guildService.fetchDiscordGuildData(guildId);
        console.log('Discord data found:', discordData.name);

        const guild = await Guild.findOneAndUpdate(
            { guildId },
            {
                guildId,
                name: discordData.name,
                description,
                isActive: true
            },
            { upsert: true, new: true }
        );

        res.json(guild);
    } catch (error) {
        console.error('Error in POST /api/guilds:', error);
        res.status(400).json({ error: error.message });
    }
});

app.get('/api/guilds/:guildId/discord-channels', async (req, res) => {
    try {
        const data = await guildService.fetchDiscordGuildData(req.params.guildId);
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/guilds/:guildId/sync-channels', async (req, res) => {
    try {
        const { channels } = req.body; // Array of { channelId, name, botId }
        const result = await guildService.syncChannels(req.params.guildId, channels);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/guilds/:id', async (req, res) => {
    try {
        const guild = await Guild.findById(req.params.id);
        if (guild) {
            // Optional: Delete associated channels?
            // await Channel.deleteMany({ guildId: guild.guildId });
            await Guild.findByIdAndDelete(req.params.id);
        }
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Static Files (Sau API)
// app.use(express.static('dashboard'))

/**
 * Thống kê kiến thức
 */
app.get('/api/knowledge', async (req, res) => {
    try {
        const data = await Knowledge.find().sort({ timestamp: -1 });
        res.json(data)
    } catch (error) {
        res.status(500).json({ status: 'error', error: error.message })
    }
})

/**
 * Thử nghiệm RAG (Playground)
 */
app.get('/api/knowledge/test', async (req, res) => {
    try {
        const { query, botId } = req.query;
        if (!query) return res.status(400).json({ error: 'Query is required' });

        let botConfig = { ragMode: 'global' };
        if (botId) {
            const bot = await Bot.findById(botId);
            if (bot) botConfig = bot;
        }

        const context = await getKnowledgeContext(query, botConfig);
        res.json({ context });
    } catch (error) {
        console.error('RAG Test Error:', error);
        res.status(500).json({ error: error.message });
    }
});

const upload = multer({ dest: 'uploads/' })

/**
 * Thêm kiến thức mới (Manual JSON)
 */
app.post('/api/knowledge', async (req, res) => {
    try {
        const { title, content, botId, isGlobal } = req.body;
        const qdrantId = uuidv4();
        const vector = await getEmbedding(content);

        // Metadata for Qdrant
        const payload = {
            title,
            content,
            botId: botId || null,
            isGlobal: isGlobal === 'true' || isGlobal === true
        };

        // 1. Lưu Qdrant
        await upsertKnowledge(qdrantId, vector, payload);

        // 2. Lưu MongoDB
        const knowledge = await Knowledge.create({
            qdrantId,
            title,
            content,
            botId: botId || null,
            isGlobal: isGlobal === 'true' || isGlobal === true,
            metadata: { originalFilename: req.file?.originalname }
        });

        res.json(knowledge);
    } catch (error) {
        console.error('Error adding knowledge:', error);
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/knowledge/upload', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ status: 'error', error: 'No file uploaded' })

        const filePath = req.file.path
        const content = fs.readFileSync(filePath, 'utf-8')
        const title = req.file.originalname
        const id = uuidv4()

        const vector = await getEmbedding(content)
        await upsertKnowledge(id, vector, { title, content, timestamp: new Date().toISOString() })

        const knowledge = await Knowledge.create({
            qdrantId: id,
            title,
            content,
            timestamp: new Date()
        });

        fs.unlinkSync(filePath)
        res.json({ success: true, knowledge })
    } catch (error) {
        res.status(500).json({ status: 'error', error: error.message })
    }
})

app.delete('/api/knowledge/:id', async (req, res) => {
    try {
        const knowledge = await Knowledge.findById(req.params.id);
        if (knowledge) {
            await deleteKnowledge(knowledge.qdrantId)
            await Knowledge.findByIdAndDelete(req.params.id);
        }
        res.json({ success: true })
    } catch (error) {
        res.status(500).json({ status: 'error', error: error.message })
    }
})

/**
 * Lấy lịch sử cuộc hội thoại
 */
app.get('/api/conversations', async (req, res) => {
    try {
        const data = await getConversations()
        res.json(data)
    } catch (error) {
        res.status(500).json({ status: 'error', error: error.message })
    }
})

app.post('/api/conversations/sync', async (req, res) => {
    try {
        const { botId, channelId } = req.body;
        console.log(`Sync request received - Bot: ${botId || 'Default'}, Channel: ${channelId || 'All'}`);

        let targetClient;
        if (botId) {
            targetClient = botManager.clients.get(botId);
        } else {
            // Fallback to first active bot if no botId provided
            targetClient = [...botManager.clients.values()][0];
        }

        if (!targetClient || !targetClient.isReady()) {
            return res.status(503).json({
                success: false,
                error: 'Discord client không khả dụng hoặc chưa sẵn sàng.'
            });
        }

        const count = await syncDiscordHistory(targetClient, channelId);
        res.json({ success: true, count });
    } catch (error) {
        console.error('Error in /api/conversations/sync:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * Chat trực tiếp với Bot (Playground)
 */
app.post('/api/chat', async (req, res) => {
    try {
        const { botId, message, chatContext } = req.body;
        if (!botId || !message) {
            return res.status(400).json({ error: 'botId and message are required' });
        }

        const bot = await Bot.findById(botId);
        if (!bot) {
            return res.status(404).json({ error: 'Bot không tồn tại' });
        }

        // Thực hiện chat với AI, yêu cầu chi tiết RAG
        const result = await getAIResponse(
            message,
            bot,
            chatContext,
            '', // availableRoles
            '', // availableChannels
            true // withDetail (RAG Debug)
        );

        res.json(result);
    } catch (error) {
        console.error('API Chat Error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Khởi tạo
const startServer = async () => {
    await connectDB();
    await initCollection();

    // Khởi tạo bots trong process này để API có thể truy cập Discord client
    await botManager.initializeBots();

    app.listen(PORT, () => {
        console.log(`🚀 Alice Dashboard API running at http://localhost:${PORT}`)
    })
}

startServer();
