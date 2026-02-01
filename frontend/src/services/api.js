import axios from 'axios';

const api = axios.create({
    baseURL: '/api',
});

export const botsApi = {
    getAll: () => api.get('/bots'),
    create: (data) => api.post('/bots', data),
    update: (id, data) => api.patch(`/bots/${id}`, data),
    delete: (id) => api.delete(`/bots/${id}`),
    syncMetadata: (id) => api.post(`/bots/${id}/sync`),
    listAvailableModels: (apiKey = '') => api.get(`/ai/models${apiKey ? `?apiKey=${apiKey}` : ''}`)
};

export const knowledgeApi = {
    getAll: () => api.get('/knowledge'),
    create: (data) => api.post('/knowledge', data),
    upload: (formData) => api.post('/knowledge/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    }),
    delete: (id) => api.delete(`/knowledge/${id}`),
    testRAG: (query, botId) => api.get('/knowledge/test', {
        params: { query, botId: botId === 'global' ? undefined : botId },
    }),
};

export const conversationsApi = {
    getAll: () => api.get('/conversations'),
    sync: (data) => api.post('/conversations/sync', data),
    chat: (data) => api.post('/chat', data),
};

export const guildsApi = {
    getAll: () => api.get('/guilds'),
    create: (data) => api.post('/guilds', data),
    getDiscordChannels: (guildId) => api.get(`/guilds/${guildId}/discord-channels`),
    syncChannels: (guildId, channels) => api.post(`/guilds/${guildId}/sync-channels`, { channels }),
    delete: (id) => api.delete(`/guilds/${id}`),
};

export const channelsApi = {
    getAll: () => api.get('/channels'),
    create: (data) => api.post('/channels', data),
    update: (id, data) => api.patch(`/channels/${id}`, data),
    delete: (id) => api.delete(`/channels/${id}`),
};

export default api;
