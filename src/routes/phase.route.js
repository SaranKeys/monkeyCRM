import { Router } from "express";
import * as phaseController from "../controllers/phase.controller.js";
import {
  authenticate,
  checkPermission,
} from "../middlewares/auth.middleware.js";
import { uploadTaskFiles } from "../middlewares/upload.middleware.js";
import multer from "multer";

const router = Router();

const editorUpload = multer({ 
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 } 
});

router.use(authenticate);

router.get(
    "/my-tasks",
    phaseController.getMyTasks
);

router.post(
  '/editor/upload', 
  editorUpload.single('file'), 
  phaseController.uploadEditorFile
);

// PHASE ROUTES
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

// SUB PHASES ROUTES
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

// TASK CORE ROUTES
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

// TASK UPDATES & REPLIES
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

// TASK TIME LOGS
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

// DYNAMIC PHASE PARAM ROUTE
router.get(
  "/:id",
  checkPermission("Projects", "viewProjects"),
  phaseController.getSinglePhase,
);

export default router;