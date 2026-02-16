import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import fs from 'fs'
import { v4 as uuidv4 } from 'uuid'
import connectDB from './services/database.js'
import { Bot, Conversation, Knowledge, Channel, Guild, Post, Schedule, Script, Campaign, Chapter } from './services/models.js'
import { comicService } from './services/comicService.js'
import { getEmbedding, getAIResponse, listModels } from './services/aiService.js'
import { schedulerService } from './services/schedulerService.js'
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
import { logger } from './services/loggerService.js'


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
        logger.error(`Error in GET /api/ai/models: ${error.message}`);
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
        logger.error(`Error in GET /api/bots: ${error.message}`);
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/bots', async (req, res) => {
    try {
        logger.info(`Creating new bot: ${req.body.name}`);
        const bot = await Bot.create(req.body);
        if (bot.isActive) {
            await botManager.startBot(bot);
        }
        res.json(bot);
    } catch (error) {
        logger.error(`Error in POST /api/bots: ${error.message}`);
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
 * Quản lý Bài viết (Posts)
 */
app.get('/api/posts', async (req, res) => {
    try {
        console.log('GET /api/posts - Fetching all posts');
        const posts = await Post.find().sort({ createdAt: -1 });
        res.json(posts);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/posts', async (req, res) => {
    try {
        console.log('--- POST /api/posts ---');
        console.log('Body:', JSON.stringify(req.body, null, 2));
        const post = await Post.create(req.body);
        console.log('Post created successfully:', post._id);
        res.json(post);
    } catch (error) {
        console.error('Error in POST /api/posts:', error);
        res.status(500).json({ error: error.message });
    }
});

app.patch('/api/posts/:id', async (req, res) => {
    try {
        console.log(`--- PATCH /api/posts/${req.params.id} (Improved) ---`);
        console.log('Update Body:', JSON.stringify(req.body, null, 2));

        const post = await Post.findById(req.params.id);
        if (!post) {
            console.warn('Post not found for update:', req.params.id);
            return res.status(404).json({ error: 'Bài viết không tồn tại!' });
        }

        // Explicitly map fields to ensure subdocument replacement
        post.title = req.body.title;
        post.content = req.body.content;
        post.type = req.body.type;

        // Deep replace the config object
        if (req.body.config) {
            post.config = req.body.config;
            post.markModified('config');
        }

        await post.save();

        console.log('Post updated successfully via .save()');
        res.json(post);
    } catch (error) {
        console.error('Error in PATCH /api/posts:', error);
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/posts/:id', async (req, res) => {
    try {
        console.log('DELETE /api/posts - Removing post:', req.params.id);
        await Post.findByIdAndDelete(req.params.id);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/posts/generate', async (req, res) => {
    try {
        const { prompt, botId } = req.body;
        if (!prompt) return res.status(400).json({ error: 'Prompt is required' });

        let bot = null;
        if (botId) bot = await Bot.findById(botId);

        const systemInstruction = `
            Bạn là một chuyên gia Content Creator cho Discord. 
            Nhiệm vụ: Dựa vào yêu cầu của người dùng, hãy viết một tiêu đề và nội dung bài đăng chuyên nghiệp, hấp dẫn.
            Yêu cầu:
            1. Trình bày nội dung sạch sẽ, sử dụng Markdown Discord phù hợp.
            2. Trả về kết quả DUY NHẤT dưới dạng JSON: { "title": "Tiêu đề", "content": "Nội dung", "suggestedColor": "#màu_hex" }
            3. Màu sắc gợi ý nên phù hợp với tâm trạng hoặc chủ đề của bài viết.
        `.trim();

        const genAIInstance = getGenAI(bot?.api_key);
        const model = genAIInstance.getGenerativeModel({
            model: bot?.modelName || 'gemini-2.0-flash',
            systemInstruction
        });

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        const jsonMatch = text.match(/\{.*\}/s);
        if (jsonMatch) {
            res.json(JSON.parse(jsonMatch[0]));
        } else {
            console.error('AI Generation Error - No JSON found:', text);
            res.status(500).json({ error: 'AI không trả về đúng định dạng JSON. Hãy thử lại.' });
        }
    } catch (error) {
        console.error('AI Post Generation Error:', error);
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/posts/publish', async (req, res) => {
    try {
        console.log('POST /api/posts/publish - Immediate dispatch request');
        const { postId, botId, channelId } = req.body;

        const post = await Post.findById(postId);
        const botData = await Bot.findById(botId);

        if (!post || !botData) {
            return res.status(404).json({ error: 'Post or Bot not found' });
        }

        const tempSchedule = { postId: post, botId: botData, channelId, type: 'once' };
        await schedulerService.publishPost(tempSchedule);
        res.json({ success: true });
    } catch (error) {
        console.error('Publish now error:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * Quản lý Lịch đăng (Schedules)
 */
app.get('/api/schedules', async (req, res) => {
    try {
        console.log('GET /api/schedules - Listing schedules');
        const schedules = await Schedule.find()
            .populate('postId')
            .populate('botId', 'name')
            .sort({ scheduledAt: 1 });
        res.json(schedules);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/schedules', async (req, res) => {
    try {
        console.log('POST /api/schedules - Creating new schedule');
        const schedule = await Schedule.create(req.body);
        res.json(schedule);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/schedules/:id', async (req, res) => {
    try {
        console.log('DELETE /api/schedules - Cancelling schedule:', req.params.id);
        await Schedule.findByIdAndDelete(req.params.id);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * Quản lý Kịch bản (Scripts)
 */
app.get('/api/scripts', async (req, res) => {
    try {
        console.log('GET /api/scripts - Fetching all scripts');
        const scripts = await Script.find().populate('steps.postId').populate('botId', 'name');
        res.json(scripts);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/scripts', async (req, res) => {
    try {
        console.log('POST /api/scripts - Creating new script chain');
        const script = await Script.create(req.body);
        res.json(script);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/scripts/:id/run', async (req, res) => {
    try {
        console.log('POST /api/scripts/:id/run - Kicking off script sequence');
        const script = await Script.findById(req.params.id);
        if (!script) return res.status(404).json({ error: 'Script not found' });

        const { botId, channelId } = req.body;
        const targetBotId = botId || script.botId;

        let currentTime = new Date();

        for (const step of script.steps) {
            currentTime = new Date(currentTime.getTime() + (step.delayMinutes || 0) * 60000);

            await Schedule.create({
                postId: step.postId,
                botId: targetBotId,
                channelId: step.channelId || channelId,
                scheduledAt: new Date(currentTime),
                type: 'once'
            });
        }

        res.json({ success: true, message: `Scheduled ${script.steps.length} steps.` });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * Quản lý Chiến dịch (Campaigns)
 */
app.get('/api/campaigns', async (req, res) => {
    try {
        const campaigns = await Campaign.find().populate('botId', 'name');
        res.json(campaigns);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/campaigns', async (req, res) => {
    try {
        const campaign = await Campaign.create(req.body);
        res.json(campaign);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.patch('/api/campaigns/:id', async (req, res) => {
    try {
        const campaign = await Campaign.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(campaign);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/campaigns/:id', async (req, res) => {
    try {
        await Campaign.findByIdAndDelete(req.params.id);
        await Chapter.deleteMany({ campaignId: req.params.id });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * Quản lý Chương (Chapters)
 */
app.get('/api/campaigns/:id/chapters', async (req, res) => {
    try {
        const chapters = await Chapter.find({ campaignId: req.params.id }).sort({ chapterNumber: -1 });
        res.json(chapters);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/campaigns/:id/generate', async (req, res) => {
    try {
        const { userInstruction } = req.body;
        const chapter = await comicService.generateNextChapter(req.params.id, userInstruction);
        res.json(chapter);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/chapters/:id/regenerate-content', async (req, res) => {
    try {
        const chapter = await comicService.regenerateContent(req.params.id);
        res.json(chapter);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/chapters/:id/regenerate-image', async (req, res) => {
    try {
        const { customPrompt } = req.body;
        const chapter = await comicService.regenerateImage(req.params.id, customPrompt);
        res.json(chapter);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/chapters/:id/publish', async (req, res) => {
    try {
        await comicService.publishChapter(req.params.id);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.patch('/api/chapters/:id', async (req, res) => {
    try {
        const chapter = await Chapter.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(chapter);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

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

    // Khởi động scheduler
    schedulerService.start();

    app.listen(PORT, () => {
        logger.system(`🚀 Alice Dashboard API running at http://localhost:${PORT}`);
    })
}

startServer();
