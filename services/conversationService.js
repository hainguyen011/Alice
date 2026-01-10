import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const LOG_FILE = path.join(__dirname, '../logs/conversations.json');

// Đảm bảo thư mục logs tồn tại
const logsDir = path.dirname(LOG_FILE);
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}

// Đảm bảo file log tồn tại và là một array
if (!fs.existsSync(LOG_FILE)) {
    fs.writeFileSync(LOG_FILE, JSON.stringify([], null, 2));
}

/**
 * Lưu một cuộc hội thoại mới
 */
export const logConversation = async (username, userId, message, response) => {
    try {
        const conversations = JSON.parse(fs.readFileSync(LOG_FILE, 'utf-8'));

        const newEntry = {
            id: Date.now().toString(),
            timestamp: new Date().toISOString(),
            username,
            userId,
            message,
            response
        };

        conversations.unshift(newEntry);

        // Giới hạn 100 cuộc hội thoại gần nhất
        if (conversations.length > 100) {
            conversations.splice(100);
        }

        fs.writeFileSync(LOG_FILE, JSON.stringify(conversations, null, 2));
        return true;
    } catch (error) {
        console.error('Error logging conversation:', error);
        return false;
    }
};

/**
 * Lấy danh sách hội thoại
 */
export const getConversations = async () => {
    try {
        const data = fs.readFileSync(LOG_FILE, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error getting conversations:', error);
        return [];
    }
};

/**
 * Đồng bộ lịch sử từ Discord
 */
export const syncDiscordHistory = async (client) => {
    let syncCount = 0;
    try {
        console.log('🔄 Đang bắt đầu đồng bộ lịch sử Discord...');
        const conversations = JSON.parse(fs.readFileSync(LOG_FILE, 'utf-8'));
        const guilds = await client.guilds.fetch();
        console.log(`📡 Đã tìm thấy ${guilds.size} server.`);

        for (const [guildId, guildBase] of guilds) {
            const guild = await guildBase.fetch().catch(() => null);
            if (!guild) {
                console.log(`⚠️ Không thể tải server ${guildId}`);
                continue;
            }

            console.log(`🏰 Đang xử lý server: ${guild.name}`);
            const channels = await guild.channels.fetch().catch(() => new Map());

            for (const [channelId, channel] of channels) {
                // Chỉ quét các channel văn bản (type 0 là GUILD_TEXT)
                if (channel.type !== 0) continue;

                console.log(`  📁 Đang quét channel: ${channel.name}`);
                try {
                    const messages = await channel.messages.fetch({ limit: 100 }).catch((err) => {
                        console.log(`    ❌ Lỗi khi tải tin nhắn trong ${channel.name}: ${err.message}`);
                        return new Map();
                    });

                    console.log(`    📜 Đã tải ${messages.size} tin nhắn.`);
                    const sortedMessages = [...messages.values()].sort((a, b) => a.createdTimestamp - b.createdTimestamp);

                    for (let i = 0; i < sortedMessages.length; i++) {
                        const msg = sortedMessages[i];

                        // Nếu tin nhắn nhắc đến bot và không phải của bot
                        if (msg.mentions.has(client.user.id) && !msg.author.bot) {
                            const content = msg.content
                                .replace(`<@${client.user.id}>`, '')
                                .replace(`<@!${client.user.id}>`, '')
                                .trim();

                            // Tìm phản hồi của bot trong vài tin nhắn tiếp theo
                            let nextMsg = null;
                            for (let j = i + 1; j < Math.min(i + 5, sortedMessages.length); j++) {
                                if (sortedMessages[j].author.id === client.user.id) {
                                    nextMsg = sortedMessages[j];
                                    break;
                                }
                            }

                            if (nextMsg) {
                                // Kiểm tra xem đã có trong log chưa (tránh trùng)
                                const exists = conversations.some(c =>
                                    c.userId === msg.author.id &&
                                    c.message === content &&
                                    Math.abs(new Date(c.timestamp).getTime() - msg.createdTimestamp) < 30000
                                );

                                if (!exists) {
                                    console.log(`    ✨ Đã tìm thấy hội thoại mới từ ${msg.author.username}`);
                                    conversations.unshift({
                                        id: msg.id,
                                        timestamp: new Date(msg.createdTimestamp).toISOString(),
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
                    console.error(`    ❌ Lỗi nghiêm trọng trong channel ${channel.name}:`, err.message);
                }
            }
        }

        console.log(`✅ Hoàn tất đồng bộ. Đã thêm ${syncCount} cuộc hội thoại mới.`);

        if (syncCount > 0) {
            conversations.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
            if (conversations.length > 100) conversations.splice(100);
            fs.writeFileSync(LOG_FILE, JSON.stringify(conversations, null, 2));
        }

        return syncCount;
    } catch (error) {
        console.error('Error syncing Discord history:', error);
        return 0;
    }
};
