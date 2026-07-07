import prisma from "../config/prisma.js";
import * as projectService from "../services/project.service.js";
import { createProjectSchema, updateProjectSchema } from "../validations/project.validation.js";

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

    if (error.isDuplicate) {
      return res.status(409).json({
        status: "fail",
        message: error.message,
      });
    }

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

    const result = await projectService.getAllProjects(page, limit, filters, req.user);

    return res.status(200).json({
      status: "success",
      data: result.projects,
      pagination: result.pagination,
    });
  } catch (error) {
    console.error("[Get Projects Error]:", error);
    return res.status(500).json({
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

export const getProjectById = async (req, res) => {
  try {
    const project = await projectService.getProjectById(req.params.id);

    return res.status(200).json({
      status: "success",
      data: project,
    });
  } catch (error) {
    console.error("[Get Project By ID Error]:", error);

    if (error.code === "P2025" || error.message.includes("malformed")) {
      return res.status(404).json({
        status: "fail",
        message: "Project not found or invalid ID.",
      });
    }

    return res.status(500).json({
      status: "fail",
      message: error.message || "Internal Server Error",
    });
  }
};

export const fetchProjectTeam = async (req, res) => {
    try {
        const { projectId } = req.params;
        
        const team = await projectService.getProjectTeam(projectId);
        
        if (!team) {
            return res.status(404).json({ status: "fail", message: "Project not found" });
        }
        
        return res.status(200).json({ status: "success", data: team });
    } catch (error) {
        console.error("[Get Team Error]:", error);
        return res.status(500).json({ status: "fail", message: error.message });
    }
};

export const updateProject = async (req, res) => {
  try {
    const validationResult = updateProjectSchema.safeParse(req);

    if (!validationResult.success) {
      const structuralErrors = validationResult.error.issues.map((e) => ({
        field: e.path.join("."),
        message: e.message,
      }));

      await logActivity(
      updatedProject.id,
      req.user.id,
      "UPDATED_PROJECT",
      "updated core project details"
    );

      return res.status(400).json({ status: "fail", errors: structuralErrors });
    }

    const updatedProject = await projectService.updateProject(req.params.id, validationResult.data.body);

    return res.status(200).json({
      status: "success",
      message: `Project '${updatedProject.name}' updated successfully.`,
      data: updatedProject,
    });
  } catch (error) {
    console.error("[Project Update Error]:", error);

    if (error.code === "P2025" || error.message.includes("malformed")) {
      return res.status(404).json({
        status: "fail",
        message: "Project not found or invalid ID.",
      });
    }

    return res.status(500).json({
      status: "fail",
      message: error.message || "Internal Server Error",
    });
  }
};

export const getProjectActivity = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { date } = req.query;  

    const whereClause = { projectId: projectId };

    if (date) {
      const searchDate = new Date(date);
      const startOfDay = new Date(searchDate.setHours(0, 0, 0, 0));
      const endOfDay = new Date(searchDate.setHours(23, 59, 59, 999));

      whereClause.createdAt = {
        gte: startOfDay,  
        lte: endOfDay,    
      };
    }

    const logs = await prisma.projectActivityLog.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },  
      include: {
        actor: {
          select: {
            employeeProfile: {
              select: { legalName: true, profilePhotoUrl: true }
            }
          }
        }
      }
    });

    return res.status(200).json({ status: "success", data: logs });
  } catch (error) {
    return res.status(500).json({ status: "fail", message: error.message });
  }
};