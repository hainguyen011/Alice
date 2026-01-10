import { ALICE_CONFIG } from '../config/aliceConfig.js';

// Map lưu trữ bộ nhớ: channelId -> { messages: [], lastActivity: Date, timer: Timeout }
const memoryStore = new Map();

// Thời gian hết hạn bộ nhớ (30 phút)
const MEMORY_TTL = 30 * 60 * 1000;

/**
 * Thêm tin nhắn vào bộ nhớ ngữ cảnh
 */
export const addMessageToMemory = (channelId, username, content, isBot = false) => {
    // Nếu chưa có bộ nhớ cho channel này, tạo mới
    if (!memoryStore.has(channelId)) {
        memoryStore.set(channelId, {
            messages: [],
            lastActivity: Date.now(),
            timer: null
        });
    }

    const memory = memoryStore.get(channelId);

    // Cập nhật hoạt động cuối cùng
    memory.lastActivity = Date.now();

    // Reset timer xóa bộ nhớ
    if (memory.timer) clearTimeout(memory.timer);
    memory.timer = setTimeout(() => clearMemory(channelId), MEMORY_TTL);

    // Thêm tin nhắn mới
    memory.messages.push({
        role: isBot ? 'model' : 'user', // Format chuẩn cho Gemini
        parts: [{ text: `${username}: ${content}` }],
        timestamp: Date.now()
    });

    // Giới hạn số lượng tin nhắn trong bộ nhớ (ví dụ: 20 tin gần nhất)
    if (memory.messages.length > 20) {
        memory.messages.shift();
    }
};

/**
 * Lấy ngữ cảnh hội thoại hiện tại
 * Trả về chuỗi text tóm tắt đê AI hiểu
 */
export const getContext = (channelId) => {
    if (!memoryStore.has(channelId)) return '';

    const memory = memoryStore.get(channelId);
    if (memory.messages.length === 0) return '';

    // Chỉ lấy các tin nhắn cách đây không quá 30 phút (double check)
    const now = Date.now();
    const activeMessages = memory.messages.filter(m => (now - m.timestamp) < MEMORY_TTL);

    return activeMessages.map(m => m.parts[0].text).join('\n');
};

/**
 * Xóa bộ nhớ của một channel
 */
export const clearMemory = (channelId) => {
    if (memoryStore.has(channelId)) {
        const memory = memoryStore.get(channelId);
        if (memory.timer) clearTimeout(memory.timer);
        memoryStore.delete(channelId);
        console.log(`🧹 Memory cleared for channel ${channelId} due to inactivity.`);
    }
};
