import { logActivity } from "../services/activity.service.js";
import { uploadFileToDrive } from "../services/drive.service.js";
import * as updateService from "../services/update.service.js";
import {
  createUpdateSchema,
  updateStatusSchema,
  replySchema,
} from "../validations/update.validation.js";

export const createProjectUpdate = async (req, res) => {
  try {
    if (req.user.role === "CLIENT") {
      return res.status(403).json({
        status: "fail",
        message: "Clients cannot post official updates.",
      });
    }

    const {
      content,
      clientView,
      approvalStatus,
      projectId,
      assignedApproverId,
    } = req.body;

    const attachments = [];
    if (req.files && req.files.length > 0) {
      const uploadPromises = req.files.map(async (file) => {
        const uploadResult = await uploadFileToDrive(
          file.buffer,
          file.originalname,
          file.mimetype,
          "update",
        );

        let type = "file";
        if (file.mimetype.startsWith("video/")) type = "video";
        if (file.mimetype.startsWith("image/")) type = "image";

        return {
          name: file.originalname,
          url: uploadResult.url,
          type,
        };
      });

      const uploadedFiles = await Promise.all(uploadPromises);
      attachments.push(...uploadedFiles);
    }

    const updateData = {
      content,
      clientView,
      approvalStatus,
      projectId,
      attachments,
      assignedApproverId: assignedApproverId || undefined,
    };

    const validation = createUpdateSchema.safeParse({ body: updateData });
    if (!validation.success) {
      const errors = validation.error.issues.map((e) => ({
        field: e.path.join("."),
        message: e.message,
      }));
      return res.status(400).json({ status: "fail", errors });
    }

    const authorId = req.user?.id || req.user?._id || req.user?.userId;
    const newUpdate = await updateService.createUpdate(
      validation.data.body,
      authorId,
    );

    await logActivity(
      projectId,
      authorId,
      "POSTED_UPDATE",
      "posted a project update",
    );

    return res.status(201).json({ status: "success", data: newUpdate });
  } catch (error) {
    console.error("[Create Update Error]:", error);
    return res.status(500).json({ status: "fail", message: error.message });
  }
};

export const getUpdates = async (req, res) => {
  try {
    const { projectId } = req.params;
    const role = req.user.role;

    const updates = await updateService.getProjectUpdates(projectId, role);
    return res.status(200).json({ status: "success", data: updates });
  } catch (error) {
    return res.status(500).json({ status: "fail", message: error.message });
  }
};

export const patchUpdateStatus = async (req, res) => {
  try {
    if (req.user.role === "CLIENT") {
      return res
        .status(403)
        .json({ status: "fail", message: "Access denied." });
    }

    const validation = updateStatusSchema.safeParse(req);
    if (!validation.success) {
      return res
        .status(400)
        .json({ status: "fail", errors: validation.error.issues });
    }

    const updated = await updateService.editUpdateStatus(
      req.params.id,
      validation.data.body,
    );

    const projectId = updated.projectId || req.body.projectId;

    if (projectId) {
      await logActivity(
        projectId,
        req.user.id,
        "UPDATED_UPDATE_STATUS",
        `changed a project update status to ${validation.data.body.approvalStatus}`,
      );
    }

    return res.status(200).json({ status: "success", data: updated });
  } catch (error) {
    if (error.code === "P2025") {
      return res.status(404).json({
        status: "fail",
        message:
          "Update not found. It may have been deleted or the ID is incorrect.",
      });
    }

    return res.status(500).json({ status: "fail", message: error.message });
  }
};

export const createReply = async (req, res) => {
  try {
    const validation = replySchema.safeParse(req);
    if (!validation.success)
      return res
        .status(400)
        .json({ status: "fail", errors: validation.error.issues });

    const authorId = req.user?.id || req.user?._id || req.user?.userId;
    const reply = await updateService.addReply(
      req.params.id,
      authorId,
      validation.data.body.text,
    );

    const projectId = req.body.projectId || reply?.update?.projectId;
    if (projectId) {
      await logActivity(
        projectId,
        authorId,
        "POSTED_UPDATE_REPLY",
        "replied to a project update",
      );
    }

    return res.status(201).json({ status: "success", data: reply });
  } catch (error) {
    return res.status(500).json({ status: "fail", message: error.message });
  }
};

export const removeUpdate = async (req, res) => {
  try {
    if (req.user.role === "CLIENT") {
      return res
        .status(403)
        .json({ status: "fail", message: "Access denied." });
    }

    const deletedUpdate = await updateService.deleteUpdate(req.params.id);

    const projectId = deletedUpdate.projectId;

    if (projectId) {
      await logActivity(
        projectId,
        req.user.id,
        "DELETED_UPDATE",
        "deleted a project update",
      );
    }

    return res
      .status(200)
      .json({ status: "success", message: "Update deleted." });
  } catch (error) {
    if (error.code === "P2025") {
      return res
        .status(404)
        .json({ status: "fail", message: "Update not found." });
    }
    return res.status(500).json({ status: "fail", message: error.message });
  }
};
