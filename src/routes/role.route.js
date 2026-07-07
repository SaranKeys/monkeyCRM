import { Router } from "express";
import * as roleController from "../controllers/role.controller.js";
import {
  authenticate,
  checkPermission,
} from "../middlewares/auth.middleware.js";

const router = Router();

router.use(authenticate);

// roles
router.post(
  "/",
  checkPermission("Roles", "createRole"),
  roleController.createRole,
);
router.get(
  "/",
  checkPermission("Roles", "viewRoles"),
  roleController.getAllRoles,
);
router.put(
  "/:id",
  checkPermission("Roles", "createRole"),
  roleController.updateRole,
);
router.delete(
  "/:id",
  checkPermission("Roles", "createRole"),
  roleController.deleteRole,
);

// permissions
router.get(
  "/:id/permissions",
  checkPermission("Permissions", "viewPermissions"),
  roleController.getPermissions,
);
router.put(
  "/:id/permissions",
  checkPermission("Permissions", "editPermissions"),
  roleController.savePermissions,
);

export default router;
