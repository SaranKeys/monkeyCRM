import * as serviceService from '../services/templateService.service.js';
import { createServiceSchema, updateServiceSchema } from '../validations/templateService.validation.js';

export const createService = async (req, res) => {
    try {
        const validationResult = createServiceSchema.safeParse(req);
        
        if (!validationResult.success) {
            const errors = validationResult.error.issues.map(e => ({
                field: e.path.join("."), message: e.message
            }));
            return res.status(400).json({ status: "fail", errors });
        }

        const newService = await serviceService.createServiceTemplate(validationResult.data.body);

        return res.status(201).json({
            status: "success",
            message: `Service '${newService.name}' created successfully.`,
            data: newService
        });

    } catch (error) {
        if (error.code === 'P2002') {
            return res.status(409).json({ 
                status: "fail", 
                message: "A service with this name already exists." 
            });
        }
        return res.status(500).json({ status: "fail", message: error.message });
    }
};


export const getActiveServices = async (req, res) => {
    try {
        const services = await serviceService.getActiveServices();
        
        return res.status(200).json({ 
            status: "success", 
            data: services 
        });
    } catch (error) {
        return res.status(500).json({ 
            status: "fail", 
            message: error.message || "Internal Server Error" 
        });
    }
};

export const updateService = async (req, res) => {
    try {
        const validationResult = updateServiceSchema.safeParse(req);
        
        if (!validationResult.success) {
            const errors = validationResult.error.issues.map(e => ({
                field: e.path.join("."), message: e.message
            }));
            return res.status(400).json({ status: "fail", errors });
        }

        const updatedService = await serviceService.updateServiceTemplate(req.params.id, validationResult.data.body);

        return res.status(200).json({
            status: "success",
            message: `Service '${updatedService.name}' updated successfully.`,
            data: updatedService
        });

    } catch (error) {
        if (error.code === 'P2025' || error.message.includes('malformed')) {
            return res.status(404).json({ status: "fail", message: "Service Template not found or invalid ID." });
        }
        if (error.code === 'P2002') {
            return res.status(409).json({ status: "fail", message: "A service with this name already exists." });
        }
        return res.status(500).json({ status: "fail", message: error.message });
    }
};

export const deleteService = async (req, res) => {
    try {
        const deletedService = await serviceService.deleteServiceTemplate(req.params.id);
        
        return res.status(200).json({
            status: "success",
            message: `Service '${deletedService.name}' has been permanently deleted.`
        });
    } catch (error) {
        if (error.code === 'P2025' || error.message.includes('malformed')) {
            return res.status(404).json({ 
                status: "fail", 
                message: "Service Template not found." 
            });
        }
        
        if (error.code === 'P2014' || error.code === 'P2003' || error.message.includes('Foreign key constraint')) {
            return res.status(400).json({ 
                status: "fail", 
                message: "ACCESS DENIED: Cannot delete this service template because it is currently linked to one or more active projects. You must delete or reassign those projects first." 
            });
        }
        
        return res.status(500).json({ status: "fail", message: error.message });
    }
};