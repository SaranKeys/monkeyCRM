import { z } from 'zod';

const page2FieldSchema = z.object({
    label: z.string().min(1, "Label is required"),
    placeholder: z.string().optional()
});

export const createServiceSchema = z.object({
    body: z.object({
        name: z.string().min(1, "Service name is required"),
        icon: z.string().min(1, "Icon name is required"),
        page2Fields: z.array(page2FieldSchema).default([])
    })
});


export const updateServiceSchema = z.object({
    body: z.object({
        name: z.string().min(1, "Service name cannot be empty").optional(),
        icon: z.string().min(1, "Icon name cannot be empty").optional(),
        page2Fields: z.array(page2FieldSchema).optional(),
    })
});