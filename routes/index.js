import express from 'express';
import aiRoutes from './ai.routes.js';
import botRoutes from './bot.routes.js';
import guildRoutes from './guild.routes.js';
import knowledgeRoutes from './knowledge.routes.js';
import conversationRoutes from './conversation.routes.js';
import contentRoutes from './content.routes.js';
import campaignRoutes from './campaign.routes.js';
import facebookRoutes from './facebook.routes.js';

const router = express.Router();

router.use('/ai', aiRoutes);
router.use('/bots', botRoutes);
router.use('/', guildRoutes); // Guilds & Channels routes are flat under /api
router.use('/knowledge', knowledgeRoutes);
router.use('/conversations', conversationRoutes);
router.use('/', contentRoutes); // Posts, Schedules, Scripts are flat
router.use('/campaigns', campaignRoutes);
router.use('/webhooks/facebook', facebookRoutes);

export default router;
