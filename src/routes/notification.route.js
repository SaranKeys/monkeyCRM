import { Router } from "express";
import * as notificationController from "../controllers/notification.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";
import { validateRequest } from "../middlewares/validateRequest.js";
import { subscribeSchema } from "../validations/notification.validation.js";

const router = Router();

router.post(
  "/subscribe",
  authenticate,
  validateRequest(subscribeSchema),
  notificationController.subscribeUser
);

export default router;