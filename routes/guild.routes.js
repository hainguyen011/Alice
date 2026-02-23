import express from 'express';
import * as guildController from '../controllers/guild.controller.js';

const router = express.Router();

// Channels
router.get('/channels', guildController.getAllChannels);
router.post('/channels', guildController.createChannel);
router.patch('/channels/:id', guildController.updateChannel);
router.delete('/channels/:id', guildController.deleteChannel);

// Guilds
router.get('/guilds', guildController.getAllGuilds);
router.post('/guilds', guildController.createGuild);
router.delete('/guilds/:id', guildController.deleteGuild);
router.get('/guilds/:guildId/discord-channels', guildController.getDiscordChannels);
router.post('/guilds/:guildId/sync-channels', guildController.syncChannels);

export default router;
