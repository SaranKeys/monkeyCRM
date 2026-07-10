import { Router } from "express";
import * as ticketController from "../controllers/ticket.controller.js";
import {
  authenticate,
  checkPermission,
} from "../middlewares/auth.middleware.js";

const router = Router();

router.use(authenticate);

router.post(
  "/create",
  checkPermission("Tickets", "createTicket", true),
  ticketController.createTicket,
);
router.put(
  "/:id",
  checkPermission("Tickets", "changeStatus"),
  ticketController.updateTicket,
);
router.delete(
  "/:id",
  checkPermission("Tickets", "createTicket"),
  ticketController.deleteTicket,
);

router.get(
  "/project/:projectId",
  checkPermission("Tickets", "viewTickets", true),
  ticketController.getProjectTickets,
);

// specific ticket
router.get(
  "/:id",
  checkPermission("Tickets", "viewTickets", true),
  ticketController.getSingleTicket,
);

router.post(
  "/:id/comments",
  checkPermission("Tickets", "reply", true),
  ticketController.addCommentToTicket,
);
router.delete(
  "/comments/:commentId",
  checkPermission("Tickets", "reply"),
  ticketController.deleteTicketComment,
);

export default router;
