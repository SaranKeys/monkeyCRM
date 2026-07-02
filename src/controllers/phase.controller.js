import * as phaseService from '../services/phase.service.js';
import { createPhaseSchema, updatePhaseSchema, createSubPhaseSchema, createTaskSchema, updateTaskSchema } from '../validations/phase.validation.js';

export const addPhase = async (req, res) => {
    try {
        const validation = createPhaseSchema.safeParse(req);
        if (!validation.success) return res.status(400).json({ status: "fail", errors: validation.error.issues });
        
        const phase = await phaseService.createPhase(validation.data.body);
        return res.status(201).json({ status: "success", data: phase });
    } catch (error) { return res.status(500).json({ status: "fail", message: error.message }); }
};

export const getPhases = async (req, res) => {
    try {
        const phases = await phaseService.getProjectPhases(req.params.projectId);
        return res.status(200).json({ status: "success", data: phases });
    } catch (error) { return res.status(500).json({ status: "fail", message: error.message }); }
};

export const getSinglePhase = async (req, res) => {
    try {
        const phase = await phaseService.getPhaseDetails(req.params.id);
        if (!phase) return res.status(404).json({ status: "fail", message: "Phase not found" });
        return res.status(200).json({ status: "success", data: phase });
    } catch (error) { return res.status(500).json({ status: "fail", message: error.message }); }
};

export const editPhase = async (req, res) => {
    try {
        const validation = updatePhaseSchema.safeParse(req);
        if (!validation.success) return res.status(400).json({ status: "fail", errors: validation.error.issues });
        
        const phase = await phaseService.updatePhase(req.params.id, validation.data.body);
        return res.status(200).json({ status: "success", data: phase });
    } catch (error) { return res.status(500).json({ status: "fail", message: error.message }); }
};

export const addSubPhase = async (req, res) => {
    try {
        const validation = createSubPhaseSchema.safeParse(req);
        if (!validation.success) return res.status(400).json({ status: "fail", errors: validation.error.issues });
        
        const subPhase = await phaseService.createSubPhase(validation.data.body);
        return res.status(201).json({ status: "success", data: subPhase });
    } catch (error) { return res.status(500).json({ status: "fail", message: error.message }); }
};

export const addTask = async (req, res) => {
    try {
        const validation = createTaskSchema.safeParse(req);
        if (!validation.success) return res.status(400).json({ status: "fail", errors: validation.error.issues });
        
        const task = await phaseService.createTask(validation.data.body);
        return res.status(201).json({ status: "success", data: task });
    } catch (error) { return res.status(500).json({ status: "fail", message: error.message }); }
};

export const editTask = async (req, res) => {
    try {
        if (req.body.assigneeId === "") req.body.assigneeId = null;

        const validation = updateTaskSchema.safeParse(req);
        if (!validation.success) return res.status(400).json({ status: "fail", errors: validation.error.issues });
        
        const task = await phaseService.updateTask(req.params.taskId, validation.data.body);
        return res.status(200).json({ status: "success", data: task });
    } catch (error) { 
        return res.status(500).json({ status: "fail", message: error.message }); 
    }
};