import 'dotenv/config';
import { imageGenService } from './services/imageGenService.js';
import { Bot } from './services/models.js';
import connectDB from './services/database.js';

async function testImageGen() {
    await connectDB();
    const bot = await Bot.findOne();
    if (!bot) {
        console.error('No bot found in DB to test with');
        process.exit(1);
    }

    console.log('Testing image generation with Imagen 4.0...');
    try {
        const url = await imageGenService.generateImage("A Cyberpunk city with neon lights, high contrast, cinematic lighting", bot, "GTAV");
        console.log('✅ Success! Image generated at:', url);
    } catch (error) {
        console.error('❌ Failed:', error.message);
    }
    process.exit(0);
}

testImageGen();
