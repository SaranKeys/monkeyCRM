import * as runwayService from "../services/runway.service.js";
import {
  runwayItemSchema,
  updateRunwayItemSchema,
} from "../validations/runway.validation.js";

export const createItem = async (req, res) => {
  try {
    if (req.user.role === "CLIENT")
      return res
        .status(403)
        .json({
          status: "fail",
          message: "Clients cannot create runway items.",
        });

    const validation = runwayItemSchema.safeParse(req);
    if (!validation.success)
      return res
        .status(400)
        .json({ status: "fail", errors: validation.error.issues });

    const newItem = await runwayService.createRunwayItem(validation.data.body);
    return res.status(201).json({ status: "success", data: newItem });
  } catch (error) {
    return res.status(500).json({ status: "fail", message: error.message });
  }
};

export const getRunway = async (req, res) => {
  try {
    const items = await runwayService.getProjectRunway(req.params.projectId);
    return res.status(200).json({ status: "success", data: items });
  } catch (error) {
    return res.status(500).json({ status: "fail", message: error.message });
  }
};

export const getSingleItem = async (req, res) => {
  try {
    const item = await runwayService.getRunwayItemById(req.params.id);
    return res.status(200).json({ status: "success", data: item });
  } catch (error) {
    if (error.code === "P2025")
      return res.status(404).json({ status: "fail", message: "Not found." });
    return res.status(500).json({ status: "fail", message: error.message });
  }
};

export const updateItem = async (req, res) => {
  try {
    if (req.user.role === "CLIENT")
      return res
        .status(403)
        .json({ status: "fail", message: "Clients cannot edit runway items." });

    const validation = updateRunwayItemSchema.safeParse(req);
    if (!validation.success)
      return res
        .status(400)
        .json({ status: "fail", errors: validation.error.issues });

    const updatedItem = await runwayService.updateRunwayItem(
      req.params.id,
      validation.data.body,
    );
    return res.status(200).json({ status: "success", data: updatedItem });
  } catch (error) {
    if (error.code === "P2025")
      return res.status(404).json({ status: "fail", message: "Not found." });
    return res.status(500).json({ status: "fail", message: error.message });
  }
};

export const deleteItem = async (req, res) => {
  try {
    if (req.user.role === "CLIENT")
      return res
        .status(403)
        .json({
          status: "fail",
          message: "Clients cannot delete runway items.",
        });

    await runwayService.deleteRunwayItem(req.params.id);
    return res
      .status(200)
      .json({ status: "success", message: "Deleted successfully." });
  } catch (error) {
    if (error.code === "P2025")
      return res.status(404).json({ status: "fail", message: "Not found." });
    return res.status(500).json({ status: "fail", message: error.message });
  }
};
