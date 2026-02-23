import express from 'express';
import * as contentController from '../controllers/content.controller.js';

const router = express.Router();

// Posts
router.get('/posts', contentController.getAllPosts);
router.post('/posts', contentController.createPost);
router.patch('/posts/:id', contentController.updatePost);
router.delete('/posts/:id', contentController.deletePost);
router.post('/posts/generate', contentController.generatePost);
router.post('/posts/publish', contentController.publishPostNow);

// Schedules
router.get('/schedules', contentController.getAllSchedules);
router.post('/schedules', contentController.createSchedule);
router.delete('/schedules/:id', contentController.deleteSchedule);

// Scripts
router.get('/scripts', contentController.getAllScripts);
router.post('/scripts', contentController.createScript);
router.post('/scripts/:id/run', contentController.runScript);

export default router;
