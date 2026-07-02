import { Router } from 'express';
import * as phaseController from '../controllers/phase.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = Router();
router.use(authenticate);

router.post('/create', phaseController.addPhase);
router.get('/project/:projectId', phaseController.getPhases); 

router.get('/:id', phaseController.getSinglePhase);
router.put('/:id', phaseController.editPhase);

router.post('/sub-phase/create', phaseController.addSubPhase);

router.post('/task/create', phaseController.addTask);
router.patch('/task/:taskId', phaseController.editTask);

export default router;