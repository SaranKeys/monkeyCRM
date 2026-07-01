import { z } from 'zod';

const MilestoneTypeEnum = z.enum(["INTERNAL_MEETING", "CLIENT_MEETING", "MILESTONE"]);
const MilestoneStatusEnum = z.enum(["UPCOMING", "IN_PROGRESS", "DONE", "CANCELLED"]);
const objectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid MongoDB ID");

export const runwayItemSchema = z.object({
    body: z.object({
        title: z.string().min(2, "Title is required"),
        type: MilestoneTypeEnum,
        dueDate: z.coerce.date({ required_error: "Due date is required" }),
        status: MilestoneStatusEnum.optional(),
        description: z.string().optional(),
        
        agenda: z.string().optional(),
        decisions: z.string().optional(),
        actionItems: z.string().optional(),
        
        ownerId: objectIdSchema.optional().nullable(),
        projectId: objectIdSchema
    })
});

export const updateRunwayItemSchema = z.object({
    body: z.object({
        title: z.string().optional(),
        type: MilestoneTypeEnum.optional(),
        dueDate: z.coerce.date().optional(),
        status: MilestoneStatusEnum.optional(),
        description: z.string().optional(),
        agenda: z.string().optional(),
        decisions: z.string().optional(),
        actionItems: z.string().optional(),
        ownerId: objectIdSchema.optional().nullable(),
    })
});