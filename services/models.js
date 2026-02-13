import mongoose from 'mongoose';

const botSchema = new mongoose.Schema({
    name: { type: String, required: true },
    discordName: { type: String },
    avatarUrl: { type: String },
    bot_token: { type: String, required: true },
    clientId: { type: String },
    systemInstruction: { type: String },
    modelName: { type: String, default: 'gemini-2.5-flash' },
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
    username: String,
    userId: String,
    message: String,
    response: String,
    channelId: String,
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

export const Bot = mongoose.model('Bot', botSchema);
export const Conversation = mongoose.model('Conversation', conversationSchema);
export const Knowledge = mongoose.model('Knowledge', knowledgeSchema);
export const Guild = mongoose.model('Guild', guildSchema);
export const Channel = mongoose.model('Channel', channelSchema);
export const User = mongoose.model('User', userSchema);

