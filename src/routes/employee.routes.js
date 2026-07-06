import { Router } from "express";
import * as employeeController from "../controllers/employee.controller.js";
import { uploadEmployeeDocs } from "../middlewares/upload.middleware.js";
import {
  authenticate,
  checkPermission,
} from "../middlewares/auth.middleware.js";

const router = Router();

router.use(authenticate);

router.post(
  "/register",
  checkPermission("Employees", "addEmployee"),
  uploadEmployeeDocs,
  employeeController.registerEmployee,
);

router.get(
  "/",
  checkPermission("Employees", "viewEmployees"),
  employeeController.getAllEmployees,
);


router.get(
  "/:id",
  checkPermission("Employees", "viewEmployees"),
  employeeController.getEmployeeById,
);

router.put(
  "/:id",
  checkPermission("Employees", "addEmployee"),
  employeeController.updateEmployee,
);
router.patch(
  "/:id/documents",
  checkPermission("Employees", "addEmployee"),
  uploadEmployeeDocs,
  employeeController.updateEmployeeDocuments,
);

router.delete(
  "/:id",
  checkPermission("Employees", "addEmployee"),
  employeeController.deleteEmployee,
);

export default router;
