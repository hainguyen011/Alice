import express from 'express';
import * as campaignController from '../controllers/campaign.controller.js';

const router = express.Router();

// Campaigns
router.get('/', campaignController.getAllCampaigns);
router.post('/', campaignController.createCampaign);
router.patch('/:id', campaignController.updateCampaign);
router.delete('/:id', campaignController.deleteCampaign);

// Chapters
router.get('/:id/chapters', campaignController.getChapters);
router.post('/:id/generate', campaignController.generateChapter);
router.post('/chapters/:id/regenerate-content', campaignController.regenerateChapterContent);
router.post('/chapters/:id/regenerate-image', campaignController.regenerateChapterImage);
router.post('/chapters/:id/publish', campaignController.publishChapter);
router.patch('/chapters/:id', campaignController.updateChapter);

export default router;
