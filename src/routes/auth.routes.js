import { Router } from 'express';
import * as authController from '../controllers/auth.controller.js';
import { validateRequest } from '../middlewares/validateRequest.js';
import { changePasswordSchema, forgotPasswordSchema, loginSchema, resetPasswordSchema, verifyOtpSchema } from '../validations/auth.validation.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = Router();

router.post(
    '/login', 
    validateRequest(loginSchema), 
    authController.handleLogin
);

router.patch(
    '/change-password',
    authenticate,
    validateRequest(changePasswordSchema),
    authController.handleChangePassword
);

router.post(
    '/forgot-password',
    validateRequest(forgotPasswordSchema),
    authController.forgotPassword
);

router.post(
    '/verify-otp',
    validateRequest(verifyOtpSchema),
    authController.verifyOtp
);

router.post(
    '/reset-password',
    validateRequest(resetPasswordSchema),
    authController.resetPassword
);

router.get(
  "/profile",
  authenticate,  
  authController.getMyProfileInfo
);

router.get('/me', authenticate, authController.getMe);

export default router;