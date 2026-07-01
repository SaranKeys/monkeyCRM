import { Router } from 'express';
import * as ticketController from '../controllers/ticket.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js'; 

const router = Router();

router.use(authenticate);

router.post('/create', ticketController.createTicket);
router.put('/:id', ticketController.updateTicket);
router.delete('/:id', ticketController.deleteTicket);

router.get('/project/:projectId', ticketController.getProjectTickets);

// specific ticket
router.get('/:id', ticketController.getSingleTicket);

router.post('/:id/comments', ticketController.addCommentToTicket);
router.delete('/comments/:commentId', ticketController.deleteTicketComment);
 

export default router; 