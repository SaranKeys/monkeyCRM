import { Router } from 'express';
import multer from 'multer';
import * as fileController from '../controllers/file.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = Router();

const upload = multer({ storage: multer.memoryStorage() }); 

router.use(authenticate);

router.post('/upload', upload.single('file'), fileController.uploadProjectFile);
router.get('/project/:projectId', fileController.getProjectFiles);
router.delete('/:fileId', fileController.deleteProjectFile);

export default router;