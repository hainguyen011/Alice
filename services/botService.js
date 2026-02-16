import { Bot } from './models.js';
import { Client, GatewayIntentBits, Collection } from 'discord.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { logger } from './loggerService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class BotManager {
    constructor() {
        this.clients = new Map();
    }

    async initializeBots() {
        const activeBots = await Bot.find({ isActive: true });
        logger.system(`🤖 Found ${activeBots.length} active bots to initialize.`);

        for (const botData of activeBots) {
            await this.startBot(botData);
        }
    }

    async startBot(botData) {
        const botId = botData._id.toString();
        if (this.clients.has(botId)) {
            logger.warn(`Bot ${botData.name} is already running.`, botId);
            return;
        }

        const client = new Client({
            intents: [
                GatewayIntentBits.Guilds,
                GatewayIntentBits.GuildMessages,
                GatewayIntentBits.MessageContent
            ]
        });

        client.botConfig = botData;
        client.commands = new Collection();

        // Load commands (sharing same commands directory for now)
        const commandsPath = path.join(__dirname, '../commands');
        if (fs.existsSync(commandsPath)) {
            const commandFiles = fs.readdirSync(commandsPath).filter(f => f.endsWith('.js'));
            for (const file of commandFiles) {
                const command = (await import(`../commands/${file}`)).default;
                client.commands.set(command.data.name, command);
            }
        }

        client.once('ready', () => {
            logger.info(`✅ ${botData.name} logged in as ${client.user.tag}`, botId);
        });

        client.on('messageCreate', async (message) => {
            if (message.author.bot) return;

            // 1. Luôn thêm tin nhắn vào bộ nhớ ngữ cảnh
            const { addMessageToMemory, getContext } = await import('./memoryService.js');
            addMessageToMemory(
                message.channelId,
                message.author.username,
                message.content,
                false // isBot = false
            );

            // 2. Kiểm tra Channel Management: Chỉ phản hồi nếu kênh được gán cho đúng Bot này
            const { Channel } = await import('./models.js');
            const channelConfig = await Channel.findOne({ channelId: message.channelId, isActive: true });

            if (!channelConfig || !channelConfig.botId || channelConfig.botId.toString() !== client.botConfig._id.toString()) {
                return;
            }

            if (!message.mentions.has(client.user)) return;

            // Xử lý Role Mentions
            let processedContent = message.content;
            if (message.guild) {
                message.mentions.roles.forEach(role => {
                    processedContent = processedContent.replace(`<@&${role.id}>`, `@${role.name}`);
                });
            }

            const contentForAI = processedContent
                .replace(`<@${client.user.id}>`, '')
                .replace(`<@!${client.user.id}>`, '')
                .trim();

            if (!contentForAI) return;

            try {
                const { getAIResponse, checkToxicity } = await import('./aiService.js');
                const { handleViolation } = await import('./moderationService.js');
                const { createSuccessEmbed } = await import('../utils/embedHelper.js');
                const { logConversation } = await import('./conversationService.js');

                // 2. Toxicity Check
                const toxicityResult = await checkToxicity(contentForAI, botData);
                if (toxicityResult.isToxic) {
                    const violated = await handleViolation(message, toxicityResult, botData);
                    if (violated) return;
                }

                // 3. Chuẩn bị ngữ cảnh
                const context = getContext(message.channelId);

                // Gửi hiệu ứng đang soạn tin nhắn
                await message.channel.sendTyping();

                let availableRoles = '';
                if (message.guild) {
                    const managementKeywords = ['admin', 'quản trị', 'staff', 'mod', 'helper', 'biên phòng', 'công an'];
                    availableRoles = message.guild.roles.cache
                        .filter(r => r.name !== '@everyone' && managementKeywords.some(kw => r.name.toLowerCase().includes(kw)))
                        .first(15)
                        .map(r => `- ${r.name}: <@&${r.id}>`)
                        .join('\n');
                }

                let availableChannels = '';
                if (message.guild) {
                    availableChannels = message.guild.channels.cache
                        .filter(c => c.type === 0)
                        .map(c => `- ${c.name}: <#${c.id}>`)
                        .join('\n');
                }

                // 4. AI Response
                const aiResponse = await getAIResponse(
                    contentForAI,
                    botData,
                    context,
                    availableRoles,
                    availableChannels,
                    false // withDetail = false -> expect string
                );

                // TRÍCH XUẤT TEXT LINH HOẠT (Hỗ trợ cả format cũ và mới)
                const aiText = typeof aiResponse === 'string' ? aiResponse : aiResponse.text;

                const embed = createSuccessEmbed(aiText, botData);
                if (botData.config?.colors?.success) {
                    embed.setColor(botData.config.colors.success);
                }

                await message.reply({ embeds: [embed] });

                logger.ai(`Generated response for ${message.author.username}`, botId);

                // 5. Lưu phản hồi của Bot và bộ nhớ
                addMessageToMemory(
                    message.channelId,
                    botData.name,
                    aiText,
                    true // isBot = true
                );

                await logConversation(
                    message.author.username,
                    message.author.id,
                    contentForAI,
                    aiText,
                    botData._id
                );
            } catch (error) {
                logger.error(`Error in bot ${botData.name} message handler: ${error.message}`, botId);
            }
        });

        try {
            await client.login(botData.bot_token);
            this.clients.set(botId, client);
            logger.info(`✅ ${botData.name} successfully connected to Discord!`, botId);
        } catch (error) {
            logger.error(`❌ Failed to login bot ${botData.name}: ${error.message}`, botId);
        }
    }

    async stopBot(botId) {
        const client = this.clients.get(botId);
        if (client) {
            client.destroy();
            this.clients.delete(botId);
            console.log(`Stopping bot with ID: ${botId}`);
        }
    }

    async syncMetadata(botId) {
        const client = this.clients.get(botId);
        if (!client || !client.user) {
            throw new Error('Bot client is not connected or user data is unavailable.');
        }

        const metadata = {
            discordName: client.user.username,
            avatarUrl: client.user.displayAvatarURL({ size: 256 })
        };

        await Bot.findByIdAndUpdate(botId, metadata);
        return metadata;
    }
}

export const botManager = new BotManager();
