import { logActivity } from "../services/activity.service.js";
import { uploadFileToDrive } from "../services/drive.service.js";
import * as phaseService from "../services/phase.service.js";
import {
  createPhaseSchema,
  updatePhaseSchema,
  createSubPhaseSchema,
  createTaskSchema,
  updateTaskSchema,
  updateSubPhaseSchema,
  createTaskReplySchema,
  createTaskUpdateSchema,
  createTimeLogSchema,
} from "../validations/phase.validation.js";

export const addPhase = async (req, res) => {
  try {
    const validation = createPhaseSchema.safeParse(req);
    if (!validation.success)
      return res
        .status(400)
        .json({ status: "fail", errors: validation.error.issues });

    const phase = await phaseService.createPhase(validation.data.body);

    await logActivity(
      phase.projectId || req.body.projectId, 
      req.user.id, 
      "CREATED_PHASE", 
      `added a new phase: ${phase.name}`
    );

    return res.status(201).json({ status: "success", data: phase });
  } catch (error) {
    return res.status(500).json({ status: "fail", message: error.message });
  }
};

export const getPhases = async (req, res) => {
  try {
    const phases = await phaseService.getProjectPhases(req.params.projectId);
    return res.status(200).json({ status: "success", data: phases });
  } catch (error) {
    return res.status(500).json({ status: "fail", message: error.message });
  }
};

export const getSinglePhase = async (req, res) => {
  try {
    const phase = await phaseService.getPhaseDetails(req.params.id);
    if (!phase)
      return res
        .status(404)
        .json({ status: "fail", message: "Phase not found" });
    return res.status(200).json({ status: "success", data: phase });
  } catch (error) {
    return res.status(500).json({ status: "fail", message: error.message });
  }
};

export const editPhase = async (req, res) => {
  try {
    const validation = updatePhaseSchema.safeParse(req);
    if (!validation.success)
      return res
        .status(400)
        .json({ status: "fail", errors: validation.error.issues });

    const phase = await phaseService.updatePhase(
      req.params.id,
      validation.data.body,
    );

    await logActivity(
      phase.projectId || req.body.projectId, 
      req.user.id, 
      "UPDATED_PHASE", 
      `updated phase details for: ${phase.name || 'a phase'}`
    );

    return res.status(200).json({ status: "success", data: phase });
  } catch (error) {
    return res.status(500).json({ status: "fail", message: error.message });
  }
};

export const addSubPhase = async (req, res) => {
  try {
    const validation = createSubPhaseSchema.safeParse(req);
    if (!validation.success)
      return res
        .status(400)
        .json({ status: "fail", errors: validation.error.issues });

    const subPhase = await phaseService.createSubPhase(validation.data.body);

    const projectId = req.body.projectId || subPhase.phase?.projectId;
    if (projectId) {
      await logActivity(projectId, req.user.id, "CREATED_SUB_PHASE", `added a sub-phase: ${subPhase.name}`);
    }

    return res.status(201).json({ status: "success", data: subPhase });
  } catch (error) {
    return res.status(500).json({ status: "fail", message: error.message });
  }
};

export const addTask = async (req, res) => {
  try {
    const attachments = [];
    if (req.files && req.files.length > 0) {
      const uploadPromises = req.files.map(async (file) => {
        const uploadResult = await uploadFileToDrive(file.buffer, file.originalname, file.mimetype, 'task');
        
        let type = 'file';
        if (file.mimetype.startsWith('video/')) type = 'video';
        if (file.mimetype.startsWith('image/')) type = 'image';

        return { 
          name: file.originalname, 
          url: uploadResult.url, 
          type 
        };
      });
      
      const uploadedFiles = await Promise.all(uploadPromises);
      attachments.push(...uploadedFiles);
    }

    const taskPayload = {
      title: req.body.title,
      description: req.body.description || null,
      priority: req.body.priority || "MEDIUM",
      status: req.body.status || "TO_DO",
      startDate: req.body.startDate ? new Date(req.body.startDate) : undefined,
      dueDate: req.body.dueDate ? new Date(req.body.dueDate) : undefined,
      phaseId: req.body.phaseId,
      subPhaseId: req.body.subPhaseId || undefined,
      assigneeId: req.body.assigneeId || undefined,
      attachments: attachments 
    };

    const validation = createTaskSchema.safeParse({ body: taskPayload });
    if (!validation.success) {
      return res.status(400).json({ status: "fail", errors: validation.error.issues });
    }

    const task = await phaseService.createTask(validation.data.body);

    const projectId = req.body.projectId || task.phase?.projectId;
    if (projectId) {
      await logActivity(projectId, req.user.id, "CREATED_TASK", `created a new task: ${task.title}`);
    }

    return res.status(201).json({ status: "success", data: task });
  } catch (error) {
    console.error("[Create Task Error]:", error);
    return res.status(500).json({ status: "fail", message: error.message });
  }
};

export const editTask = async (req, res) => {
  try {
    if (req.body.assigneeId === "") req.body.assigneeId = null;

    const existingTask = await phaseService.getTaskDetails(req.params.taskId);
    if (!existingTask) {
      return res.status(404).json({ status: "fail", message: "Task not found" });
    }

    let newAttachments = [];
    if (req.files && req.files.length > 0) {
      const uploadPromises = req.files.map(async (file) => {
        const uploadResult = await uploadFileToDrive(file.buffer, file.originalname, file.mimetype, 'task');
        let type = 'file';
        if (file.mimetype.startsWith('video/')) type = 'video';
        if (file.mimetype.startsWith('image/')) type = 'image';
        return { name: file.originalname, url: uploadResult.url, type };
      });
      newAttachments = await Promise.all(uploadPromises);
    }

    let finalAttachments = existingTask.attachments || [];
    if (req.body.retainedAttachments) {
      try {
        finalAttachments = JSON.parse(req.body.retainedAttachments);
      } catch (e) {
        console.error("Failed to parse retained attachments");
      }
    }
    
    finalAttachments = [...finalAttachments, ...newAttachments];

    const taskPayload = {
      title: req.body.title,
      description: req.body.description,
      priority: req.body.priority,
      status: req.body.status,
      startDate: req.body.startDate,
      dueDate: req.body.dueDate,
      assigneeId: req.body.assigneeId,
      estimatedHours: req.body.estimatedHours,
      loggedHours: req.body.loggedHours,
    };

    Object.keys(taskPayload).forEach(key => taskPayload[key] === undefined && delete taskPayload[key]);

    if (req.files?.length > 0 || req.body.retainedAttachments) {
      taskPayload.attachments = finalAttachments;
    }

    const validation = updateTaskSchema.safeParse({ body: taskPayload });
    if (!validation.success) {
      return res.status(400).json({ status: "fail", errors: validation.error.issues });
    }

    const task = await phaseService.updateTask(
      req.params.taskId,
      validation.data.body,
    );

    const projectId = req.body.projectId || task.phase?.projectId;
    if (projectId) {
      await logActivity(
        projectId, 
        req.user.id, 
        "UPDATED_TASK", 
        `updated task: ${task.title} ${req.body.status ? `to ${req.body.status}` : ''}`
      );
    }

    return res.status(200).json({ status: "success", data: task });
  } catch (error) {
    console.error("[Edit Task Error]:", error);
    return res.status(500).json({ status: "fail", message: error.message });
  }
};

export const deletePhase = async (req, res) => {
  try {
    await phaseService.deletePhase(req.params.id);

    if (deletedPhase && deletedPhase.projectId) {
      await logActivity(
        deletedPhase.projectId, 
        req.user.id, 
        "DELETED_PHASE", 
        `deleted phase: ${deletedPhase.name}`
      );
    }

    return res
      .status(200)
      .json({
        status: "success",
        message: "Phase and all nested tasks deleted successfully.",
      });
  } catch (error) {
    if (error.code === "P2025")
      return res
        .status(404)
        .json({ status: "fail", message: "Phase not found" });
    return res.status(500).json({ status: "fail", message: error.message });
  }
};

export const editSubPhase = async (req, res) => {
  try {
    const validation = updateSubPhaseSchema.safeParse(req);
    if (!validation.success)
      return res
        .status(400)
        .json({ status: "fail", errors: validation.error.issues });

    const subPhase = await phaseService.updateSubPhase(
      req.params.subPhaseId,
      validation.data.body,
    );

    const projectId = req.body.projectId || subPhase.phase?.projectId;
    if (projectId) {
      await logActivity(projectId, req.user.id, "UPDATED_SUB_PHASE", `updated sub-phase: ${subPhase.name}`);
    }

    return res.status(200).json({ status: "success", data: subPhase });
  } catch (error) {
    if (error.code === "P2025")
      return res
        .status(404)
        .json({ status: "fail", message: "Sub-phase not found" });
    return res.status(500).json({ status: "fail", message: error.message });
  }
};

export const removeSubPhase = async (req, res) => {
  try {
    await phaseService.deleteSubPhase(req.params.subPhaseId);

    if (projectId) {
      await logActivity(projectId, req.user.id, "DELETED_SUB_PHASE", `deleted sub-phase: ${deletedSubPhase.name}`);
    }

    return res
      .status(200)
      .json({
        status: "success",
        message: "Sub-phase deleted. Its tasks are now independent.",
      });
  } catch (error) {
    if (error.code === "P2025")
      return res
        .status(404)
        .json({ status: "fail", message: "Sub-phase not found" });
    return res.status(500).json({ status: "fail", message: error.message });
  }
};

export const removeTask = async (req, res) => {
  try {
    const deletedTask = await phaseService.deleteTask(req.params.taskId);

    const projectId = req.body?.projectId || deletedTask?.phase?.projectId;
    
    if (projectId) {
      logActivity(
        projectId, 
        req.user.id, 
        "DELETED_TASK", 
        `deleted a task: ${deletedTask.title || "Unknown Task"}`
      ).catch(err => console.error("[Activity Log Warning]: Failed to log task deletion", err));
    }

    return res.status(200).json({ 
      status: "success", 
      message: "Task deleted successfully." 
    });

  } catch (error) {
    if (error.code === "P2025") {
      return res.status(404).json({ status: "fail", message: "Task not found." });
    }
    
    console.error("[Task Deletion Error]:", error);
    return res.status(500).json({ status: "fail", message: "Internal server error during deletion." });
  }
};

export const postTaskUpdate = async (req, res) => {
    try {
        const validation = createTaskUpdateSchema.safeParse(req);
        if (!validation.success) return res.status(400).json({ status: "fail", errors: validation.error.issues });

        const update = await phaseService.createTaskUpdate(req.params.taskId, req.user.id, validation.data.body);

        const projectId = req.body.projectId || update?.task?.phase?.projectId;
    if (projectId) {
      await logActivity(projectId, req.user.id, "POSTED_UPDATE", `posted a task update`);
    }

        return res.status(201).json({ status: "success", data: update });
    } catch (error) {
        return res.status(500).json({ status: "fail", message: error.message });
    }
};

export const fetchTaskUpdates = async (req, res) => {
    try {
        const updates = await phaseService.getTaskUpdates(req.params.taskId);
        return res.status(200).json({ status: "success", data: updates });
    } catch (error) {
        return res.status(500).json({ status: "fail", message: error.message });
    }
};

export const postTaskReply = async (req, res) => {
    try {
        const validation = createTaskReplySchema.safeParse(req);
        if (!validation.success) return res.status(400).json({ status: "fail", errors: validation.error.issues });

        const reply = await phaseService.addTaskUpdateReply(req.params.updateId, req.user.id, validation.data.body.text);

        const projectId = req.body.projectId || reply?.update?.task?.phase?.projectId;
    if (projectId) {
      await logActivity(projectId, req.user.id, "POSTED_REPLY", `replied to a task update`);
    }

        return res.status(201).json({ status: "success", data: reply });
    } catch (error) {
        return res.status(500).json({ status: "fail", message: error.message });
    }
};

export const postTimeLog = async (req, res) => {
    try {
        const validation = createTimeLogSchema.safeParse(req);
        if (!validation.success) return res.status(400).json({ status: "fail", errors: validation.error.issues });

        const timeLog = await phaseService.addTaskTimeLog(req.params.taskId, req.user.id, validation.data.body);

        const projectId = req.body.projectId || timeLog?.task?.phase?.projectId;
    if (projectId) {
      await logActivity(projectId, req.user.id, "LOGGED_TIME", `logged ${validation.data.body.hours} hours on a task`);
    }

        return res.status(201).json({ status: "success", data: timeLog });
    } catch (error) {
        return res.status(500).json({ status: "fail", message: error.message });
    }
};

export const fetchTimeLogs = async (req, res) => {
    try {
        const logs = await phaseService.getTaskTimeLogs(req.params.taskId);
        return res.status(200).json({ status: "success", data: logs });
    } catch (error) {
        return res.status(500).json({ status: "fail", message: error.message });
    }
};


export const getSingleTask = async (req, res) => {
  try {
    const task = await phaseService.getTaskDetails(req.params.taskId);
    
    if (!task) return res.status(404).json({ status: "fail", message: "Task not found" });
    
    return res.status(200).json({ status: "success", data: task });
  } catch (error) {
    return res.status(500).json({ status: "fail", message: error.message });
  }
};