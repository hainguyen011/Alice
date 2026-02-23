import { listModels, getAIResponse } from '../services/aiService.js';
import { Bot } from '../services/models.js';
import { logger } from '../services/loggerService.js';

export const getModels = async (req, res) => {
    try {
        const apiKey = req.query.apiKey;
        const models = await listModels(apiKey);
        res.json(models);
    } catch (error) {
        logger.error(`Error in GET /api/ai/models: ${error.message}`);
        res.status(500).json({ error: error.message });
    }
};

export const chatWithBot = async (req, res) => {
    try {
        const { botId, message, chatContext } = req.body;
        const bot = await Bot.findById(botId);

        if (!bot) {
            return res.status(404).json({ error: 'Bot không tồn tại!' });
        }

        const response = await getAIResponse(message, bot, {
            chatContext,
            withDetail: true,
            platform: bot.platform || 'discord'
        });

        res.json(response);
    } catch (error) {
        logger.error(`Error in POST /api/ai/chat: ${error.message}`);
        res.status(500).json({ error: error.message });
    }
};
