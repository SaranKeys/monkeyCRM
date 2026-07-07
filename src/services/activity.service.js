import prisma from "../config/prisma.js";

export const logActivity = async (projectId, actorId, action, details) => {
  try {
    await prisma.projectActivityLog.create({
      data: {
        projectId,
        actorId,
        action,
        details,
      },
    });
  } catch (error) {
    console.error("[Activity Log Error]:", error); 
  }
};