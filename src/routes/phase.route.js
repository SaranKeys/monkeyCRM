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

// tasks
router.post('/task/create', phaseController.addTask);
router.patch('/task/:taskId', phaseController.editTask);
router.get('/task/:taskId', phaseController.getSingleTask);
router.delete('/task/:taskId', phaseController.removeTask);  

// dynamic task view
router.post('/task/:taskId/updates', phaseController.postTaskUpdate);
router.get('/task/:taskId/updates', phaseController.fetchTaskUpdates);
router.post('/task/updates/:updateId/reply', phaseController.postTaskReply);

router.post('/task/:taskId/time-logs', phaseController.postTimeLog);
router.get('/task/:taskId/time-logs', phaseController.fetchTimeLogs);


export default router;