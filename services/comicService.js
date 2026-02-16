import { Campaign, Chapter, Bot } from './models.js';
import { getAIResponse, getGenAI } from './aiService.js';
import { imageGenService } from './imageGenService.js';
import { botManager } from './botService.js';
import { createSuccessEmbed } from '../utils/embedHelper.js';

class ComicService {
    /**
     * Generate a new draft chapter for a campaign
     */
    async generateNextChapter(campaignId, userInstruction = null) {
        try {
            const campaign = await Campaign.findById(campaignId).populate('botId');
            if (!campaign) throw new Error('Campaign not found');

            const nextChapterNum = campaign.currentChapter + 1;

            console.log(`📖 Generating Chapter ${nextChapterNum} for Campaign: ${campaign.name}`);

            // 1. Generate Story Content using Gemini
            const systemInstruction = `
                Bạn là một nhà biên kịch truyện tranh chuyên nghiệp cho Discord.
                Chủ đề: ${campaign.theme}
                Phong cách: ${campaign.style}
                Nhiệm vụ: Viết chương tiếp theo cho chuỗi câu chuyện này.
                ${campaign.storyContext ? `\nNgữ cảnh toàn bộ câu chuyện:\n${campaign.storyContext}` : ''}
                
                Yêu cầu:
                1. Trình bày nội dung sạch sẽ, hấp dẫn, sử dụng Markdown Discord (In đậm, danh sách...).
                2. Cấu trúc truyện: ${campaign.config.discordStructure}.
                3. Tạo một tiêu đề ngắn gọn và nội dung kịch tính.
                4. Tạo một mô tả ngắn (Prompt) để vẽ tranh minh họa cho chương này.
                
                Trả về kết quả duy nhất dưới dạng JSON: 
                { 
                    "title": "Tiêu đề chương", 
                    "content": "Nội dung chi tiết chương truyện...", 
                    "imagePrompt": "Mô tả chi tiết để AI vẽ tranh (tiếng Anh)..." 
                }
            `.trim();

            const instructionToUse = userInstruction || campaign.nextChapterPrompt;
            const prompt = `Hãy viết Chương ${nextChapterNum} cho câu chuyện ${campaign.name}. 
            Dựa trên các tập trước (nếu có) để đảm bảo tính nhất quán.
            ${instructionToUse ? `\nHướng dẫn cụ thể cho chương này:\n${instructionToUse}` : ''}`;

            // Use campaign's custom API key if available, otherwise use bot's key
            const apiKey = campaign.apiKey || campaign.botId.api_key;
            const genAIInstance = getGenAI(apiKey);
            const model = genAIInstance.getGenerativeModel({
                model: campaign.botId.modelName || 'gemini-2.0-flash',
                systemInstruction
            });

            const result = await model.generateContent(prompt);
            const aiResponse = await result.response;
            const text = aiResponse.text();

            const jsonMatch = text.match(/\{.*\}/s);
            if (!jsonMatch) throw new Error('AI did not return valid JSON for story');
            const chapterData = JSON.parse(jsonMatch[0]);

            // 2. Generate Image using imageGenService
            let imageUrl = '';
            try {
                // Pass campaign's API key to image service
                const imageBotConfig = { ...campaign.botId._doc, api_key: apiKey };
                imageUrl = await imageGenService.generateImage(chapterData.imagePrompt, imageBotConfig, campaign.style);
            } catch (imgError) {
                console.error('Initial image generation failed:', imgError);
                // We keep going, the user can regenerate later
            }

            // 3. Create Chapter Draft
            const chapter = await Chapter.create({
                campaignId: campaign._id,
                chapterNumber: nextChapterNum,
                title: chapterData.title,
                content: chapterData.content,
                imagePrompt: chapterData.imagePrompt,
                userPrompt: instructionToUse,
                imageUrl,
                status: 'draft'
            });

            // Update campaign current chapter and clear one-time prompt
            campaign.currentChapter = nextChapterNum;
            campaign.nextChapterPrompt = null;
            await campaign.save();

            return chapter;

        } catch (error) {
            console.error('Error generating chapter:', error);
            throw error;
        }
    }

    /**
     * Publish a chapter to Discord
     */
    async publishChapter(chapterId) {
        try {
            const chapter = await Chapter.findById(chapterId);
            if (!chapter) throw new Error('Chapter not found');

            const campaign = await Campaign.findById(chapter.campaignId).populate('botId');
            if (!campaign) throw new Error('Campaign not found');

            const botData = campaign.botId;
            const client = botManager.clients.get(botData._id.toString());

            if (!client || !client.isReady()) {
                throw new Error(`Bot ${botData.name} is not active or ready.`);
            }

            const channel = await client.channels.fetch(campaign.channelId).catch(() => null);
            if (!channel) throw new Error(`Channel ${campaign.channelId} not found.`);

            // Prepare Embed
            const embed = createSuccessEmbed(chapter.content, botData);
            embed.setTitle(`Chapter ${chapter.chapterNumber}: ${chapter.title}`);

            if (chapter.imageUrl) {
                // If it's a local path, we might need to send it as attachment or use a public URL
                // For simplicity, assuming it's a URL or the server serves it
                const fullImageUrl = chapter.imageUrl.startsWith('http')
                    ? chapter.imageUrl
                    : `${process.env.BACKEND_URL || 'http://localhost:3000'}${chapter.imageUrl}`;

                embed.setImage(fullImageUrl);
            }

            embed.setFooter({ text: `Series: ${campaign.name} | Auto-generated by Alice` });
            embed.setTimestamp();

            await channel.send({ embeds: [embed] });

            chapter.status = 'sent';
            chapter.sentAt = new Date();
            await chapter.save();

            console.log(`✅ Successfully published Chapter ${chapter.chapterNumber} of ${campaign.name}`);
            return true;

        } catch (error) {
            console.error('Error publishing chapter:', error);
            if (chapterId) {
                await Chapter.findByIdAndUpdate(chapterId, { status: 'failed', error: error.message });
            }
            throw error;
        }
    }

    /**
     * Regenerate content for a chapter
     */
    async regenerateContent(chapterId) {
        try {
            const chapter = await Chapter.findById(chapterId);
            if (!chapter) throw new Error('Chapter not found');
            const campaign = await Campaign.findById(chapter.campaignId).populate('botId');

            const systemInstruction = `
                Bạn là một nhà biên kịch truyện tranh chuyên nghiệp cho Discord.
                Chủ đề: ${campaign.theme}
                Phong cách: ${campaign.style}
                Nhiệm vụ: Viết LẠI chương này. Có lẽ người dùng không thích bản cũ.
                ${campaign.storyContext ? `\nNgữ cảnh toàn bộ câu chuyện:\n${campaign.storyContext}` : ''}
                
                Yêu cầu:
                1. Trình bày nội dung sạch sẽ, hấp dẫn, sử dụng Markdown Discord.
                2. Cấu trúc truyện: ${campaign.config.discordStructure}.
                3. Tạo tiêu đề và nội dung mới kịch tính hơn.
                4. Tạo prompt vẽ tranh mới (tiếng Anh).
                
                Trả về JSON: { "title": "...", "content": "...", "imagePrompt": "..." }
            `.trim();

            // Use campaign's custom API key if available
            const apiKey = campaign.apiKey || campaign.botId.api_key;
            const genAIInstance = getGenAI(apiKey);
            const model = genAIInstance.getGenerativeModel({
                model: campaign.botId.modelName || 'gemini-2.0-flash',
                systemInstruction
            });

            const userPrompt = chapter.userPrompt || "";
            const prompt = `Hãy viết lại Chương ${chapter.chapterNumber} cho câu chuyện ${campaign.name}. 
            ${userPrompt ? `Dựa trên yêu cầu cũ: ${userPrompt}` : ''}
            Lưu ý: Hãy làm cho nó hấp dẫn và kịch tính hơn bản trước.`;

            const result = await model.generateContent(prompt);
            const aiResponse = await result.response;
            const text = aiResponse.text();

            const jsonMatch = text.match(/\{.*\}/s);
            if (!jsonMatch) throw new Error('AI did not return valid JSON');
            const chapterData = JSON.parse(jsonMatch[0]);

            chapter.title = chapterData.title;
            chapter.content = chapterData.content;
            chapter.imagePrompt = chapterData.imagePrompt;
            await chapter.save();

            return chapter;
        } catch (error) {
            console.error('Error regenerating content:', error);
            throw error;
        }
    }

    /**
     * Regenerate image for a chapter
     */
    async regenerateImage(chapterId, customPrompt = null) {
        try {
            const chapter = await Chapter.findById(chapterId);
            if (!chapter) throw new Error('Chapter not found');
            const campaign = await Campaign.findById(chapter.campaignId).populate('botId');

            const promptToUse = customPrompt || chapter.imagePrompt;
            // Use campaign's custom API key if available
            const apiKey = campaign.apiKey || campaign.botId.api_key;
            const imageBotConfig = { ...campaign.botId._doc, api_key: apiKey };
            const imageUrl = await imageGenService.generateImage(promptToUse, imageBotConfig, campaign.style);

            chapter.imageUrl = imageUrl;
            if (customPrompt) chapter.imagePrompt = customPrompt;
            await chapter.save();

            return chapter;
        } catch (error) {
            console.error('Error regenerating image:', error);
            throw error;
        }
    }
}

export const comicService = new ComicService();
