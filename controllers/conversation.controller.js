import { getConversations } from '../services/conversationService.js';
import { botManager } from '../services/botService.js';

export const getAllConversations = async (req, res) => {
    try {
        const data = await getConversations();
        res.json(data);
    } catch (error) {
        res.status(500).json({ status: 'error', error: error.message });
    }
};

export const syncConversations = async (req, res) => {
    try {
        const { botId, channelId } = req.body;
        console.log(`Sync request received - Bot: ${botId || 'Default'}, Channel: ${channelId || 'All'}`);

        let targetClient;
        if (botId) {
            targetClient = botManager.clients.get(botId);
        } else {
            targetClient = [...botManager.clients.values()][0];
        }

        if (!targetClient || !targetClient.isReady()) {
            return res.status(400).json({ error: 'No active bot client found for sync' });
        }

        // Note: syncDiscordHistory is actually handled in conversationService which we'd call here
        // For now, mirroring the logic in server.js
        const { syncDiscordHistory } = await import('../services/conversationService.js');
        const result = await syncDiscordHistory(targetClient, channelId);
        res.json(result);
    } catch (error) {
        console.error('Sync error:', error);
        res.status(500).json({ error: error.message });
    }
};
