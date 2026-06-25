import { z } from 'zod';

export const companyRoleSchema = z.object({
    body: z.object({
        name: z.string().trim().min(2, "Role name is required"),
        description: z.string().trim().optional()
    })
});