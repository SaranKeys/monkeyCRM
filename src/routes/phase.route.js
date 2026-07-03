import { Router } from 'express';
import * as phaseController from '../controllers/phase.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = Router();
router.use(authenticate);

// phases
router.post('/create', phaseController.addPhase);
router.get('/project/:projectId', phaseController.getPhases); 
router.get('/:id', phaseController.getSinglePhase);
router.put('/:id', phaseController.editPhase);
router.delete('/:id', phaseController.deletePhase);

// sub phases
router.post('/sub-phase/create', phaseController.addSubPhase);
router.patch('/sub-phase/:subPhaseId', phaseController.editSubPhase);  
router.delete('/sub-phase/:subPhaseId', phaseController.removeSubPhase);  

router.post('/task/create', phaseController.addTask);
router.patch('/task/:taskId', phaseController.editTask);
router.delete('/task/:taskId', phaseController.removeTask);  

export default router;