import { Bot } from '../services/models.js';
import { botManager } from '../services/botService.js';
import { logger } from '../services/loggerService.js';

export const getAllBots = async (req, res) => {
    try {
        console.log('Fetching all bots from DB...');
        const bots = await Bot.find();
        res.json(bots);
    } catch (error) {
        logger.error(`Error in GET /api/bots: ${error.message}`);
        res.status(500).json({ error: error.message });
    }
};

export const createBot = async (req, res) => {
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
};

export const updateBot = async (req, res) => {
    try {
        console.log('Updating bot:', req.params.id, 'with data:', req.body);

        // Tránh ghi đè toàn bộ object config nếu chỉ gửi colors
        const updateData = { ...req.body };
        if (updateData.config && updateData.config.colors) {
            delete updateData.config;
            updateData['config.colors.success'] = req.body.config.colors.success;
        }

        // Tương tự cho platformConfig để tránh mất dữ liệu nếu chỉ cập nhật 1 trường
        if (updateData.platformConfig) {
            const pc = updateData.platformConfig;
            delete updateData.platformConfig;
            if (pc.pageId !== undefined) updateData['platformConfig.pageId'] = pc.pageId;
            if (pc.accessToken !== undefined) updateData['platformConfig.accessToken'] = pc.accessToken;
            if (pc.verifyToken !== undefined) updateData['platformConfig.verifyToken'] = pc.verifyToken;
            if (pc.webhookUrl !== undefined) updateData['platformConfig.webhookUrl'] = pc.webhookUrl;
        }

        const bot = await Bot.findByIdAndUpdate(req.params.id, updateData, { new: true });
        if (!bot) {
            return res.status(404).json({ error: 'Bot không tồn tại!' });
        }

        // Restart bot nếu có thay đổi quan trọng hoặc trạng thái active
        if (req.body.isActive === false) {
            await botManager.stopBot(req.params.id);
        } else if (
            req.body.isActive === true ||
            req.body.bot_token ||
            req.body.modelName ||
            req.body.systemInstruction ||
            req.body.platform ||
            req.body.platformConfig
        ) {
            await botManager.stopBot(req.params.id);
            await botManager.startBot(bot);
        }
        res.json(bot);
    } catch (error) {
        console.error('Error in PATCH /api/bots:', error);
        res.status(500).json({ error: `Lỗi Server: ${error.message}` });
    }
};

export const deleteBot = async (req, res) => {
    try {
        console.log('Deleting bot:', req.params.id);
        await botManager.stopBot(req.params.id);
        await Bot.findByIdAndDelete(req.params.id);
        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting bot:', error);
        res.status(500).json({ error: error.message });
    }
};

export const syncBotMetadata = async (req, res) => {
    try {
        console.log('Syncing metadata for bot:', req.params.id);
        const metadata = await botManager.syncMetadata(req.params.id);
        res.json(metadata);
    } catch (error) {
        console.error('Error syncing bot metadata:', error);
        res.status(500).json({ error: error.message });
    }
};
