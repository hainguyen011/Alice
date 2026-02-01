import 'dotenv/config';
import connectDB from './services/database.js';
import { Bot, Conversation, Knowledge } from './services/models.js';
import { getAllKnowledge } from './services/qdrantService.js';
import { getConversations } from './services/conversationService.js';
import { ALICE_CONFIG } from './config/aliceConfig.js';

const migrate = async () => {
    await connectDB();

    console.log('🚀 Starting migration...');

    // 1. Migrate Alice Bot Configuration
    const existingAlice = await Bot.findOne({ name: 'Alice' });
    if (!existingAlice) {
        console.log('📦 Migrating Alice config...');
        await Bot.create({
            name: 'Alice',
            token: process.env.DISCORD_BOT_TOKEN,
            systemInstruction: ALICE_CONFIG.SYSTEM_INSTRUCTION,
            modelName: ALICE_CONFIG.MODEL_NAME,
            isActive: true,
            config: {
                embedTitle: ALICE_CONFIG.EMBED.TITLE,
                footerText: ALICE_CONFIG.EMBED.FOOTER_TEXT,
                colors: {
                    success: ALICE_CONFIG.EMBED.TYPES.SUCCESS.COLOR,
                    warning: ALICE_CONFIG.EMBED.TYPES.WARNING.COLOR,
                    error: ALICE_CONFIG.EMBED.TYPES.ERROR.COLOR
                }
            }
        });
        console.log('✅ Alice config migrated.');
    }

    // 2. Migrate Conversations
    const fileConversations = await getConversations();
    if (fileConversations.length > 0) {
        console.log(`📦 Migrating ${fileConversations.length} conversations...`);
        const aliceBot = await Bot.findOne({ name: 'Alice' });
        const logsToInsert = fileConversations.map(conv => ({
            botId: aliceBot._id,
            username: conv.username,
            userId: conv.userId,
            message: conv.message,
            response: conv.response,
            timestamp: new Date(conv.timestamp)
        }));

        // Simple deduplication or just insert
        await Conversation.insertMany(logsToInsert);
        console.log('✅ Conversations migrated.');
    }

    // 3. Migrate Knowledge Metadata from Qdrant
    console.log('📦 Resyncing Knowledge metadata from Qdrant...');
    const qdrantKnowledge = await getAllKnowledge();
    if (qdrantKnowledge && qdrantKnowledge.length > 0) {
        for (const k of qdrantKnowledge) {
            await Knowledge.findOneAndUpdate(
                { qdrantId: k.id },
                {
                    qdrantId: k.id,
                    title: k.payload.title,
                    content: k.payload.content,
                    timestamp: k.payload.timestamp ? new Date(k.payload.timestamp) : new Date()
                },
                { upsert: true }
            );
        }
        console.log('✅ Knowledge metadata synced.');
    }

    console.log('🎉 Migration complete!');
    process.exit(0);
};

migrate();
