import { z } from 'zod';

const ProjectPriorityEnum = z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]);
const TicketStatusEnum = z.enum(["OPEN", "IN_PROGRESS", "IN_REVIEW", "RESOLVED", "CLOSED"]);
const objectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid MongoDB ID format");

export const createTicketSchema = z.object({
    body: z.object({
        subject: z.string().min(3, "Subject must be at least 3 characters"),
        details: z.string().min(5, "Please provide more details"),
        priority: ProjectPriorityEnum,
        projectId: objectIdSchema,
        assigneeId: objectIdSchema.optional().nullable(),
    })
});

export const updateTicketSchema = z.object({
    body: z.object({
        subject: z.string().min(3).optional(),
        details: z.string().min(5).optional(),
        priority: ProjectPriorityEnum.optional(),
        status: TicketStatusEnum.optional(),
        assigneeId: objectIdSchema.optional().nullable(),
    })
});

export const createCommentSchema = z.object({
    body: z.object({
        text: z.string().min(1, "Reply cannot be empty")
    })
});