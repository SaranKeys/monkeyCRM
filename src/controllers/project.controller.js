import * as projectService from "../services/project.service.js";
import { createProjectSchema } from "../validations/project.validation.js";

export const createProject = async (req, res) => {
  try {
    const validationResult = createProjectSchema.safeParse(req);

    if (!validationResult.success) {
      const structuralErrors = validationResult.error.issues.map((e) => ({
        field: e.path.join("."),
        message: e.message,
      }));
      return res.status(400).json({ status: "fail", errors: structuralErrors });
    }

    const validatedData = validationResult.data.body;

    const newProject = await projectService.createProject(validatedData);

    return res.status(201).json({
      status: "success",
      message: `Project '${newProject.name}' successfully provisioned.`,
      data: newProject,
    });
  } catch (error) {
    console.error("[Project Creation Error]:", error);

    if (error.code === "P2025" || error.message.includes("malformed")) {
      return res.status(400).json({
        status: "fail",
        message: "Invalid Client or Employee ID provided.",
      });
    }

    return res.status(500).json({
      status: "fail",
      message: error.message || "Internal Server Error",
    });
  }
};

export const getAllProjects = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 9;

    const filters = {
      search: req.query.search || "",
      status: req.query.status || "",
      priority: req.query.priority || "",
      health: req.query.health || "",
    };

    const result = await projectService.getAllProjects(page, limit, filters);

    return res.status(200).json({
      status: "success",
      data: result.projects,
      pagination: result.pagination,
    });
  } catch (error) {
    console.error("[Get Projects Error]:", error);
    return res
      .status(500)
      .json({
        status: "fail",
        message: error.message || "Internal Server Error",
      });
  }
};

export const deleteProject = async (req, res) => {
  try {
    const deletedProject = await projectService.deleteProject(req.params.id);

    return res.status(200).json({
      status: "success",
      message: `Project '${deletedProject.name}' and all its runway milestones have been permanently deleted.`,
    });
  } catch (error) {
    if (error.code === "P2025") {
      return res.status(404).json({
        status: "fail",
        message: "Deletion failed. Project not found.",
      });
    }
    return res.status(500).json({
      status: "fail",
      message: error.message || "Internal Server Error",
    });
  }
};
