import { GoogleGenerativeAI } from '@google/generative-ai'
import { ALICE_CONFIG } from '../config/aliceConfig.js'
import { getKnowledgeContext } from './ragService.js'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
const model = genAI.getGenerativeModel({
    model: ALICE_CONFIG.MODEL_NAME,
    systemInstruction: ALICE_CONFIG.SYSTEM_INSTRUCTION
})

export const getAIResponse = async (prompt, chatContext = '', availableRoles = '') => {
    try {
        const context = await getKnowledgeContext(prompt)

        const finalPrompt = `
Dưới đây là thông tin bổ trợ từ hệ thống tài liệu server:
${context}

Dưới đây là tóm tắt ngữ cảnh cuộc hội thoại trước đó (nếu có):
${chatContext || "Chưa có ngữ cảnh."}

${availableRoles ? `\nNgoài ra, đây là danh sách các Role có sẵn trong server. Nếu vấn đề vượt quá khả năng của bạn hoặc cần sự trợ giúp từ người thật, hãy tag role phù hợp (sử dụng cú pháp <@&ID>):\n${availableRoles}` : ''}

Dựa vào các thông tin trên và nhân quyền hạn của bạn, hãy trả lời câu hỏi sau của người chơi. 
Lưu ý: 
1. Nếu tài liệu có định dạng danh sách hoặc tiêu đề, hãy trình bày lại một cách sạch sẽ bằng Markdown Discord (**In đậm**, - Danh sách).
2. Câu trả lời phải chuyên nghiệp và dễ nhìn khi nằm trong một Discord Embed.
3. Nếu vấn đề nghiêm trọng, hãy chủ động tag Role quản trị để họ nhận được thông báo.

Câu hỏi của người chơi:
${prompt}
    `.trim()

        const result = await model.generateContent(finalPrompt)
        const response = await result.response
        return response.text()
    } catch (error) {
        console.error('Gemini AI Error in service:', error)
        throw error
    }
}

/**
 * Tạo vector embedding cho một đoạn văn bản
 */
export const getEmbedding = async (text) => {
    try {
        const embeddingModel = genAI.getGenerativeModel({ model: 'text-embedding-004' })
        const result = await embeddingModel.embedContent(text)
        return result.embedding.values
    } catch (error) {
        console.error('Gemini Embedding Error:', error)
        throw error
    }
}
