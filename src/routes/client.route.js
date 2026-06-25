import { Router } from 'express';
import * as clientController from '../controllers/client.controller.js';
import { uploadClientDocs } from '../middlewares/upload.middleware.js';
import { authenticate, restrictTo } from '../middlewares/auth.middleware.js';

const router = Router();

router.post(
    '/register',
    authenticate, 
    restrictTo('ADMIN'), 
    uploadClientDocs,            
    clientController.registerClient 
);

export default router;