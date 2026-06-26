import { Router } from 'express';
import * as employeeController from '../controllers/employee.controller.js';
import { uploadEmployeeDocs } from '../middlewares/upload.middleware.js';
import { authenticate, restrictTo } from '../middlewares/auth.middleware.js';

const router = Router();

router.post(
    '/register',
    authenticate, 
    restrictTo('ADMIN'), 
    uploadEmployeeDocs,           
    employeeController.registerEmployee 
);

router.get('/', employeeController.getAllEmployees);
router.get('/:id', employeeController.getEmployeeById);

router.put('/:id', employeeController.updateEmployee);
router.delete('/:id', employeeController.deleteEmployee);


export default router;