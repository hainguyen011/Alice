import dotenv from 'dotenv';
dotenv.config();

// Define collection name locally to avoid import issues or just hardcode/import from service
const COLLECTION_NAME = 'alice_knowledge';

async function migrateCollection() {
    console.log('Starting migration...');

    // Dynamic imports to ensure env is loaded
    const { QdrantClient } = await import('@qdrant/js-client-rest');
    const { getEmbedding } = await import('./services/aiService.js');
    const { initCollection, upsertKnowledge } = await import('./services/qdrantService.js');

    const client = new QdrantClient({
        url: process.env.QDRANT_URL,
        apiKey: process.env.QDRANT_API_KEY,
    });

    try {
        // 1. Fetch all existing data
        console.log('Fetching existing knowledge...');
        const allPoints = [];
        let nextOffset = null;

        do {
            const result = await client.scroll(COLLECTION_NAME, {
                limit: 100,
                with_payload: true,
                with_vector: false,
                offset: nextOffset
            });
            allPoints.push(...result.points);
            nextOffset = result.next_page_offset;
        } while (nextOffset);

        console.log(`Found ${allPoints.length} existing knowledge items.`);

        // 2. Delete existing collection
        console.log('Deleting old collection...');
        await client.deleteCollection(COLLECTION_NAME);
        console.log('Old collection deleted.');

        // 3. Re-create collection (initCollection now uses 3072 size)
        console.log('Re-creating collection with new vector size...');
        await initCollection();

        // 4. Re-embed and Upsert
        console.log('Re-embedding and migrating data...');
        let successCount = 0;
        let failCount = 0;

        for (const point of allPoints) {
            try {
                const content = point.payload.content;
                if (!content) {
                    console.warn(`Skipping point ${point.id} due to missing content.`);
                    continue;
                }

                console.log(`Processing: ${point.id} - ${content.substring(0, 30)}...`);

                // Generate new embedding
                const newVector = await getEmbedding(content);

                // Upsert back
                await upsertKnowledge(point.id, newVector, point.payload);
                successCount++;

                // Add a small delay to avoid rate limits if necessary
                await new Promise(resolve => setTimeout(resolve, 500));

            } catch (err) {
                console.error(`Failed to migrate point ${point.id}:`, err);
                failCount++;
            }
        }

        console.log('Migration completed!');
        console.log(`Successfully migrated: ${successCount}`);
        console.log(`Failed: ${failCount}`);

    } catch (error) {
        console.error('Migration failed:', error);
    }
}

migrateCollection();
