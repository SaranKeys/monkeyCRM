import { Router } from 'express';
import * as runwayController from '../controllers/runway.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = Router();

router.use(authenticate);

router.post('/create', runwayController.createItem);
router.get('/project/:projectId', runwayController.getRunway);
router.get('/:id', runwayController.getSingleItem);
router.put('/:id', runwayController.updateItem);
router.delete('/:id', runwayController.deleteItem);

export default router;