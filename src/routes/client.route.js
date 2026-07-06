import { Router } from 'express';
import * as clientController from '../controllers/client.controller.js';
import { uploadClientDocs } from '../middlewares/upload.middleware.js';
import { authenticate, checkPermission } from '../middlewares/auth.middleware.js';

const router = Router();

router.use(authenticate);

router.post('/register', checkPermission("Clients", "editClient"), uploadClientDocs, clientController.registerClient);

router.get('/', checkPermission("Clients", "viewClients"), clientController.getAllClients);
router.get('/:id', checkPermission("Clients", "viewClients"), clientController.getClientById);

// just for fields (raw)
router.put('/:id', checkPermission("Clients", "editClient"), clientController.updateClient);

// for files/documents (form data)
router.patch('/:id/documents', checkPermission("Clients", "editClient"), uploadClientDocs, clientController.updateClientDocuments);

router.delete('/:id', checkPermission("Clients", "editClient"), clientController.deleteClient);

export default router;