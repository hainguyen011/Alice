import mongoose from 'mongoose';

const botSchema = new mongoose.Schema({
    name: { type: String, required: true },
    discordName: { type: String },
    avatarUrl: { type: String },
    bot_token: { type: String }, // Optional for non-discord platforms
    clientId: { type: String },
    platform: { type: String, enum: ['discord', 'facebook', 'telegram'], default: 'discord' },
    platformConfig: {
        pageId: String,
        accessToken: String,
        verifyToken: String,
        webhookUrl: String
    },
    systemInstruction: { type: String },
    modelName: { type: String, default: 'gemini-2.0-flash' },
    api_key: { type: String },
    isActive: { type: Boolean, default: true },
    ragMode: { type: String, enum: ['global', 'isolated', 'hybrid'], default: 'global' },
    config: {
        embedTitle: String,
        footerText: String,
        colors: {
            success: String,
            warning: String,
            error: String
        }
    }
}, { timestamps: true });

const conversationSchema = new mongoose.Schema({
    botId: { type: mongoose.Schema.Types.ObjectId, ref: 'Bot' },
    platform: { type: String, enum: ['discord', 'facebook', 'telegram'], default: 'discord' },
    username: String,
    userId: String,
    message: String,
    response: String,
    channelId: String,
    channelType: { type: String, enum: ['dm', 'text', 'comment'], default: 'text' },
    timestamp: { type: Date, default: Date.now }
}, { timestamps: true });

const knowledgeSchema = new mongoose.Schema({
    qdrantId: { type: String, required: true }, // ID mapping to Qdrant vector
    botId: { type: mongoose.Schema.Types.ObjectId, ref: 'Bot', default: null },
    isGlobal: { type: Boolean, default: true },
    title: String,
    content: String,
    metadata: mongoose.Schema.Types.Mixed,
    timestamp: { type: Date, default: Date.now }
}, { timestamps: true });

const guildSchema = new mongoose.Schema({
    guildId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    isActive: { type: Boolean, default: true },
    description: String,
    metadata: mongoose.Schema.Types.Mixed
}, { timestamps: true });

const channelSchema = new mongoose.Schema({
    channelId: { type: String, required: true, unique: true },
    guildId: { type: String, required: true }, // Store Discord Guild ID
    name: { type: String, required: true },
    botId: { type: mongoose.Schema.Types.ObjectId, ref: 'Bot', default: null },
    isActive: { type: Boolean, default: true },
    description: String,
    metadata: mongoose.Schema.Types.Mixed
}, { timestamps: true });

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    refreshToken: { type: String },
    role: { type: String, enum: ['admin'], default: 'admin' }
}, { timestamps: true });

const postConfigSchema = new mongoose.Schema({
    color: String,
    imageUrl: String, // Main image (original)
    images: [String], // Array for multiple images grid
    thumbnailUrl: String,
    titleUrl: String,
    author: {
        name: String,
        icon_url: String,
        url: String
    },
    footer: {
        text: String,
        icon_url: String
    },
    showTimestamp: { type: Boolean, default: false }
}, { _id: false });

const postSchema = new mongoose.Schema({
    title: { type: String, required: true },
    content: { type: String, required: true },
    type: { type: String, enum: ['text', 'embed'], default: 'text' },
    config: { type: postConfigSchema, default: () => ({}) },
    botId: { type: mongoose.Schema.Types.ObjectId, ref: 'Bot', default: null }, // Mẫu cho Bot cụ thể
    authorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

const scheduleSchema = new mongoose.Schema({
    postId: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', required: true },
    botId: { type: mongoose.Schema.Types.ObjectId, ref: 'Bot', required: true },
    channelId: { type: String, required: true }, // Discord Channel ID
    scheduledAt: { type: Date },
    status: { type: String, enum: ['pending', 'sent', 'failed', 'cancelled'], default: 'pending' },
    type: { type: String, enum: ['once', 'recurring'], default: 'once' },
    cron: String, // Cho loại recurring
    lastRun: Date,
    error: String
}, { timestamps: true });

const scriptSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: String,
    isActive: { type: Boolean, default: true },
    steps: [{
        postId: { type: mongoose.Schema.Types.ObjectId, ref: 'Post' },
        delayMinutes: { type: Number, default: 0 }, // Trễ bao nhiêu phút kể từ bước trước
        channelId: String // Nếu null thì dùng mặc định
    }],
    botId: { type: mongoose.Schema.Types.ObjectId, ref: 'Bot' }
}, { timestamps: true });

const campaignSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: String,
    theme: { type: String, required: true }, // e.g., "GTAV City Stories"
    style: { type: String, default: 'Comics' }, // Comics, GTA Style, Anime...
    botId: { type: mongoose.Schema.Types.ObjectId, ref: 'Bot', required: true },
    channelId: { type: String, required: true },
    cron: { type: String, default: '0 9 * * 1' }, // Default: 9 AM every Monday
    currentChapter: { type: Number, default: 0 },
    storyContext: String, // Tổng quan cốt truyện hoặc hướng dẫn chung
    nextChapterPrompt: String, // Gợi ý cho chương tiếp theo (dùng 1 lần)
    apiKey: String, // Custom Gemini API key for this campaign (optional, overrides bot's key)
    isActive: { type: Boolean, default: true },
    config: {
        reviewRequired: { type: Boolean, default: true },
        autoRegenerateOnFail: { type: Boolean, default: true },
        discordStructure: { type: String, default: 'Standard Embed' }
    }
}, { timestamps: true });

const chapterSchema = new mongoose.Schema({
    campaignId: { type: mongoose.Schema.Types.ObjectId, ref: 'Campaign', required: true },
    chapterNumber: { type: Number, required: true },
    title: { type: String, required: true },
    content: { type: String, required: true },
    userPrompt: String, // Gợi ý cụ thể của người dùng cho chương này
    imageUrl: String,
    imagePrompt: String,
    status: { type: String, enum: ['draft', 'approved', 'sent', 'failed'], default: 'draft' },
    scheduledAt: Date,
    sentAt: Date,
    error: String
}, { timestamps: true });

export const Bot = mongoose.model('Bot', botSchema);
export const Conversation = mongoose.model('Conversation', conversationSchema);
export const Knowledge = mongoose.model('Knowledge', knowledgeSchema);
export const Guild = mongoose.model('Guild', guildSchema);
export const Channel = mongoose.model('Channel', channelSchema);
export const User = mongoose.model('User', userSchema);
export const Post = mongoose.model('Post', postSchema);
export const Schedule = mongoose.model('Schedule', scheduleSchema);
export const Script = mongoose.model('Script', scriptSchema);
export const Campaign = mongoose.model('Campaign', campaignSchema);
export const Chapter = mongoose.model('Chapter', chapterSchema);

