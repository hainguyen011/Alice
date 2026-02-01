import { Conversation } from './models.js';

/**
 * Lưu một cuộc hội thoại mới vào MongoDB
 */
export const logConversation = async (username, userId, message, response, botId = null) => {
    try {
        // Đảm bảo response là string
        const responseText = typeof response === 'string' ? response : (response?.text || JSON.stringify(response));

        await Conversation.create({
            botId,
            username,
            userId,
            message,
            response: responseText,
            timestamp: new Date()
        });
        return true;
    } catch (error) {
        console.error('Error logging conversation to MongoDB:', error);
        return false;
    }
};

/**
 * Lấy danh sách hội thoại từ MongoDB
 */
export const getConversations = async (limit = 100) => {
    try {
        return await Conversation.find()
            .sort({ timestamp: -1 })
            .limit(limit)
            .populate('botId', 'name');
    } catch (error) {
        console.error('Error getting conversations from MongoDB:', error);
        return [];
    }
};

/**
 * Đồng bộ lịch sử từ Discord
 */
export const syncDiscordHistory = async (client, targetChannelId = null) => {
    let syncCount = 0;
    try {
        console.log(`🔄 Đang bắt đầu đồng bộ lịch sử Discord ${targetChannelId ? `cho kênh ${targetChannelId}` : ''}...`);
        const guilds = await client.guilds.fetch();

        for (const [guildId, guildBase] of guilds) {
            const guild = await guildBase.fetch().catch(() => null);
            if (!guild) continue;

            const channels = await guild.channels.fetch().catch(() => new Map());

            for (const [channelId, channel] of channels) {
                if (channel.type !== 0) continue; // Only text channels
                if (targetChannelId && channelId !== targetChannelId) continue; // Filter if target specified

                try {
                    const messages = await channel.messages.fetch({ limit: 100 }).catch(() => new Map());
                    const sortedMessages = [...messages.values()].sort((a, b) => a.createdTimestamp - b.createdTimestamp);

                    for (let i = 0; i < sortedMessages.length; i++) {
                        const msg = sortedMessages[i];

                        if (msg.mentions.has(client.user.id) && !msg.author.bot) {
                            const content = msg.content
                                .replace(`<@${client.user.id}>`, '')
                                .replace(`<@!${client.user.id}>`, '')
                                .trim();

                            let nextMsg = null;
                            for (let j = i + 1; j < Math.min(i + 5, sortedMessages.length); j++) {
                                if (sortedMessages[j].author.id === client.user.id) {
                                    nextMsg = sortedMessages[j];
                                    break;
                                }
                            }

                            if (nextMsg) {
                                // Kiểm tra xem đã có trong MongoDB chưa
                                const exists = await Conversation.findOne({
                                    userId: msg.author.id,
                                    message: content,
                                    timestamp: {
                                        $gte: new Date(msg.createdTimestamp - 30000),
                                        $lte: new Date(msg.createdTimestamp + 30000)
                                    }
                                });

                                if (!exists) {
                                    await Conversation.create({
                                        botId: client.botConfig ? client.botConfig._id : null,
                                        timestamp: new Date(msg.createdTimestamp),
                                        username: msg.author.username,
                                        userId: msg.author.id,
                                        message: content,
                                        response: nextMsg.content
                                    });
                                    syncCount++;
                                }
                            }
                        }
                    }
                } catch (err) {
                    console.error(`Error in channel ${channel.name}:`, err.message);
                }
            }
        }
        return syncCount;
    } catch (error) {
        console.error('Error syncing Discord history:', error);
        return 0;
    }
};
