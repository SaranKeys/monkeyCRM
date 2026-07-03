import { z } from 'zod';

const objectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid MongoDB ID");
const PriorityEnum = z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]);
const TaskStatusEnum = z.enum(["TO_DO", "IN_PROGRESS", "BLOCKED", "DONE"]);

export const createPhaseSchema = z.object({
    body: z.object({
        name: z.string().min(1, "Phase name is required"),
        startDate: z.coerce.date(),
        dueDate: z.coerce.date(),
        priority: PriorityEnum.default("MEDIUM"),
        estimatedHours: z.number().optional().default(0),
        leadId: objectIdSchema,
        projectId: objectIdSchema
    })
});

export const updatePhaseSchema = z.object({
    body: z.object({
        priority: PriorityEnum.optional(),
        startDate: z.coerce.date().optional(),
        dueDate: z.coerce.date().optional(),
        estimatedHours: z.number().optional(),
    })
});

export const createSubPhaseSchema = z.object({
    body: z.object({
        name: z.string().min(1),
        phaseId: objectIdSchema
    })
});

export const createTaskSchema = z.object({
    body: z.object({
        title: z.string().min(1),
        priority: PriorityEnum.default("MEDIUM"),
        status: TaskStatusEnum.default("TO_DO"),
        startDate: z.coerce.date().optional(),
        dueDate: z.coerce.date().optional(),
        phaseId: objectIdSchema,
        subPhaseId: objectIdSchema.optional().nullable(),
        assigneeId: objectIdSchema.optional().nullable()
    })
});

export const updateTaskSchema = z.object({
    body: z.object({
        title: z.string().min(1).optional(),
        priority: PriorityEnum.optional(),
        status: TaskStatusEnum.optional(),
        startDate: z.coerce.date().optional(),
        dueDate: z.coerce.date().optional(),
        assigneeId: objectIdSchema.optional().nullable()
    })
});

export const updateSubPhaseSchema = z.object({
  body: z.object({
    name: z.string().min(1, "Sub-phase name cannot be empty").optional()
  })
});