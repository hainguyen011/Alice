import { getEmbedding } from './aiService.js'
import { searchKnowledge } from './qdrantService.js'

/**
 * Tìm kiếm ngữ cảnh liên quan nhất từ Qdrant dựa trên prompt người dùng
 */
export const getKnowledgeContext = async (query) => {
    try {
        const vector = await getEmbedding(query)
        const context = await searchKnowledge(vector, 3) // Lấy top 3 kết quả liên quan
        return context || 'Không tìm thấy thông tin bổ trợ liên quan trong tài liệu server.'
    } catch (error) {
        console.error('Error in getKnowledgeContext:', error)
        return ''
    }
}
