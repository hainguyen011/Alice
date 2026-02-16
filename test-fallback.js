import 'dotenv/config';
import { imageGenService } from './services/imageGenService.js';
import { Bot } from './services/models.js';
import connectDB from './services/database.js';

async function testFallback() {
    await connectDB();
    const bot = await Bot.findOne();

    console.log('Testing fallback image generation...');
    try {
        const url = await imageGenService.generateImage(
            "Cyberpunk cityscape at night with neon lights",
            bot,
            "Comics"
        );
        console.log('✅ Image generated:', url);
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
    process.exit(0);
}

testFallback();
