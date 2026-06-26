import * as clientService from "../services/client.service.js";
import { uploadFileToDrive } from "../services/drive.service.js";
import { registerClientSchema, updateClientSchema } from "../validations/client.validation.js";

export const registerClient = async (req, res) => {
  try {
    const validationResult = registerClientSchema.shape.body.safeParse(
      req.body,
    );

    if (!validationResult.success) {
      const structuralErrors = validationResult.error.issues.map((e) => ({
        field: e.path.join("."),
        message: e.message,
      }));
      return res.status(400).json({ status: "fail", errors: structuralErrors });
    }

    const validatedData = validationResult.data;

    const cleanCompanyName = validatedData.companyName
      .trim()
      .replace(/\s+/g, "_");
    const filePrefix = `Client_${cleanCompanyName}`;

    const reqFiles = req.files || {};

    const uploadTasks = {
      logoUrl: reqFiles["logo"]
        ? uploadFileToDrive(
            reqFiles["logo"][0].buffer,
            reqFiles["logo"][0].originalname,
            reqFiles["logo"][0].mimetype,
            filePrefix,
          )
        : Promise.resolve(null),
      msaUrl: reqFiles["msa"]
        ? uploadFileToDrive(
            reqFiles["msa"][0].buffer,
            reqFiles["msa"][0].originalname,
            reqFiles["msa"][0].mimetype,
            filePrefix,
          )
        : Promise.resolve(null),
      ndaUrl: reqFiles["nda"]
        ? uploadFileToDrive(
            reqFiles["nda"][0].buffer,
            reqFiles["nda"][0].originalname,
            reqFiles["nda"][0].mimetype,
            filePrefix,
          )
        : Promise.resolve(null),
      taxCertUrl: reqFiles["taxCert"]
        ? uploadFileToDrive(
            reqFiles["taxCert"][0].buffer,
            reqFiles["taxCert"][0].originalname,
            reqFiles["taxCert"][0].mimetype,
            filePrefix,
          )
        : Promise.resolve(null),
      brandAssetsUrl: reqFiles["brandAssets"]
        ? uploadFileToDrive(
            reqFiles["brandAssets"][0].buffer,
            reqFiles["brandAssets"][0].originalname,
            reqFiles["brandAssets"][0].mimetype,
            filePrefix,
          )
        : Promise.resolve(null),
    };

    const resolvedUrls = {};
    const keys = Object.keys(uploadTasks);
    const results = await Promise.all(Object.values(uploadTasks));

    keys.forEach((key, index) => {
      if (results[index]) {
        resolvedUrls[key] = results[index];
      }
    });

    const record = await clientService.createClient(
      validatedData,
      resolvedUrls,
    );

    return res.status(201).json({
      status: "success",
      message: "Client registered successfully.",
      data: {
        userId: record.user.id,
        profileId: record.profile.id,
        companyName: record.profile.companyName,
      },
    });
  } catch (error) {
    console.error("[Client Registration Error]:", error);
    if (error.code === "P2002") {
      return res.status(409).json({
        status: "fail",
        message: "A user with this email already exists.",
      });
    }

    return res.status(error.statusCode || 500).json({
      status: "fail",
      message: error.message || "Internal Server Error",
    });
  }
};

export const getAllClients = async (req, res) => {
    try {
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 10;
        const search = req.query.search || "";

        const result = await clientService.getAllClients(page, limit, search);

        return res.status(200).json({ 
            status: 'success', 
            data: result.clients,
            pagination: result.pagination 
        });
    } catch (error) {
        return res.status(500).json({ status: 'fail', message: error.message });
    }
};

export const getClientById = async (req, res) => {
  try {
    const client = await clientService.getClientById(req.params.id);
    return res.status(200).json({ status: "success", data: client });
  } catch (error) {
    if (error.code === "P2025")
      return res
        .status(404)
        .json({ status: "fail", message: "Client not found." });
    return res.status(500).json({ status: "fail", message: error.message });
  }
};

export const updateClient = async (req, res) => {
  try {
    const validationResult = updateClientSchema.safeParse(req);
    if (!validationResult.success) {
      const structuralErrors = validationResult.error.issues.map((e) => ({
        field: e.path.join("."),
        message: e.message,
      }));
      return res.status(400).json({ status: "fail", errors: structuralErrors });
    }

    const updatedClient = await clientService.updateClient(
      req.params.id,
      validationResult.data.body,
    );

    return res
      .status(200)
      .json({
        status: "success",
        message: "Client updated successfully.",
        data: updatedClient,
      });
  } catch (error) {
    return res.status(500).json({ status: "fail", message: error.message });
  }
};

export const updateClientDocuments = async (req, res) => {
  try {
    if (!req.files || Object.keys(req.files).length === 0) {
      return res
        .status(400)
        .json({ status: "fail", message: "No files provided for update." });
    }

    const client = await clientService.getClientById(req.params.id);
    const cleanName = client.companyName.trim().replace(/\s+/g, "_");
    const filePrefix = `Client_${cleanName}_UPDATED`;

    const newDocumentUrls = {};
    const fileFields = ["logo", "msa", "nda", "taxCert", "brandAssets"];

    for (const field of fileFields) {
      if (req.files[field]) {
        const file = req.files[field][0];
        const url = await uploadFileToDrive(
          file.buffer,
          file.originalname,
          file.mimetype,
          filePrefix,
        );
        newDocumentUrls[`${field}Url`] = url;
      }
    }

    const updatedClient = await clientService.updateClient(
      req.params.id,
      newDocumentUrls,
    );
    return res
      .status(200)
      .json({
        status: "success",
        message: "Client documents updated.",
        data: updatedClient,
      });
  } catch (error) {
    console.error("[Client Document Update Error]:", error);
    return res
      .status(500)
      .json({
        status: "fail",
        message: error.message || "Internal Server Error",
      });
  }
};

export const deleteClient = async (req, res) => {
  try {
    const deletedRecord = await clientService.deleteClient(req.params.id);
    return res.status(200).json({
      status: "success",
      message: `Client '${deletedRecord.clientProfile.companyName}' and their credentials were deleted successfully.`,
    });
  } catch (error) {
    if (error.code === "P2025")
      return res
        .status(404)
        .json({ status: "fail", message: "Client not found." });
    return res.status(500).json({ status: "fail", message: error.message });
  }
};
