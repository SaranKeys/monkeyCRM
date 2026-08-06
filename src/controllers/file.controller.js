import prisma from "../config/prisma.js";
import { logActivity } from "../services/activity.service.js";
import {
  uploadFileToDrive,
  deleteFileFromDrive,
} from "../services/drive.service.js";

const getFileType = (mimeType) => {
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("video/")) return "video";
  return "document";
};

export const uploadProjectFile = async (req, res) => {
  try {
    const { projectId } = req.body;
    const file = req.file;

    if (!projectId || !file) {
      return res
        .status(400)
        .json({ status: "fail", message: "Project ID and File are required." });
    }

    const driveData = await uploadFileToDrive(
      file.buffer,
      file.originalname,
      file.mimetype,
      "PRJ",
    );

    const newFile = await prisma.projectFile.create({
      data: {
        name: file.originalname,
        url: driveData.url,
        driveFileId: driveData.driveFileId,
        type: getFileType(file.mimetype),
        projectId: projectId,
        uploaderId: req.user.id,
      },
    });


    await logActivity(
      projectId,
      req.user.id,
      "UPLOADED_FILE",
      `uploaded a new file: ${file.originalname}`
    );

    return res.status(201).json({ status: "success", data: newFile });
  } catch (error) {
    return res.status(500).json({ status: "fail", message: error.message });
  }
};

export const getProjectFiles = async (req, res) => {
  try {
    const { projectId } = req.params;
    const files = await prisma.projectFile.findMany({
      where: { projectId },
      orderBy: { createdAt: "desc" },
      include: {
        uploader: {
          select: {
            employeeProfile: {
              select: { legalName: true, profilePhotoUrl: true },
            },
            clientProfile: {
              select: { contactName: true, companyName: true, logoUrl: true }
            }
          },
        },
      },
    });

    const formattedFiles = files.map(file => {
      let displayName = "Unknown User";
      let displayPhoto = null;

      if (file.uploader?.employeeProfile) {
        displayName = file.uploader.employeeProfile.legalName;
        displayPhoto = file.uploader.employeeProfile.profilePhotoUrl;
      } else if (file.uploader?.clientProfile) {
        displayName = `${file.uploader.clientProfile.contactName} (${file.uploader.clientProfile.companyName})`;
        displayPhoto = file.uploader.clientProfile.logoUrl;
      }

      return {
        ...file,
        displayName,
        displayPhoto
      };
    });

    return res.status(200).json({ status: "success", data: formattedFiles });
  } catch (error) {
    return res.status(500).json({ status: "fail", message: error.message });
  }
};

export const deleteProjectFile = async (req, res) => {
  try {
    const { fileId } = req.params;

    const fileRecord = await prisma.projectFile.findUnique({
      where: { id: fileId },
    });
    if (!fileRecord)
      return res
        .status(404)
        .json({ status: "fail", message: "File not found" });

    await deleteFileFromDrive(fileRecord.driveFileId);

    await prisma.projectFile.delete({ where: { id: fileId } });

    await logActivity(
      fileRecord.projectId,
      req.user.id,
      "DELETED_FILE",
      `deleted a file: ${fileRecord.name}`
    );

    return res
      .status(200)
      .json({ status: "success", message: "File deleted successfully" });


  } catch (error) {
    return res.status(500).json({ status: "fail", message: error.message });
  }
};
