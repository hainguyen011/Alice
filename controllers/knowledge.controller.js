import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { Knowledge, Bot } from '../services/models.js';
import { getEmbedding } from '../services/aiService.js';
import { upsertKnowledge, deleteKnowledge as deleteQdrantKnowledge } from '../services/qdrantService.js';
import { getKnowledgeContext } from '../services/ragService.js';

export const getAllKnowledge = async (req, res) => {
    try {
        const data = await Knowledge.find().sort({ timestamp: -1 });
        res.json(data);
    } catch (error) {
        res.status(500).json({ status: 'error', error: error.message });
    }
};

export const testKnowledge = async (req, res) => {
    try {
        const { query, botId } = req.query;
        if (!query) return res.status(400).json({ error: 'Query is required' });

        let botConfig = { ragMode: 'global' };
        if (botId) {
            const bot = await Bot.findById(botId);
            if (bot) botConfig = bot;
        }

        const context = await getKnowledgeContext(query, botConfig);
        res.json({ context });
    } catch (error) {
        console.error('RAG Test Error:', error);
        res.status(500).json({ error: error.message });
    }
};

export const addKnowledge = async (req, res) => {
    try {
        const { title, content, botId, isGlobal } = req.body;
        const qdrantId = uuidv4();
        const vector = await getEmbedding(content);

        const payload = {
            title,
            content,
            botId: botId || null,
            isGlobal: isGlobal === 'true' || isGlobal === true
        };

        await upsertKnowledge(qdrantId, vector, payload);

        const knowledge = await Knowledge.create({
            qdrantId,
            title,
            content,
            botId: botId || null,
            isGlobal: isGlobal === 'true' || isGlobal === true,
            metadata: { originalFilename: req.file?.originalname }
        });

        res.json(knowledge);
    } catch (error) {
        console.error('Error adding knowledge:', error);
        res.status(500).json({ error: error.message });
    }
};

export const uploadKnowledge = async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ status: 'error', error: 'No file uploaded' });

        const filePath = req.file.path;
        const content = fs.readFileSync(filePath, 'utf-8');
        const title = req.file.originalname;
        const id = uuidv4();

        const vector = await getEmbedding(content);
        await upsertKnowledge(id, vector, { title, content, timestamp: new Date().toISOString() });

        const knowledge = await Knowledge.create({
            qdrantId: id,
            title,
            content,
            timestamp: new Date()
        });

        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        res.json({ success: true, knowledge });
    } catch (error) {
        res.status(500).json({ status: 'error', error: error.message });
    }
};

export const deleteKnowledge = async (req, res) => {
    try {
        const knowledge = await Knowledge.findById(req.params.id);
        if (knowledge) {
            await deleteQdrantKnowledge(knowledge.qdrantId);
            await Knowledge.findByIdAndDelete(req.params.id);
        }
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ status: 'error', error: error.message });
    }
};
