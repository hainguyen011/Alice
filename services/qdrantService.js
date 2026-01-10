import { QdrantClient } from '@qdrant/js-client-rest'

const client = new QdrantClient({
    url: process.env.QDRANT_URL,
    apiKey: process.env.QDRANT_API_KEY,
})

const COLLECTION_NAME = 'alice_knowledge'

/**
 * Khởi tạo Collection trong Qdrant
 */
export const initCollection = async () => {
    try {
        const collections = await client.getCollections()
        const exists = collections.collections.some(c => c.name === COLLECTION_NAME)

        if (!exists) {
            await client.createCollection(COLLECTION_NAME, {
                vectors: {
                    size: 768, // Kích thước vector của text-embedding-004
                    distance: 'Cosine'
                }
            })
            console.log(`✅ Created collection: ${COLLECTION_NAME}`)
        }
    } catch (error) {
        console.error('Qdrant Init Error:', error)
    }
}

/**
 * Thêm hoặc cập nhật kiến thức vào Qdrant
 */
export const upsertKnowledge = async (id, vector, payload) => {
    try {
        await client.upsert(COLLECTION_NAME, {
            wait: true,
            points: [
                {
                    id: id,
                    vector: vector,
                    payload: payload
                }
            ]
        })
    } catch (error) {
        console.error('Qdrant Upsert Error:', error)
        throw error
    }
}

/**
 * Tìm kiếm kiến thức liên quan nhất
 */
export const searchKnowledge = async (vector, limit = 3) => {
    try {
        const results = await client.search(COLLECTION_NAME, {
            vector: vector,
            limit: limit,
            with_payload: true
        })
        return results.map(r => r.payload.content).join('\n---\n')
    } catch (error) {
        console.error('Qdrant Search Error:', error)
        return ''
    }
}

/**
 * Lấy tất cả kiến thức (cho Dashboard)
 */
export const getAllKnowledge = async () => {
    try {
        const results = await client.scroll(COLLECTION_NAME, {
            limit: 100,
            with_payload: true,
            with_vector: false
        })
        return results.points
    } catch (error) {
        console.error('Qdrant Scroll Error:', error)
        return []
    }
}

/**
 * Xóa kiến thức
 */
export const deleteKnowledge = async (id) => {
    try {
        await client.delete(COLLECTION_NAME, {
            points: [id]
        })
    } catch (error) {
        console.error('Qdrant Delete Error:', error)
        throw error
    }
}
