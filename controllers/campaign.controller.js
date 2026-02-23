import { Campaign, Chapter } from '../services/models.js';
import { comicService } from '../services/comicService.js';

// --- Campaigns ---
export const getAllCampaigns = async (req, res) => {
    try {
        const campaigns = await Campaign.find().populate('botId', 'name');
        res.json(campaigns);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const createCampaign = async (req, res) => {
    try {
        const campaign = await Campaign.create(req.body);
        res.json(campaign);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const updateCampaign = async (req, res) => {
    try {
        const campaign = await Campaign.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(campaign);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const deleteCampaign = async (req, res) => {
    try {
        await Campaign.findByIdAndDelete(req.params.id);
        await Chapter.deleteMany({ campaignId: req.params.id });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// --- Chapters ---
export const getChapters = async (req, res) => {
    try {
        const chapters = await Chapter.find({ campaignId: req.params.id }).sort({ chapterNumber: -1 });
        res.json(chapters);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const generateChapter = async (req, res) => {
    try {
        const { userInstruction } = req.body;
        const chapter = await comicService.generateNextChapter(req.params.id, userInstruction);
        res.json(chapter);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const regenerateChapterContent = async (req, res) => {
    try {
        const chapter = await comicService.regenerateContent(req.params.id);
        res.json(chapter);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const regenerateChapterImage = async (req, res) => {
    try {
        const { customPrompt } = req.body;
        const chapter = await comicService.regenerateImage(req.params.id, customPrompt);
        res.json(chapter);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const publishChapter = async (req, res) => {
    try {
        await comicService.publishChapter(req.params.id);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const updateChapter = async (req, res) => {
    try {
        const chapter = await Chapter.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(chapter);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
