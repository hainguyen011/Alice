import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import fs from 'fs';
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function listModels() {
    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`);
        const data = await response.json();

        let output = '';
        if (data.models) {
            output += 'Available Models:\n';
            data.models.forEach(m => {
                output += `- ${m.name} (${m.supportedGenerationMethods.join(', ')})\n`;
            });
        } else {
            output += 'No models found or error: ' + JSON.stringify(data);
        }
        fs.writeFileSync('models.txt', output);
        console.log('Models written to models.txt');
    } catch (error) {
        console.error('Error listing models:', error);
        fs.writeFileSync('models.txt', 'Error: ' + error.message);
    }
}

listModels();
