import { Router } from "express";
import * as phaseController from "../controllers/phase.controller.js";
import {
  authenticate,
  checkPermission,
} from "../middlewares/auth.middleware.js";
import { uploadTaskFiles } from "../middlewares/upload.middleware.js";

const router = Router();
router.use(authenticate);

// phase
router.post(
  "/create",
  checkPermission("Projects", "managePhasesTasks"),
  phaseController.addPhase,
);
router.get(
  "/project/:projectId",
  checkPermission("Projects", "viewProjects"),
  phaseController.getPhases,
);
router.get(
  "/:id",
  checkPermission("Projects", "viewProjects"),
  phaseController.getSinglePhase,
);
router.put(
  "/:id",
  checkPermission("Projects", "managePhasesTasks"),
  phaseController.editPhase,
);
router.delete(
  "/:id",
  checkPermission("Projects", "managePhasesTasks"),
  phaseController.deletePhase,
);

// sub phases
router.post(
  "/sub-phase/create",
  checkPermission("Projects", "managePhasesTasks"),
  phaseController.addSubPhase,
);
router.patch(
  "/sub-phase/:subPhaseId",
  checkPermission("Projects", "managePhasesTasks"),
  phaseController.editSubPhase,
);
router.delete(
  "/sub-phase/:subPhaseId",
  checkPermission("Projects", "managePhasesTasks"),
  phaseController.removeSubPhase,
);

// tasks
router.post(
  '/task/create', 
  checkPermission("Tasks", "createTask"), 
  uploadTaskFiles, 
  phaseController.addTask
);

router.patch(
  "/task/:taskId",
  checkPermission("Tasks", "editTask"),
  uploadTaskFiles, 
  phaseController.editTask,
);

router.get(
  "/task/:taskId",
  checkPermission("Tasks", "viewTasks"),
  phaseController.getSingleTask,
);

router.delete(
  "/task/:taskId",
  checkPermission("Tasks", "editTask"),
  phaseController.removeTask,
);

// dynamic task update
router.post(
  "/task/:taskId/updates",
  checkPermission("Projects", "postUpdates"),
  phaseController.postTaskUpdate,
);
router.get(
  "/task/:taskId/updates",
  checkPermission("Tasks", "viewTasks"),
  phaseController.fetchTaskUpdates,
);
router.post(
  "/task/updates/:updateId/reply",
  checkPermission("Projects", "postUpdates"),
  phaseController.postTaskReply,
);

// time logs
router.post(
  "/task/:taskId/time-logs",
  checkPermission("Tasks", "logTime"),
  phaseController.postTimeLog,
);
router.get(
  "/task/:taskId/time-logs",
  checkPermission("Tasks", "viewTasks"),
  phaseController.fetchTimeLogs,
);

export default router;
