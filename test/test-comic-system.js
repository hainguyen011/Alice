import 'dotenv/config';
import connectDB from '../services/database.js';
import { Campaign, Chapter, Bot } from '../services/models.js';
import { comicService } from '../services/comicService.js';
import mongoose from 'mongoose';

async function testSystem() {
    try {
        await connectDB();
        console.log('Connected to DB');

        // 1. Get a bot to use
        const bot = await Bot.findOne({ isActive: true });
        if (!bot) {
            console.log('No active bot found for test. Please create one first.');
            process.exit(0);
        }

        // 2. Create a test campaign
        const campaign = await Campaign.create({
            name: "Vibe City Chronicles (Test)",
            theme: "GTAV Old City Life",
            style: "GTA V Style",
            botId: bot._id,
            channelId: "123456789", // Placeholder
            cron: "0 9 * * 1",
            isActive: true
        });
        console.log('Created test campaign:', campaign.name);

        // 3. Generate a chapter
        console.log('Generating first chapter...');
        const chapter = await comicService.generateNextChapter(campaign._id);
        console.log('Generated Chapter:', chapter.chapterNumber, chapter.title);
        console.log('Content snippet:', chapter.content.substring(0, 50) + '...');
        console.log('Image URL:', chapter.imageUrl);

        // 4. Generate a chapter with GUIDED instruction
        console.log('Generating guided chapter...');
        const guidedChapter = await comicService.generateNextChapter(campaign._id, "Main character finds a mysterious artifact in the desert.");
        console.log('Guided Chapter:', guidedChapter.chapterNumber, guidedChapter.title);
        console.log('Content snippet:', guidedChapter.content.substring(0, 100) + '...');
        if (guidedChapter.content.toLowerCase().includes('artifact') || guidedChapter.content.toLowerCase().includes('desert')) {
            console.log('✅ Guided generation successful (matched keywords)');
        }

        // 5. Verify chapter draft
        const draft = await Chapter.findById(guidedChapter._id);
        if (draft.status === 'draft' && draft.userPrompt) {
            console.log('✅ Guided chapter saved with prompt metadata');
        }

        console.log('Test completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Test failed:', error);
        process.exit(1);
    }
}

testSystem();
