import { Router } from 'express';
import * as authController from '../controllers/auth.controller.js';
import { validateRequest } from '../middlewares/validateRequest.js';
import { loginSchema } from '../validations/auth.validation.js';

const router = Router();

router.post(
    '/login', 
    validateRequest(loginSchema), 
    authController.handleAdminLogin
);

export default router;