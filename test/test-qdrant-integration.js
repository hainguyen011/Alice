import dotenv from 'dotenv';
dotenv.config();

async function testQdrant() {
    try {
        console.log('Imports starting...');
        const { getEmbedding } = await import('./services/aiService.js');
        const { upsertKnowledge, initCollection } = await import('./services/qdrantService.js');
        // uuid might need default import depending on how it's exported, but usually v4 is named
        const { v4: uuidv4 } = await import('uuid');

        console.log('Initializing collection...');
        await initCollection();

        console.log('Generating embedding...');
        const text = "Test knowledge for Qdrant integration.";
        const embedding = await getEmbedding(text);
        console.log('Embedding length:', embedding.length);

        console.log('Upserting to Qdrant...');
        const id = uuidv4();
        await upsertKnowledge(id, embedding, {
            content: text,
            botId: 'test-bot',
            isGlobal: true,
            created_at: new Date().toISOString()
        });
        console.log('Success! Knowledge upserted.');

    } catch (e) {
        console.error("Test failed:", e);
    }
}

testQdrant();
