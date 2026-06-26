import { z } from 'zod';

export const registerEmployeeSchema = z.object({
    body: z.object({
        email: z.string().email("Invalid email format"),
        password: z.string().min(8, "Password must be at least 8 characters"),
        role: z.enum(['ADMIN', 'EMPLOYEE', 'CLIENT']).default('EMPLOYEE'),

        legalName: z.string().min(2, "Legal name is required"),
        preferredName: z.string().optional(),
        dob: z.coerce.date({ required_error: "Date of birth is required" }),
        gender: z.enum(['MALE', 'FEMALE', 'OTHER']),
        personalMobile: z.string().min(10, "Valid mobile number is required"),
        bloodGroup: z.string().optional(),

        emergencyName: z.string().min(2, "Emergency contact name required"),
        emergencyRelation: z.string().min(2, "Emergency relation required"),
        emergencyPhone: z.string().min(10, "Emergency phone required"),

        aadhaarNumber: z.string().length(12, "Aadhaar must be exactly 12 digits").regex(/^\d+$/, "Aadhaar must contain only numbers"),
        panNumber: z.string().length(10, "PAN must be exactly 10 characters").regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, "Invalid PAN format"),

        currentAddress: z.string().min(5, "Current address is required"),
        permanentAddress: z.string().min(5, "Permanent address is required"),

        accountName: z.string().min(2, "Account holder name is required"),
        bankName: z.string().min(2, "Bank name is required"),
        accountNumber: z.string().min(5, "Account number is required"),
        ifscCode: z.string().length(11, "IFSC must be exactly 11 characters"),
        branchName: z.string().min(2, "Branch name is required"),

        designation: z.string().min(2, "Designation is required"),
        department: z.string().min(2, "Department is required"),
        reportingManager: z.string().optional(),
        employmentType: z.enum(['FULL_TIME', 'PART_TIME', 'INTERN', 'CONTRACTOR']),
        workMode: z.enum(['ONSITE', 'HYBRID', 'REMOTE']),
        baseLocation: z.string().min(2, "Base location is required"),
        dateOfJoining: z.coerce.date({ required_error: "Date of joining is required" }),
        probationDays: z.coerce.number().int().nonnegative(),
        totalExperience: z.coerce.number().nonnegative(),
        relevantExp: z.coerce.number().nonnegative()
    })
});


export const updateEmployeeSchema = z.object({
    body: registerEmployeeSchema.shape.body.partial().omit({ 
        email: true, 
        password: true, 
        role: true 
    }) 
});