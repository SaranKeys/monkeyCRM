import { z } from "zod";

const objectIdSchema = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, "Invalid MongoDB ID");
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
    projectId: objectIdSchema,
  }),
});

export const updatePhaseSchema = z.object({
  body: z.object({
    name: z.string().min(1, "Name cannot be empty").optional(),
    description: z.string().optional().nullable(),

    startDate: z.string().datetime().optional(),
    dueDate: z.string().datetime().optional(),

    priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),

    status: z.enum(["UPCOMING", "IN_PROGRESS", "COMPLETED"]).optional(),

    estimatedHours: z.number().int().nonnegative().optional(),
    loggedHours: z.number().int().nonnegative().optional(),

    leadId: z.string().length(24).optional().nullable(),
  }),
});

export const createSubPhaseSchema = z.object({
  body: z.object({
    name: z.string().min(1),
    phaseId: objectIdSchema,
  }),
});

export const createTaskSchema = z.object({
  body: z.object({
    title: z.string().min(1),
    priority: PriorityEnum.default("MEDIUM"),
    status: TaskStatusEnum.default("TO_DO"),
    startDate: z.coerce.date().optional().nullable(),
    dueDate: z.coerce.date().optional().nullable(),
    phaseId: objectIdSchema,
    subPhaseId: objectIdSchema.optional().nullable(),
    assigneeId: objectIdSchema.optional().nullable(),

    description: z.string().optional().nullable(),
    attachments: z.array(
      z.object({
        name: z.string(),
        url: z.string(),
        type: z.string(),
      })
    ).optional(),
  }),
});


export const updateTaskSchema = z.object({
  body: z.object({
    title: z.string().min(1).optional(),
    priority: PriorityEnum.optional(),
    status: TaskStatusEnum.optional(),
    startDate: z.coerce.date().optional().nullable(),
    dueDate: z.coerce.date().optional().nullable(),
    assigneeId: objectIdSchema.optional().nullable(),
    subPhaseId: objectIdSchema.optional().nullable(),
    
    estimatedHours: z.coerce.number().int().nonnegative().optional(),
    loggedHours: z.coerce.number().int().nonnegative().optional(),
    
    description: z.string().optional().nullable(),
    attachments: z.array(
      z.object({
        name: z.string(),
        url: z.string(),
        type: z.string(),
      })
    ).optional(),
  }),
});


export const updateSubPhaseSchema = z.object({
  body: z.object({
    name: z.string().min(1, "Sub-phase name cannot be empty").optional(),
  }),
});

export const createTaskUpdateSchema = z.object({
  body: z.object({
    content: z.string().min(1, "Content cannot be empty"),
    type: z.enum(["UPDATE", "QUESTION"]).default("UPDATE")
  })
});

export const createTaskReplySchema = z.object({
  body: z.object({
    text: z.string().min(1, "Reply cannot be empty")
  })
});

export const createTimeLogSchema = z.object({
  body: z.object({
    hours: z.number().positive("Hours must be greater than 0"),
    date: z.string().datetime(), 
    note: z.string().optional()
  })
});