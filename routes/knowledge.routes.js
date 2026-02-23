import express from 'express';
import multer from 'multer';
import * as knowledgeController from '../controllers/knowledge.controller.js';

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

router.get('/', knowledgeController.getAllKnowledge);
router.get('/test', knowledgeController.testKnowledge);
router.post('/', knowledgeController.addKnowledge);
router.post('/upload', upload.single('file'), knowledgeController.uploadKnowledge);
router.delete('/:id', knowledgeController.deleteKnowledge);

export default router;
