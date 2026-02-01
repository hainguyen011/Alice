import { getEmbedding } from './aiService.js'
import { searchKnowledge, searchKnowledgeDetail } from './qdrantService.js'

/**
 * Tìm kiếm ngữ cảnh từ Qdrant dựa trên RAG Mode của Bot
 * Modes: 
 * - global: Search all
 * - isolated: Search only bot-specific 
 * - hybrid: Search bot-specific + global
 */
export const getKnowledgeContext = async (query, botConfig = {}, withDetail = false) => {
    try {
        const vector = await getEmbedding(query, botConfig.api_key)
        const { ragMode = 'global', _id: botId } = botConfig;

        let filter = null;
        if (ragMode === 'isolated' && botId) {
            filter = {
                must: [{ key: 'botId', match: { value: botId.toString() } }]
            };
        } else if (ragMode === 'hybrid' && botId) {
            filter = {
                should: [
                    { key: 'botId', match: { value: botId.toString() } },
                    { key: 'isGlobal', match: { value: true } }
                ]
            };
        }

        if (withDetail) {
            return await searchKnowledgeDetail(vector, 3, filter);
        }

        const context = await searchKnowledge(vector, 3, filter)
        return context || 'Không tìm thấy thông tin bổ trợ liên quan trong tài liệu server.'
    } catch (error) {
        console.error('Error in getKnowledgeContext:', error)
        return withDetail ? [] : ''
    }
}
