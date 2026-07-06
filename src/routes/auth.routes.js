import { Router } from 'express';
import * as authController from '../controllers/auth.controller.js';
import { validateRequest } from '../middlewares/validateRequest.js';
import { loginSchema } from '../validations/auth.validation.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = Router();

router.post(
    '/login', 
    validateRequest(loginSchema), 
    authController.handleLogin
);

router.get('/me', authenticate, authController.getMe);

export default router;