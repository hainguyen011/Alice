import cron from 'node-cron';
import { botManager } from './botService.js';
import { Post, Schedule } from './models.js';
import { createSuccessEmbed } from '../utils/embedHelper.js';

class SchedulerService {
    constructor() {
        this.job = null;
    }

    /**
     * Khởi động trình lập lịch (quét mỗi phút)
     */
    start() {
        if (this.job) {
            console.log('⏰ Scheduler is already running.');
            return;
        }

        console.log('🚀 Starting Scheduler Service (scanning for posts every minute)...');

        // Chạy mỗi phút
        this.job = cron.schedule('* * * * *', async () => {
            try {
                await this.processSchedules();
            } catch (error) {
                console.error('❌ Error in scheduler job:', error);
            }
        });
    }

    /**
     * Dừng trình lập lịch
     */
    stop() {
        if (this.job) {
            this.job.stop();
            this.job = null;
            console.log('🛑 Scheduler Service stopped.');
        }
    }

    /**
     * Xử lý các bài đăng đến hạn
     */
    async processSchedules() {
        const now = new Date();

        // Tìm các bài đăng đang chờ và đã đến giờ đăng
        const pendingSchedules = await Schedule.find({
            status: 'pending',
            scheduledAt: { $lte: now }
        }).populate('postId').populate('botId');

        if (pendingSchedules.length > 0) {
            console.log(`⏰ Found ${pendingSchedules.length} pending schedules to process.`);
        }

        for (const schedule of pendingSchedules) {
            try {
                await this.publishPost(schedule);
            } catch (error) {
                console.error(`❌ Failed to process schedule ${schedule._id}:`, error);
                schedule.status = 'failed';
                schedule.error = error.message;
                await schedule.save();
            }
        }
    }

    /**
     * Thực thi việc đăng bài lên Discord
     */
    async publishPost(schedule) {
        const { postId: post, botId: botData, channelId } = schedule;

        // 1. Lấy Discord Client của bot tương ứng
        const client = botManager.clients.get(botData._id.toString());

        if (!client || !client.isReady()) {
            throw new Error(`Bot ${botData.name} is not active or ready.`);
        }

        // 2. Tìm Channel trong Discord
        const channel = await client.channels.fetch(channelId).catch(() => null);
        if (!channel) {
            throw new Error(`Channel ${channelId} not found or inaccessible by bot.`);
        }

        // 3. Chuẩn bị nội dung gửi
        let messageOptions = {};

        if (post.type === 'embed') {
            const embeds = [];
            const createBase = () => {
                const embed = createSuccessEmbed(post.content, botData);
                embed.setTitle(post.title || botData.name);

                if (post.config) {
                    if (post.config.color) embed.setColor(post.config.color);
                    if (post.config.titleUrl) embed.setURL(post.config.titleUrl);
                    if (post.config.thumbnailUrl) embed.setThumbnail(post.config.thumbnailUrl);

                    if (post.config.author && post.config.author.name) {
                        embed.setAuthor({
                            name: post.config.author.name,
                            iconURL: post.config.author.icon_url || null,
                            url: post.config.author.url || null
                        });
                    }

                    if (post.config.footer && post.config.footer.text) {
                        embed.setFooter({
                            text: post.config.footer.text,
                            iconURL: post.config.footer.icon_url || null
                        });
                    }

                    if (post.config.showTimestamp) embed.setTimestamp();
                    else embed.setTimestamp(null);
                }
                return embed;
            };

            const mainEmbed = createBase();

            // Handle Multiple Images (Discord Grid Effect)
            // Rule: Same URL + Different Images = Grid
            const imageUrls = post.config?.images || [];
            if (post.config?.imageUrl) {
                if (!imageUrls.includes(post.config.imageUrl)) {
                    imageUrls.unshift(post.config.imageUrl);
                }
            }

            if (imageUrls.length > 0) {
                // Rule for Grid: All embeds must share the same URL
                const commonUrl = post.config?.titleUrl || 'https://discord.com';
                mainEmbed.setURL(commonUrl);
                mainEmbed.setImage(imageUrls[0]);
                embeds.push(mainEmbed);

                for (let i = 1; i < Math.min(imageUrls.length, 10); i++) {
                    const extraEmbed = createBase();
                    extraEmbed.setDescription(null);
                    extraEmbed.setTitle(null);
                    extraEmbed.setThumbnail(null); // No thumbnail in secondary embeds
                    extraEmbed.setURL(commonUrl);
                    extraEmbed.setImage(imageUrls[i]);
                    embeds.push(extraEmbed);
                }
            } else {
                embeds.push(mainEmbed);
            }

            messageOptions.embeds = embeds;
        } else {
            // Text thuần túy
            messageOptions.content = post.content;
        }

        // 4. Gửi bài đăng
        await channel.send(messageOptions);
        console.log(`✅ Successfully published post "${post.title}" via bot ${botData.name} to channel ${channel.name}`);

        // 5. Cập nhật trạng thái
        if (schedule.type === 'once') {
            schedule.status = 'sent';
            schedule.lastRun = new Date();
        } else if (schedule.type === 'recurring') {
            // Logic cho bài đăng định kỳ: Update scheduledAt tiếp theo dựa trên cron (nếu cần)
            // Tạm thời chỉ mark là sent nếu chưa xử lý recurring nâng cao
            schedule.lastRun = new Date();
            // Nếu có cron, ta sẽ tính toán scheduledAt tiếp theo ở đây
        }

        await schedule.save();
    }
}

export const schedulerService = new SchedulerService();
