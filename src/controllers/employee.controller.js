import * as employeeService from "../services/employee.service.js";
import { uploadFileToDrive } from "../services/drive.service.js";
import { registerEmployeeSchema, updateEmployeeSchema } from "../validations/employee.validation.js";
import prisma from "../config/prisma.js";

export const registerEmployee = async (req, res) => {
  try {
    const requiredFiles = [
      "aadhaarFront",
      "aadhaarBack",
      "panPhoto",
      "addressProof",
      "bankDocument",
    ];
    for (const fileField of requiredFiles) {
      if (!req.files || !req.files[fileField]) {
        return res.status(400).json({
          status: "fail",
          message: `Missing required file upload: ${fileField}`,
        });
      }
    }

    const validationResult = registerEmployeeSchema.shape.body.safeParse(
      req.body,
    );

    if (!validationResult.success) {
      const structuralErrors = validationResult.error.issues.map((e) => ({
        field: e.path.join("."),
        message: e.message,
      }));
      return res.status(400).json({ status: "fail", errors: structuralErrors });
    }

    const validatedData = validationResult.data;

    const roleExists = await prisma.companyRole.findUnique({
      where: { name: validatedData.designation },
    });

    if (!roleExists) {
      return res.status(400).json({
        status: "fail",
        message: `The designation '${validatedData.designation}' does not exist. Please select a valid role.`,
      });
    }

    console.log("Validated Data from form:", validatedData);

    const fullName = validatedData.legalName || "Employee";
    const phone = validatedData.personalMobile || "NoPhone";

    const cleanName = fullName.trim().replace(/\s+/g, "_");
    const filePrefix = `${cleanName}_${phone}`;

    const uploadTasks = {
      profilePhotoUrl: req.files["profilePhoto"]
        ? uploadFileToDrive(
            req.files["profilePhoto"][0].buffer,
            req.files["profilePhoto"][0].originalname,
            req.files["profilePhoto"][0].mimetype,
            filePrefix,
          )
        : Promise.resolve(null),
      aadhaarFrontUrl: uploadFileToDrive(
        req.files["aadhaarFront"][0].buffer,
        req.files["aadhaarFront"][0].originalname,
        req.files["aadhaarFront"][0].mimetype,
        filePrefix,
      ),
      aadhaarBackUrl: uploadFileToDrive(
        req.files["aadhaarBack"][0].buffer,
        req.files["aadhaarBack"][0].originalname,
        req.files["aadhaarBack"][0].mimetype,
        filePrefix,
      ),
      panPhotoUrl: uploadFileToDrive(
        req.files["panPhoto"][0].buffer,
        req.files["panPhoto"][0].originalname,
        req.files["panPhoto"][0].mimetype,
        filePrefix,
      ),
      addressProofUrl: uploadFileToDrive(
        req.files["addressProof"][0].buffer,
        req.files["addressProof"][0].originalname,
        req.files["addressProof"][0].mimetype,
        filePrefix,
      ),
      bankDocumentUrl: uploadFileToDrive(
        req.files["bankDocument"][0].buffer,
        req.files["bankDocument"][0].originalname,
        req.files["bankDocument"][0].mimetype,
        filePrefix,
      ),
    };

    const resolvedUrls = {};
    const keys = Object.keys(uploadTasks);
    const results = await Promise.all(Object.values(uploadTasks));

    keys.forEach((key, index) => {
      resolvedUrls[key] = results[index];
    });

    const record = await employeeService.createEmployee(
      validatedData,
      resolvedUrls,
    );

    return res.status(201).json({
      status: "success",
      message:
        "Employee registered and file infrastructure provisioned successfully.",
      data: {
        userId: record.user.id,
        profileId: record.profile.id,
        email: record.user.email,
      },
    });
  } catch (error) {
    console.error("[Employee Registration Error]:", error);

    if (error.code === "P2002") {
      const duplicateField = error.meta?.target ? error.meta.target : "field";
      return res.status(409).json({
        status: "fail",
        message: `Registration failed. An employee with this ${duplicateField} already exists.`,
      });
    }

    return res.status(error.statusCode || 500).json({
      status: "fail",
      message: error.message || "Internal Server Error",
    });
  }
};

export const getAllEmployees = async (req, res) => {
  try {
    const employees = await employeeService.getAllEmployees();
    return res.status(200).json({ status: "success", data: employees });
  } catch (error) {
    return res.status(500).json({ status: "fail", message: error.message });
  }
};

export const getEmployeeById = async (req, res) => {
  try {
    const employee = await employeeService.getEmployeeById(req.params.id);
    return res.status(200).json({ status: "success", data: employee });
  } catch (error) {
    if (error.code === "P2025") {
      return res
        .status(404)
        .json({ status: "fail", message: "Employee not found." });
    }
    return res.status(500).json({ status: "fail", message: error.message });
  }
};

export const updateEmployee = async (req, res) => {
  try {
    const validationResult = updateEmployeeSchema.safeParse(req);
    if (!validationResult.success) {
      const structuralErrors = validationResult.error.issues.map((e) => ({
        field: e.path.join("."),
        message: e.message,
      }));
      return res.status(400).json({ status: "fail", errors: structuralErrors });
    }

    const validatedData = validationResult.data.body;

    if (validatedData.designation) {
      const roleExists = await prisma.companyRole.findUnique({
        where: { name: validatedData.designation },
      });
      if (!roleExists) {
        return res.status(400).json({
          status: "fail",
          message: `The designation '${validatedData.designation}' does not exist.`,
        });
      }
    }

    const updatedEmployee = await employeeService.updateEmployee(
      req.params.id,
      validatedData,
    );

    return res.status(200).json({
      status: "success",
      message: "Employee updated successfully.",
      data: updatedEmployee,
    });
  } catch (error) {
    if (error.code === "P2002") {
      const duplicateField = error.meta?.target ? error.meta.target : "field";
      return res.status(409).json({
        status: "fail",
        message: `Update failed. An employee with this ${duplicateField} already exists.`,
      });
    }
    return res.status(500).json({ status: "fail", message: error.message });
  }
};

export const deleteEmployee = async (req, res) => {
  try {
    const deletedRecord = await employeeService.deleteEmployee(req.params.id);

    return res.status(200).json({
      status: "success",
      message: `Employee '${deletedRecord.employeeProfile.legalName}' and their account credentials were deleted successfully.`,
    });
  } catch (error) {
    if (error.code === "P2025") {
      return res
        .status(404)
        .json({ status: "fail", message: "Employee not found." });
    }
    return res.status(500).json({ status: "fail", message: error.message });
  }
};
