import { Router } from "express";
import * as projectController from "../controllers/project.controller.js";
import { authenticate, restrictTo } from "../middlewares/auth.middleware.js";

const router = Router();

router.post(
  "/create",
  authenticate,
  restrictTo("ADMIN"),
  projectController.createProject,
);

router.get(
  "/",
  authenticate,
  restrictTo("ADMIN"),
  projectController.getAllProjects,
);

router.delete(
  "/:id",
  authenticate,
  restrictTo("ADMIN"),
  projectController.deleteProject,
);
router.get(
  "/:id",
  authenticate,
  restrictTo("ADMIN"),
  projectController.getProjectById,
);

router.patch(
  "/:id",
  authenticate,
  restrictTo("ADMIN"),
  projectController.updateProject,
);

router.get(
  "/:projectId/team",
  authenticate,
  projectController.fetchProjectTeam,
);

export default router;
