import dotenv from 'dotenv';
dotenv.config();

// Dynamic import to ensure process.env is populated before aiService.js is evaluated
async function main() {
    try {
        const { getEmbedding } = await import('./services/aiService.js');
        console.log('Testing embedding generation...');
        const text = "This is a test sentence for embedding.";
        const embedding = await getEmbedding(text);
        if (embedding && embedding.length > 0) {
            console.log('Success! Embedding generated.');
            console.log('Embedding length:', embedding.length);
        } else {
            console.error('Failed: No embedding returned.');
        }
    } catch (error) {
        console.error('Test Failed with Error:', error);
    }
}

main();
