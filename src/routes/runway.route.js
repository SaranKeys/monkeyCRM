import { Router } from "express";
import * as runwayController from "../controllers/runway.controller.js";
import {
  authenticate,
  checkPermission,
} from "../middlewares/auth.middleware.js";

const router = Router();
router.use(authenticate);

router.post(
  "/create",
  checkPermission("Projects", "projectRunway"),
  runwayController.createItem,
);
router.get(
  "/project/:projectId",
  checkPermission("Projects", "projectRunway"),
  runwayController.getRunway,
);
router.get(
  "/:id",
  checkPermission("Projects", "projectRunway"),
  runwayController.getSingleItem,
);
router.put(
  "/:id",
  checkPermission("Projects", "projectRunway"),
  runwayController.updateItem,
);
router.delete(
  "/:id",
  checkPermission("Projects", "projectRunway"),
  runwayController.deleteItem,
);

export default router;
