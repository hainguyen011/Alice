import axios from 'axios';
import { logger } from './loggerService.js';
import { Bot, Conversation } from './models.js';
import { getAIResponse } from './aiService.js';
import { getKnowledgeContext } from './ragService.js';

class FacebookService {
    constructor() {
        this.graphUrl = 'https://graph.facebook.com/v19.0';
    }

    /**
     * Xác thực Webhook từ Facebook Meta
     */
    verifyWebhook(req, res) {
        const mode = req.query['hub.mode'];
        const token = req.query['hub.verify_token'];
        const challenge = req.query['hub.challenge'];

        if (mode && token) {
            if (mode === 'subscribe') {
                // Chúng ta sẽ cần tìm bot có verifyToken khớp
                // Tạm thời trả về challenge nếu có token
                logger.info('Facebook Webhook verified.');
                res.status(200).send(challenge);
            } else {
                res.sendStatus(403);
            }
        }
    }

    /**
     * Xử lý tin nhắn đến từ Webhook
     */
    async handleWebhook(req, res) {
        const body = req.body;

        if (body.object === 'page') {
            body.entry.forEach(async (entry) => {
                const webhookEvent = entry.messaging?.[0];
                if (webhookEvent && webhookEvent.message) {
                    await this.processMessage(webhookEvent, entry.id);
                }
            });
            res.status(200).send('EVENT_RECEIVED');
        } else {
            res.sendStatus(404);
        }
    }

    /**
     * Xử lý logic hội thoại AI cho Facebook
     */
    async processMessage(event, pageId) {
        const senderId = event.sender.id;
        const messageText = event.message.text;

        if (!messageText) return;

        try {
            // 1. Tìm Bot tương ứng với Page ID
            const bot = await Bot.findOne({ 'platformConfig.pageId': pageId, platform: 'facebook', isActive: true });
            if (!bot) {
                logger.error(`No active Facebook bot found for Page ID: ${pageId}`);
                return;
            }

            // 2. Lấy ngữ cảnh RAG
            const contextText = await getKnowledgeContext(messageText, bot);

            // 3. Gọi AI Gemini
            const aiResponse = await getAIResponse(messageText, bot, {
                chatContext: `User Facebook ID: ${senderId}`,
                platform: 'facebook',
                withDetail: false
            });

            // 4. Gửi phản hồi qua Messenger
            await this.sendMessage(senderId, aiResponse, bot.platformConfig.accessToken);

            // 5. Lưu lịch sử hội thoại
            await Conversation.create({
                botId: bot._id,
                platform: 'facebook',
                userId: senderId,
                username: 'Messenger User',
                message: messageText,
                response: aiResponse,
                channelId: senderId,
                channelType: 'dm'
            });

        } catch (error) {
            logger.error(`Error processing Facebook message: ${error.message}`);
        }
    }

    /**
     * Gửi tin nhắn qua Facebook Graph API
     */
    async sendMessage(recipientId, text, accessToken) {
        try {
            await axios.post(`${this.graphUrl}/me/messages?access_token=${accessToken}`, {
                recipient: { id: recipientId },
                message: { text }
            });
            logger.info(`Sent Messenger response to ${recipientId}`);
        } catch (error) {
            logger.error(`Facebook API Error: ${error.response?.data?.error?.message || error.message}`);
        }
    }
}

export const facebookService = new FacebookService();
