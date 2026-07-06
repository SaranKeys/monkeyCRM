import { Router } from 'express';
import * as updateController from '../controllers/update.controller.js';
import { authenticate, checkPermission } from '../middlewares/auth.middleware.js';
import multer from 'multer';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.use(authenticate);

// project updates tab
router.post('/create', checkPermission("Updates", "postUpdate"), upload.array('files', 5), updateController.createProjectUpdate);

router.get('/project/:projectId', checkPermission("Updates", "viewUpdates"), updateController.getUpdates);

// special permission just for approving/rejecting statuses
router.patch('/:id/status', checkPermission("Updates", "approveReject"), updateController.patchUpdateStatus);

router.delete('/:id', checkPermission("Updates", "postUpdate"), updateController.removeUpdate);
router.post('/:id/reply', checkPermission("Updates", "postUpdate"), updateController.createReply);

export default router;