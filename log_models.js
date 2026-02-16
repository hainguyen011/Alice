import 'dotenv/config';
import fs from 'fs';

async function logAllModels() {
    const apiKey = process.env.GEMINI_API_KEY;
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    const data = await response.json();
    fs.writeFileSync('all_models.json', JSON.stringify(data, null, 2));
    console.log('Saved all models to all_models.json');
    process.exit(0);
}

logAllModels();
