import { Router } from 'express';
import * as roleController from '../controllers/role.controller.js';
import { authenticate, restrictTo } from '../middlewares/auth.middleware.js';

const router = Router();

router.use(authenticate, restrictTo('ADMIN'));

router.post('/', roleController.createRole);
router.get('/', roleController.getAllRoles); 
router.put('/:id', roleController.updateRole);
router.delete('/:id', roleController.deleteRole);

export default router;