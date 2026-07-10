import { Router } from "express";
import * as projectController from "../controllers/project.controller.js";
import { authenticate, checkPermission, restrictTo } from "../middlewares/auth.middleware.js";

const router = Router();

router.post(
  "/create",
  authenticate,
  checkPermission("Projects", "createProject"),
  projectController.createProject
);

router.get(
  "/",
  authenticate,
  checkPermission("Projects", "viewProjects", true), 
  projectController.getAllProjects
);

router.delete(
  "/:id",
  authenticate,
  checkPermission("Projects", "editProjectDetails"), 
  projectController.deleteProject
);

router.get(
  "/:id",
  authenticate,
  checkPermission("Projects", "viewProjects"),
  projectController.getProjectById
);

router.patch(
  "/:id",
  authenticate,
  checkPermission("Projects", "editProjectDetails"),
  projectController.updateProject
);

router.get(
  "/:projectId/team",
  authenticate,
  checkPermission("Projects", "viewProjects"),
  projectController.fetchProjectTeam
);

router.get(
  "/:projectId/activity",
  authenticate,
  checkPermission("Projects", "viewProjects"),
  projectController.getProjectActivity
);
export default router;
