import { Channel, Guild } from '../services/models.js';
import { guildService } from '../services/guildService.js';

// --- Channels ---
export const getAllChannels = async (req, res) => {
    try {
        const channels = await Channel.find().populate('botId', 'name');
        res.json(channels);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const createChannel = async (req, res) => {
    try {
        const { channelId, name, botId, description } = req.body;
        const data = {
            channelId: channelId?.trim(),
            name: name?.trim(),
            botId: botId === '' ? null : botId,
            description: description?.trim(),
            isActive: true
        };
        const channel = await Channel.create(data);
        res.json(channel);
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({
                error: `Channel ID "${req.body.channelId}" đã được đăng ký trước đó.`
            });
        }
        res.status(500).json({ error: error.message });
    }
};

export const updateChannel = async (req, res) => {
    try {
        const data = { ...req.body };
        if (data.botId === '') data.botId = null;
        delete data._id;
        const channel = await Channel.findByIdAndUpdate(req.params.id, data, { new: true });
        res.json(channel);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const deleteChannel = async (req, res) => {
    try {
        await Channel.findByIdAndDelete(req.params.id);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// --- Guilds ---
export const getAllGuilds = async (req, res) => {
    try {
        const guilds = await Guild.find();
        res.json(guilds);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const createGuild = async (req, res) => {
    try {
        const guildId = req.body.guildId?.trim();
        const description = req.body.description?.trim();
        if (!guildId) return res.status(400).json({ error: 'Vui lòng nhập Guild ID' });

        const discordData = await guildService.fetchDiscordGuildData(guildId);
        const guild = await Guild.findOneAndUpdate(
            { guildId },
            { guildId, name: discordData.name, description, isActive: true },
            { upsert: true, new: true }
        );
        res.json(guild);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

export const getDiscordChannels = async (req, res) => {
    try {
        const data = await guildService.fetchDiscordGuildData(req.params.guildId);
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const syncChannels = async (req, res) => {
    try {
        const { channels } = req.body;
        const result = await guildService.syncChannels(req.params.guildId, channels);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const deleteGuild = async (req, res) => {
    try {
        const guild = await Guild.findById(req.params.id);
        if (guild) {
            await Guild.findByIdAndDelete(req.params.id);
        }
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
