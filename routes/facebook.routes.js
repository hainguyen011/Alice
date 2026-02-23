import express from 'express';
import { facebookService } from '../services/facebookService.js';

const router = express.Router();

/**
 * Facebook Webhook Verification (hub.verify_token)
 */
router.get('/', (req, res) => facebookService.verifyWebhook(req, res));

/**
 * Facebook Webhook Event Handler
 */
router.post('/', (req, res) => facebookService.handleWebhook(req, res));

export default router;
