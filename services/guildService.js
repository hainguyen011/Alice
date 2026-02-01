import { botManager } from './botService.js';
import { Channel } from './models.js';

class GuildService {
    /**
     * Fetch guild information and its channels from Discord
     * Automatically finds an active bot that is a member of the guild
     */
    async fetchDiscordGuildData(guildId) {
        let client = null;
        console.log(`🔍 Checking access for Guild ID: "${guildId}" among ${botManager.clients.size} active bots...`);

        // Find any active bot that has access to this guild
        for (const [id, botClient] of botManager.clients.entries()) {
            if (!botClient.isReady()) {
                console.log(`  - Bot ${id} is not ready, skipping.`);
                continue;
            }
            try {
                // Try searching in cache first for speed, then fetch
                let guild = botClient.guilds.cache.get(guildId);
                if (!guild) {
                    console.log(`  - Fetching guild ${guildId} for bot ${botClient.user.tag}...`);
                    guild = await botClient.guilds.fetch(guildId).catch(() => null);
                }

                if (guild) {
                    console.log(`  - ✅ Found! Bot ${botClient.user.tag} has access to "${guild.name}"`);
                    client = botClient;
                    break;
                } else {
                    console.log(`  - ❌ Bot ${botClient.user.tag} does NOT have access.`);
                }
            } catch (err) {
                console.log(`  - ⚠️ Error checking bot ${id}:`, err.message);
                continue;
            }
        }

        if (!client) {
            console.error(`❌ No bot found with access to ${guildId}. Found ${botManager.clients.size} bots in manager.`);
            throw new Error(`Bot Alice chưa được mời vào Server (ID: ${guildId}) hoặc ID bị sai. Vui lòng kiểm tra lại.`);
        }

        try {
            const guild = await client.guilds.fetch(guildId);
            if (!guild) throw new Error('Không tìm thấy Server Discord này.');

            const channels = await guild.channels.fetch();

            // Filter only text channels (type 0)
            const textChannels = channels
                .filter(c => c.type === 0)
                .map(c => ({
                    id: c.id,
                    name: c.name
                }));

            return {
                name: guild.name,
                channels: textChannels
            };
        } catch (error) {
            console.error('Error fetching Discord guild data:', error);
            throw new Error(`Lỗi Discord: ${error.message}`);
        }
    }

    /**
     * Sync selected channels to database
     */
    async syncChannels(guildId, selectedChannels) {
        const results = {
            added: 0,
            updated: 0
        };

        for (const ch of selectedChannels) {
            const existing = await Channel.findOne({ channelId: ch.channelId });

            if (existing) {
                existing.name = ch.name;
                existing.guildId = guildId;
                if (ch.botId) existing.botId = ch.botId;
                await existing.save();
                results.updated++;
            } else {
                await Channel.create({
                    channelId: ch.channelId,
                    guildId: guildId,
                    name: ch.name,
                    botId: ch.botId || null,
                    isActive: true
                });
                results.added++;
            }
        }
        return results;
    }
}

export const guildService = new GuildService();
