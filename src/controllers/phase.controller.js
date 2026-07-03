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
    return res.status(201).json({ status: "success", data: subPhase });
  } catch (error) {
    return res.status(500).json({ status: "fail", message: error.message });
  }
};

export const addTask = async (req, res) => {
  try {
    const validation = createTaskSchema.safeParse(req);
    if (!validation.success)
      return res
        .status(400)
        .json({ status: "fail", errors: validation.error.issues });

    const task = await phaseService.createTask(validation.data.body);
    return res.status(201).json({ status: "success", data: task });
  } catch (error) {
    return res.status(500).json({ status: "fail", message: error.message });
  }
};

export const editTask = async (req, res) => {
  try {
    if (req.body.assigneeId === "") req.body.assigneeId = null;

    const validation = updateTaskSchema.safeParse(req);
    if (!validation.success)
      return res
        .status(400)
        .json({ status: "fail", errors: validation.error.issues });

    const task = await phaseService.updateTask(
      req.params.taskId,
      validation.data.body,
    );
    return res.status(200).json({ status: "success", data: task });
  } catch (error) {
    return res.status(500).json({ status: "fail", message: error.message });
  }
};

export const deletePhase = async (req, res) => {
  try {
    await phaseService.deletePhase(req.params.id);
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
    await phaseService.deleteTask(req.params.taskId);
    return res
      .status(200)
      .json({ status: "success", message: "Task deleted successfully." });
  } catch (error) {
    if (error.code === "P2025")
      return res
        .status(404)
        .json({ status: "fail", message: "Task not found" });
    return res.status(500).json({ status: "fail", message: error.message });
  }
};


export const postTaskUpdate = async (req, res) => {
    try {
        const validation = createTaskUpdateSchema.safeParse(req);
        if (!validation.success) return res.status(400).json({ status: "fail", errors: validation.error.issues });

        const update = await phaseService.createTaskUpdate(req.params.taskId, req.user.id, validation.data.body);
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