import * as notificationService from "../services/notification.service.js";

export const subscribeUser = async (req, res) => {
  try {
    await notificationService.saveSubscription(req.user.id, req.body);

    return res.status(201).json({
      status: "success",
      message: "Successfully subscribed to push notifications."
    });
  } catch (error) {
    console.error("[Subscribe Error]:", error);
    return res.status(500).json({
      status: "fail",
      message: error.message || "Failed to subscribe to notifications."
    });
  }
};