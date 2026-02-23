import express from 'express';
import * as botController from '../controllers/bot.controller.js';

const router = express.Router();

router.get('/', botController.getAllBots);
router.post('/', botController.createBot);
router.patch('/:id', botController.updateBot);
router.delete('/:id', botController.deleteBot);
router.post('/:id/sync', botController.syncBotMetadata);

export default router;
