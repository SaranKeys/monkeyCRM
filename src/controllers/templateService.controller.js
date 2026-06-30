import * as serviceService from '../services/templateService.service.js';
import { createServiceSchema } from '../validations/templateService.validation.js';

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