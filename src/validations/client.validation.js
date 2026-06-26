import { z } from 'zod';

export const registerClientSchema = z.object({
    body: z.object({
        email: z.string().trim().email("Invalid email format"),
        password: z.string().min(8, "Password must be at least 8 characters"),
        role: z.literal('CLIENT').default('CLIENT'),

        companyName: z.string().min(2, "Company Name is required"),
        brandName: z.string().optional(),
        website: z.string().url().optional().or(z.literal('')),
        industry: z.string().optional(),
        companySize: z.string().optional(),
        foundedYear: z.coerce.number().int().optional(),
        description: z.string().optional(),
        linkedin: z.string().url().optional().or(z.literal('')),

        contactName: z.string().min(2, "Primary contact name is required"),
        contactEmail: z.string().trim().email("Valid primary contact email is required"),
        contactPhone: z.string().min(10, "Valid phone number is required"),
        contactDesignation: z.string().optional(),
        contactMethod: z.string().optional(),
        timezone: z.string().optional(),

        additionalContacts: z.string().optional().transform((val) => {
            if (!val) return [];
            try { return JSON.parse(val); } catch { return []; }
        }),

        registeredAddress: z.string().optional(),
        operatingAddress: z.string().optional(),
        country: z.string().optional(),

        billingCurrency: z.string().optional(),
        billingContact: z.string().optional(),
        billingEmail: z.string().email().optional().or(z.literal('')),
        taxId: z.string().optional(),
        paymentTerms: z.string().optional(),
        paymentMethod: z.string().optional(),
        poRequired: z.coerce.boolean().optional().default(false),

        clientSince: z.coerce.date().optional(),
        source: z.string().optional(),
        accountOwner: z.string().optional(),
        engagementType: z.enum(['PROJECT', 'RETAINER', 'RETAINER_BUILD']).optional(),
        status: z.enum(['PROSPECT', 'ACTIVE', 'PAUSED', 'CHURNED']).optional().default('PROSPECT')
    })
});

export const updateClientSchema = z.object({
    body: registerClientSchema.shape.body.partial().omit({ 
        email: true, 
        password: true, 
        role: true 
    }) 
});