import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const api = axios.create({
    baseURL: API_URL,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request Interceptor
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('accessToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response Interceptor
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry && !originalRequest.url.includes('/auth/')) {
            originalRequest._retry = true;

            try {
                // Gọi API refresh token (sử dụng cookie HttpOnly)
                const res = await axios.post(`${API_URL}/auth/refresh`, {}, { withCredentials: true });
                const { accessToken } = res.data;

                localStorage.setItem('accessToken', accessToken);

                // Thử lại request cũ với token mới
                originalRequest.headers.Authorization = `Bearer ${accessToken}`;
                return api(originalRequest);
            } catch (refreshError) {
                // Nếu refresh thất bại, xóa trạng thái và chuyển về login
                localStorage.removeItem('accessToken');
                // Thay vì chuyển hướng cứng, ta để AuthContext xử lý trạng thái user null
                // window.location.href = '/'; 
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

// Named API Services
export const knowledgeApi = {
    getAll: () => api.get('/knowledge'),
    create: (data) => api.post('/knowledge', data),
    upload: (formData) => api.post('/knowledge/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    }),
    delete: (id) => api.delete(`/knowledge/${id}`),
    testQuery: (query, botId) => api.get('/knowledge/test', { params: { query, botId } })
};

export const botsApi = {
    getAll: () => api.get('/bots'),
    create: (data) => api.post('/bots', data),
    update: (id, data) => api.patch(`/bots/${id}`, data),
    delete: (id) => api.delete(`/bots/${id}`),
    syncMetadata: (id) => api.post(`/bots/${id}/sync`),
    listAvailableModels: (apiKey) => api.get('/ai/models', { params: { apiKey } })
};

export const conversationsApi = {
    getAll: () => api.get('/conversations'),
    sync: (data) => api.post('/conversations/sync', data),
    chat: (data) => api.post('/ai/chat', data)
};

export const channelsApi = {
    getAll: () => api.get('/channels'),
    create: (data) => api.post('/channels', data),
    update: (id, data) => api.patch(`/channels/${id}`, data),
    delete: (id) => api.delete(`/channels/${id}`)
};

export const guildsApi = {
    getAll: () => api.get('/guilds'),
    create: (data) => api.post('/guilds', data),
    delete: (id) => api.delete(`/guilds/${id}`),
    getDiscordChannels: (guildId) => api.get(`/guilds/${guildId}/discord-channels`),
    syncChannels: (guildId, channels) => api.post(`/guilds/${guildId}/sync-channels`, { channels })
};

export const postsApi = {
    getAll: () => api.get('/posts'),
    create: (data) => api.post('/posts', data),
    update: (id, data) => api.patch(`/posts/${id}`, data),
    delete: (id) => api.delete(`/posts/${id}`),
    publishNow: (data) => api.post('/posts/publish', data),
    generate: (data) => api.post('/posts/generate', data)
};

export const schedulesApi = {
    getAll: () => api.get('/schedules'),
    create: (data) => api.post('/schedules', data),
    delete: (id) => api.delete(`/schedules/${id}`)
};

export const scriptsApi = {
    getAll: () => api.get('/scripts'),
    create: (data) => api.post('/scripts', data),
    run: (id, data) => api.post(`/scripts/${id}/run`, data)
};

export const campaignsApi = {
    getAll: () => api.get('/campaigns'),
    create: (data) => api.post('/campaigns', data),
    update: (id, data) => api.patch(`/campaigns/${id}`, data),
    delete: (id) => api.delete(`/campaigns/${id}`),
    getChapters: (id) => api.get(`/campaigns/${id}/chapters`),
    generateNext: (id, userInstruction) => api.post(`/campaigns/${id}/generate`, { userInstruction }),
    updateChapter: (id, data) => api.patch(`/chapters/${id}`, data),
    regenerateContent: (id) => api.post(`/chapters/${id}/regenerate-content`),
    regenerateImage: (id, data) => api.post(`/chapters/${id}/regenerate-image`, data),
    publishChapter: (id) => api.post(`/chapters/${id}/publish`)
};


export default api;
