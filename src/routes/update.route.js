import { Router } from 'express';
import * as updateController from '../controllers/update.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import multer from 'multer';

const router = Router();

const upload = multer({ storage: multer.memoryStorage() });

router.use(authenticate);

// project updates tab

router.post('/create', upload.array('files', 5), updateController.createProjectUpdate);

router.get('/project/:projectId', updateController.getUpdates);
router.patch('/:id/status', updateController.patchUpdateStatus);
router.delete('/:id', updateController.removeUpdate);
router.post('/:id/reply', updateController.createReply);

export default router;