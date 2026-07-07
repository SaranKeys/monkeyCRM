import { Router } from 'express';
import * as serviceController from '../controllers/templateService.controller.js';
import { authenticate, checkPermission } from '../middlewares/auth.middleware.js';

const router = Router();

router.use(authenticate);

router.post(
    '/create', 
    checkPermission("Projects", "createProject"), 
    serviceController.createService
);

router.get(
    '/', 
    checkPermission("Projects", "viewProjects"), 
    serviceController.getActiveServices
);

router.put(
    '/:id', 
    checkPermission("Projects", "createProject"), 
    serviceController.updateService
);

router.delete(
    '/:id', 
    checkPermission("Projects", "createProject"), 
    serviceController.deleteService
);

export default router;