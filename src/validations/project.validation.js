import { z } from 'zod';

const ProjectTypeEnum = z.enum([
  "WEBSITE", "WEB_APP", "CRM", "E_COMMERCE", "MOBILE_APP", 
  "DIGITAL_MARKETING", "MAINTENANCE", "AUTOMATION", "AI_WORKFLOW", "AI_AGENT"
]);

const ProjectPriorityEnum = z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]);
const EngagementTypeEnum = z.enum(["PROJECT", "RETAINER", "RETAINER_BUILD"]);
const MilestoneTypeEnum = z.enum(["INTERNAL_MEETING", "CLIENT_MEETING", "MILESTONE"]);

const objectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid MongoDB ID format");

const milestoneSchema = z.object({
    title: z.string().min(1, "Milestone title is required"),
    description: z.string().optional(),
    type: MilestoneTypeEnum,
    dueDate: z.coerce.date({ required_error: "Due date is required" }) 
});

export const createProjectSchema = z.object({
    body: z.object({
        // Basic Details
        name: z.string().min(2, "Project name must be at least 2 characters"),
        description: z.string().optional(),
        // type: ProjectTypeEnum,
        serviceId: objectIdSchema,
        priority: ProjectPriorityEnum,
        engagementType: EngagementTypeEnum,
        clientId: objectIdSchema,

        // Client Inputs
        clientRequirements: z.record(z.any()).optional(),

        // Internal Inputs
        estimatedHours: z.number().int().positive("Hours must be a positive number").optional(),
        techStack: z.array(z.string()).default([]),  
        customInstructions: z.string().optional(),
        
        // validates the +1/-1 counters from UI  
        requiredResources: z.record(z.number()).optional(),
        
        leadId: objectIdSchema.optional().nullable(),
        
        // Array of employee Profile IDs
        memberIds: z.array(objectIdSchema).default([]), 

        // Project Runway
        milestones: z.array(milestoneSchema).default([])
    })
});


export const updateProjectSchema = z.object({
  body: z.object({
    name: z.string().min(1, "Project name cannot be empty").optional(),
    description: z.string().optional().nullable(),
    
    serviceId: objectIdSchema.optional(),
    clientId: objectIdSchema.optional(),
    
    priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
    status: z.enum(["DRAFT", "ACTIVE", "ON_HOLD", "COMPLETED", "CANCELLED"]).optional(),
    engagementType: z.enum(["PROJECT", "RETAINER", "RETAINER_BUILD"]).optional(),
    
    clientRequirements: z.any().optional(), 
    requiredResources: z.any().optional(),  
        
    estimatedHours: z.number().int().positive().optional(),
    techStack: z.array(z.string()).optional(),
    customInstructions: z.string().optional().nullable(),
    
    leadId: objectIdSchema.optional().nullable(),
    memberIds: z.array(objectIdSchema).optional(),
  })
});