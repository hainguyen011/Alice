import express from 'express';
import * as conversationController from '../controllers/conversation.controller.js';

const router = express.Router();

router.get('/', conversationController.getAllConversations);
router.post('/sync', conversationController.syncConversations);

export default router;
