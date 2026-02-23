import { GoogleGenerativeAI } from '@google/generative-ai'
import { getKnowledgeContext } from './ragService.js'

const defaultGenAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)

/**
 * Lấy instance GoogleGenerativeAI dựa trên key (mặc định hoặc cụ thể của bot)
 */
export const getGenAI = (apiKey) => {
    if (!apiKey) return defaultGenAI;
    return new GoogleGenerativeAI(apiKey);
}

/**
 * Lấy phản hồi từ AI dựa trên cấu hình cụ thể của Bot
 */
export const getAIResponse = async (prompt, botConfig, options = {}) => {
    try {
        // Tương thích với cách gọi cũ (với các tham số rời rạc)
        let chatContext = '';
        let availableRoles = '';
        let availableChannels = '';
        let withDetail = false;
        let platform = botConfig.platform || 'discord';

        if (typeof options === 'object') {
            chatContext = options.chatContext || '';
            availableRoles = options.availableRoles || '';
            availableChannels = options.availableChannels || '';
            withDetail = options.withDetail || false;
            if (options.platform) platform = options.platform;
        } else {
            // Trường hợp pass các tham số rời rạc (backward compatibility)
            chatContext = arguments[2] || '';
            availableRoles = arguments[3] || '';
            availableChannels = arguments[4] || '';
            withDetail = arguments[5] || false;
        }

        const contextData = await getKnowledgeContext(prompt, botConfig, withDetail)
        const contextText = withDetail ? contextData.map(r => r.payload.content).join('\n---\n') : contextData;

        const genAIInstance = getGenAI(botConfig.api_key);

        const model = genAIInstance.getGenerativeModel({
            model: botConfig.modelName || 'gemini-2.0-flash',
            systemInstruction: botConfig.systemInstruction
        })

        let platformInstructions = '';
        if (platform === 'facebook') {
            platformInstructions = `
1. Đây là nền tảng Messenger. Hãy trả lời ngắn gọn, súc tích.
2. Tránh sử dụng các định dạng Markdown quá phức tạp (Discord style). Chỉ nên dùng **In đậm** và list đơn giản.
3. Không sử dụng các cú pháp tag của Discord như <@&ID> hay <#ID>.
            `.trim();
        } else {
            platformInstructions = `
1. Nếu tài liệu có định dạng danh sách hoặc tiêu đề, hãy trình bày lại một cách sạch sẽ bằng Markdown Discord (**In đậm**, - Danh sách).
2. Câu trả lời phải chuyên nghiệp và dễ nhìn khi nằm trong một Discord Embed.
${availableRoles ? `3. Nếu cần sự trợ giúp từ người thật, hãy tag role phù hợp:\n${availableRoles}` : ''}
${availableChannels ? `4. Nếu gợi ý kênh, hãy dùng cú pháp <#ID>:\n${availableChannels}` : ''}
            `.trim();
        }

        const finalPrompt = `
Dưới đây là thông tin bổ trợ từ hệ thống tài liệu server:
${contextText}

Dưới đây là tóm tắt ngữ cảnh cuộc hội thoại trước đó:
${chatContext || "Chưa có ngữ cảnh."}

Dựa vào các thông tin trên, hãy trả lời câu hỏi của người dùng.
Lưu ý về định dạng trên nền tảng ${platform.toUpperCase()}:
${platformInstructions}

Câu hỏi người dùng:
${prompt}
    `.trim()

        const result = await model.generateContent(finalPrompt)
        const response = await result.response
        const aiText = response.text();

        // TRẢ VỀ CHUỖI NẾU KHÔNG CẦN CHI TIẾT (Để tương thích với các process cũ chưa restart)
        if (!withDetail) {
            return aiText;
        }

        return {
            text: aiText,
            context: contextData
        }
    } catch (error) {
        console.error('Gemini AI Error in service:', error)
        throw error
    }
}

/**
 * Tạo vector embedding cho một đoạn văn bản
 */
export const getEmbedding = async (text, apiKey = null) => {
    try {
        const genAIInstance = getGenAI(apiKey);
        const embeddingModel = genAIInstance.getGenerativeModel({ model: 'gemini-embedding-001' })
        const result = await embeddingModel.embedContent(text)
        return result.embedding.values
    } catch (error) {
        console.error('Gemini Embedding Error:', error)
        throw error
    }
}

/**
 * Lấy danh sách các model khả dụng từ Gemini
 */
export const listModels = async (apiKey = null) => {
    try {
        const key = apiKey || process.env.GEMINI_API_KEY;
        if (!key) throw new Error('GEMINI_API_KEY is missing');

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`);
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error?.message || 'Failed to fetch models');
        }

        // Chỉ lấy các model hỗ trợ generateContent và bỏ qua các model cũ/deprecated nếu cần
        return data.models
            .filter(m => m.supportedGenerationMethods.includes('generateContent') && !m.name.includes('vision-preview'))
            .map(m => ({
                id: m.name.split('/').pop(),
                name: m.displayName,
                description: m.description,
                version: m.version
            }))
            .sort((a, b) => b.id.localeCompare(a.id)); // Sắp xếp model mới lên đầu
    } catch (error) {
        console.error('Error listing Gemini models:', error);
        throw error;
    }
}

/**
 * Kiểm tra tính độc hại (toxicity) của nội dung với model cụ thể
 */
export const checkToxicity = async (content, botConfig = {}) => {
    try {
        const genAIInstance = getGenAI(botConfig.api_key);
        const toxicityModel = genAIInstance.getGenerativeModel({
            model: botConfig.modelName || 'gemini-2.0-flash',
            systemInstruction: "Bạn là một chuyên gia kiểm duyệt nội dung chuyên nghiệp. Hãy phân tích văn bản sau và cho biết nó có vi phạm các quy tắc cộng đồng (chửi thề, xúc phạm, toxic, nhạy cảm) hay không. Chỉ trả về kết quả dưới dạng JSON: { \"isToxic\": boolean, \"level\": \"low\"|\"medium\"|\"high\", \"reason\": \"string\" }"
        })

        const result = await toxicityModel.generateContent(content)
        const responseText = result.response.text()

        const jsonMatch = responseText.match(/\{.*\}/s)
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0])
        }

        return { isToxic: false, level: 'low', reason: '' }
    } catch (error) {
        console.error('Toxicity Check Error:', error)
        return { isToxic: false, level: 'low', reason: 'Error checking toxicity' }
    }
}
