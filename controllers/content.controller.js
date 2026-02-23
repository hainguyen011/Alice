import { Post, Schedule, Script, Bot } from '../services/models.js';
import { schedulerService } from '../services/schedulerService.js';
import { getGenAI } from '../services/aiService.js';

// --- Posts ---
export const getAllPosts = async (req, res) => {
    try {
        const posts = await Post.find().sort({ createdAt: -1 });
        res.json(posts);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const createPost = async (req, res) => {
    try {
        const post = await Post.create(req.body);
        res.json(post);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const updatePost = async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) return res.status(404).json({ error: 'Bài viết không tồn tại!' });

        post.title = req.body.title;
        post.content = req.body.content;
        post.type = req.body.type;

        if (req.body.config) {
            post.config = req.body.config;
            post.markModified('config');
        }

        await post.save();
        res.json(post);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const deletePost = async (req, res) => {
    try {
        await Post.findByIdAndDelete(req.params.id);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const generatePost = async (req, res) => {
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
        if (jsonMatch) res.json(JSON.parse(jsonMatch[0]));
        else res.status(500).json({ error: 'AI không trả về đúng định dạng JSON.' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const publishPostNow = async (req, res) => {
    try {
        const { postId, botId, channelId } = req.body;
        const post = await Post.findById(postId);
        const botData = await Bot.findById(botId);
        if (!post || !botData) return res.status(404).json({ error: 'Post or Bot not found' });

        const tempSchedule = { postId: post, botId: botData, channelId, type: 'once' };
        await schedulerService.publishPost(tempSchedule);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// --- Schedules ---
export const getAllSchedules = async (req, res) => {
    try {
        const schedules = await Schedule.find()
            .populate('postId')
            .populate('botId', 'name')
            .sort({ scheduledAt: 1 });
        res.json(schedules);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const createSchedule = async (req, res) => {
    try {
        const schedule = await Schedule.create(req.body);
        res.json(schedule);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const deleteSchedule = async (req, res) => {
    try {
        await Schedule.findByIdAndDelete(req.params.id);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// --- Scripts ---
export const getAllScripts = async (req, res) => {
    try {
        const scripts = await Script.find().populate('steps.postId').populate('botId', 'name');
        res.json(scripts);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const createScript = async (req, res) => {
    try {
        const script = await Script.create(req.body);
        res.json(script);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const runScript = async (req, res) => {
    try {
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
};
