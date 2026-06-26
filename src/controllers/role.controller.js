import * as roleService from "../services/role.service.js";
import {
  companyRoleSchema,
  updatePermissionsSchema,
} from "../validations/role.validation.js";

export const createRole = async (req, res) => {
  try {
    const validationResult = companyRoleSchema.safeParse(req);
    if (!validationResult.success) {
      return res
        .status(400)
        .json({ status: "fail", errors: validationResult.error.issues });
    }

    const role = await roleService.createRole(validationResult.data.body);

    return res.status(201).json({ status: "success", data: role });
  } catch (error) {
    if (error.code === "P2002") {
      return res.status(409).json({
        status: "fail",
        message: "A role with this name already exists.",
      });
    }
    return res.status(500).json({ status: "fail", message: error.message });
  }
};

export const getAllRoles = async (req, res) => {
  try {
    const roles = await roleService.getAllRolesWithCounts();
    return res.status(200).json({ status: "success", data: roles });
  } catch (error) {
    return res.status(500).json({ status: "fail", message: error.message });
  }
};

export const updateRole = async (req, res) => {
  try {
    const validationResult = companyRoleSchema.safeParse(req);
    if (!validationResult.success) {
      return res
        .status(400)
        .json({ status: "fail", errors: validationResult.error.issues });
    }

    const role = await roleService.updateRole(
      req.params.id,
      validationResult.data.body,
    );
    return res.status(200).json({ status: "success", data: role });
  } catch (error) {
    return res.status(500).json({ status: "fail", message: error.message });
  }
};

export const deleteRole = async (req, res) => {
  try {
    const deletedRole = await roleService.deleteRole(req.params.id);

    return res.status(200).json({
      status: "success",
      message: `Role '${deletedRole.name}' was deleted successfully.`,
      data: {
        deletedId: deletedRole.id,
        deletedName: deletedRole.name,
      },
    });
  } catch (error) {
    if (error.code === "P2025") {
      return res
        .status(404)
        .json({ status: "fail", message: "Role not found." });
    }

    if (error.statusCode === 400) {
      return res.status(400).json({ status: "fail", message: error.message });
    }
    console.error("[Delete Role Error]:", error);
    return res.status(500).json({
      status: "fail",
      message: error.message || "Internal Server Error",
    });
  }
};

// permissions toggle
export const getPermissions = async (req, res) => {
  try {
    const roleData = await roleService.getRolePermissions(req.params.id);
    return res.status(200).json({ status: "success", data: roleData });
  } catch (error) {
    return res.status(404).json({ status: "fail", message: error.message });
  }
};

export const savePermissions = async (req, res) => {
  try {
    const validationResult = updatePermissionsSchema.safeParse(req);
    if (!validationResult.success) {
      return res
        .status(400)
        .json({ status: "fail", errors: validationResult.error.issues });
    }

    const updatedRole = await roleService.updateRolePermissions(
      req.params.id,
      validationResult.data.body.permissions,
    );

    return res.status(200).json({
      status: "success",
      message: `Permissions updated successfully for ${updatedRole.name}`,
      data: updatedRole,
    });
  } catch (error) {
    return res.status(500).json({ status: "fail", message: error.message });
  }
};
