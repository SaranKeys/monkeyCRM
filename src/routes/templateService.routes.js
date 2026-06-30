import { Router } from 'express';
import * as serviceController from '../controllers/templateService.controller.js';
import { authenticate, restrictTo } from '../middlewares/auth.middleware.js';

const router = Router();

router.post('/create', authenticate, restrictTo('ADMIN'), serviceController.createService);

// to fetch fields for creation of project
router.get('/', authenticate, restrictTo('ADMIN'), serviceController.getActiveServices);

export default router;