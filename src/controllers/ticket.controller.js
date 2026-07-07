import * as ticketService from "../services/ticket.service.js";
import {
  createCommentSchema,
  createTicketSchema,
  updateTicketSchema,
} from "../validations/ticket.validation.js";

export const createTicket = async (req, res) => {
  try {
    const validationResult = createTicketSchema.safeParse(req);
    if (!validationResult.success) {
      const errors = validationResult.error.issues.map((e) => ({
        field: e.path.join("."),
        message: e.message,
      }));
      return res.status(400).json({ status: "fail", errors });
    }

    if (validationResult.data.body.assigneeId && req.user.role !== "ADMIN") {
      return res.status(403).json({
        status: "fail",
        message:
          "ACCESS DENIED: Only Admins have the authority to assign tickets.",
      });
    }

    console.log("DECODED TOKEN DATA:", req.user);

    const creatorId = req.user?.id || req.user?._id || req.user?.userId;

    if (!creatorId) {
      return res.status(401).json({
        status: "fail",
        message:
          "Unauthorized: Could not extract User ID from your login token.",
      });
    }

    const newTicket = await ticketService.createTicket(
      validationResult.data.body,
      creatorId,
    );

    await logActivity(
      newTicket.projectId,
      creatorId,
      "CREATED_TICKET",
      `raised a new ticket: ${newTicket.subject}`
    );

    return res.status(201).json({ status: "success", data: newTicket });
  } catch (error) {
    return res.status(500).json({ status: "fail", message: error.message });
  }
};

export const getProjectTickets = async (req, res) => {
  try {
    const { projectId } = req.params;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const status = req.query.status;

    const result = await ticketService.getTicketsByProject(
      projectId,
      page,
      limit,
      status,
    );
    return res.status(200).json({ status: "success", data: result });
  } catch (error) {
    return res.status(500).json({ status: "fail", message: error.message });
  }
};

export const updateTicket = async (req, res) => {
  try {
    const validationResult = updateTicketSchema.safeParse(req);
    if (!validationResult.success) {
      const errors = validationResult.error.issues.map((e) => ({
        field: e.path.join("."),
        message: e.message,
      }));
      return res.status(400).json({ status: "fail", errors });
    }

    if (validationResult.data.body.assigneeId && req.user.role !== "ADMIN") {
      return res.status(403).json({
        status: "fail",
        message: "ACCESS DENIED: Only Admins can re-assign tickets.",
      });
    }

    const updatedTicket = await ticketService.updateTicket(
      req.params.id,
      validationResult.data.body,
    );

    await logActivity(
      updatedTicket.projectId,
      req.user.id,
      "UPDATED_TICKET",
      `updated ticket status/details for: ${updatedTicket.ticketNumber || updatedTicket.subject}`
    );
    
    return res.status(200).json({ status: "success", data: updatedTicket });
  } catch (error) {
    if (error.code === "P2025")
      return res
        .status(404)
        .json({ status: "fail", message: "Ticket not found." });
    return res.status(500).json({ status: "fail", message: error.message });
  }
};

export const deleteTicket = async (req, res) => {
  try {
    const ticketToDelete = await ticketService.getTicketById(req.params.id);
    
    await ticketService.deleteTicket(req.params.id);
    
    if (ticketToDelete) {
      await logActivity(
        ticketToDelete.projectId,
        req.user.id,
        "DELETED_TICKET",
        `deleted ticket: ${ticketToDelete.ticketNumber || ticketToDelete.subject}`
      );
    }

    return res.status(200).json({ status: "success", message: "Ticket permanently deleted." });
  } catch (error) {
    if (error.code === "P2025") return res.status(404).json({ status: "fail", message: "Ticket not found." });
    return res.status(500).json({ status: "fail", message: error.message });
  }
};

export const getSingleTicket = async (req, res) => {
  try {
    const ticket = await ticketService.getTicketById(req.params.id);
    return res.status(200).json({ status: "success", data: ticket });
  } catch (error) {
    if (error.code === "P2025" || error.message.includes("malformed")) {
      return res
        .status(404)
        .json({ status: "fail", message: "Ticket not found or invalid ID." });
    }
    return res.status(500).json({ status: "fail", message: error.message });
  }
};

export const addCommentToTicket = async (req, res) => {
  try {
    const validationResult = createCommentSchema.safeParse(req);
    if (!validationResult.success) {
      const errors = validationResult.error.issues.map((e) => ({
        field: e.path.join("."),
        message: e.message,
      }));
      return res.status(400).json({ status: "fail", errors });
    }

    const authorId = req.user?.id || req.user?._id || req.user?.userId;
    const newComment = await ticketService.addComment(
      req.params.id,
      authorId,
      validationResult.data.body.text,
    );

    const ticket = await ticketService.getTicketById(req.params.id);
    if (ticket) {
      await logActivity(
        ticket.projectId,
        authorId,
        "COMMENTED_TICKET",
        `commented on ticket: ${ticket.ticketNumber || ticket.subject}`
      );
    }

    return res.status(201).json({ status: "success", data: newComment });
  } catch (error) {
    return res.status(500).json({ status: "fail", message: error.message });
  }
};

export const deleteTicketComment = async (req, res) => {
  try {
    const commentId = req.params.commentId;

    const comment = await ticketService.getCommentById(commentId);

    if (!comment) {
      return res
        .status(404)
        .json({ status: "fail", message: "Comment not found." });
    }

    const userId = req.user?.id || req.user?._id || req.user?.userId;

    if (comment.authorId !== userId && req.user.role !== "ADMIN") {
      return res
        .status(403)
        .json({
          status: "fail",
          message: "ACCESS DENIED: You can only delete your own replies.",
        });
    }

    await ticketService.deleteComment(commentId);

    return res
      .status(200)
      .json({ status: "success", message: "Reply deleted successfully." });
  } catch (error) {
    return res.status(500).json({ status: "fail", message: error.message });
  }
};
