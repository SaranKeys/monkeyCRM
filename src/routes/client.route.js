import { Router } from 'express';
import * as clientController from '../controllers/client.controller.js';
import { uploadClientDocs } from '../middlewares/upload.middleware.js';
import { authenticate, restrictTo } from '../middlewares/auth.middleware.js';

const router = Router();

router.use(authenticate, restrictTo('ADMIN'));

router.post('/register', uploadClientDocs, clientController.registerClient);

router.get('/', clientController.getAllClients);
router.get('/:id', clientController.getClientById);

// just for fields (raw)
router.put('/:id', clientController.updateClient);

// for files/documents (form data)
router.patch('/:id/documents', uploadClientDocs, clientController.updateClientDocuments);

router.delete('/:id', clientController.deleteClient);

export default router;