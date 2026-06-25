import { z } from 'zod';

export const companyRoleSchema = z.object({
    body: z.object({
        name: z.string().trim().min(2, "Role name is required"),
        description: z.string().trim().optional()
    })
});

export const updatePermissionsSchema = z.object({
    body: z.object({
        permissions: z.record(z.any(), z.any({ required_error: "Permissions object is required" }))
    })
});