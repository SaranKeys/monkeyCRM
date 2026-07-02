import { z } from 'zod';

// PROJECT UPDATE TAB
const objectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid MongoDB ID");
const ApprovalStatusEnum = z.enum(["NONE", "PENDING", "APPROVED", "REJECTED", "REWORK_REQUESTED"]);

const attachmentSchema = z.object({
    name: z.string(),
    url: z.string(),
    type: z.string()
});

export const createUpdateSchema = z.object({
    body: z.object({
        content: z.string().min(1, "Update content cannot be empty"),
        attachments: z.array(attachmentSchema).optional(),
        
        clientView: z.preprocess((val) => val === 'true' || val === true, z.boolean()).default(true),
        
        approvalStatus: ApprovalStatusEnum.default("NONE"),
        assignedApproverId: objectIdSchema.optional().nullable(),
        projectId: objectIdSchema
    })
});

export const updateStatusSchema = z.object({
    body: z.object({
        clientView: z.boolean().optional(),
        approvalStatus: ApprovalStatusEnum.optional(),
        assignedApproverId: objectIdSchema.optional().nullable()
    })
});

export const replySchema = z.object({
    body: z.object({
        text: z.string().min(1, "Reply cannot be empty")
    })
});