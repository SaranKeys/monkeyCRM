import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import crypto from 'crypto';  
import prisma from '../config/prisma.js';  
import { sendPasswordResetOTP } from './email.service.js';

export const loginUser = async (email, password) => {
    const targetEmail = process.env.ADMIN_EMAIL || "admin@monkeycrm.com";
    const targetPassword = process.env.ADMIN_PASSWORD || "admin123@";

    if (email === targetEmail && password === targetPassword) {
        
        const adminDbUser = await prisma.user.findUnique({ 
            where: { email },
            include: { employeeProfile: true } 
        });
        
        const adminId = adminDbUser ? adminDbUser.id : "000000000000000000000000";

        const token = jwt.sign(
            { id: adminId, role: 'ADMIN', email }, 
            process.env.JWT_SECRET, 
            { expiresIn: '1d' }
        );
        
        return { 
            token, 
            user: { 
                id: adminId, 
                email, 
                role: 'ADMIN', 
                name: 'Super Admin',
                employeeProfile: adminDbUser?.employeeProfile,
                permissions: null 
            } 
        };
    }

    const dbUser = await prisma.user.findUnique({
        where: { email },
        include: {
            employeeProfile: true 
        }
    });

    if (!dbUser) {
        const error = new Error('Invalid email or password');
        error.statusCode = 401;
        throw error;
    }

    const isPasswordValid = await bcrypt.compare(password, dbUser.password);
    if (!isPasswordValid) {
        const error = new Error('Invalid email or password');
        error.statusCode = 401;
        throw error;
    }

    if (!dbUser.isActive) {
        const error = new Error('Your account has been deactivated. Please contact support.');
        error.statusCode = 403;
        throw error;
    }

    let userPermissions = null;
    if (dbUser.employeeProfile?.designation) {
        const roleRecord = await prisma.companyRole.findUnique({
            where: { name: dbUser.employeeProfile.designation }
        });
        userPermissions = roleRecord?.permissions || null;
    }

    const payload = {
        id: dbUser.id,
        role: dbUser.role, 
        email: dbUser.email
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });

    return {
        token,
        user: {
            id: dbUser.id,
            email: dbUser.email,
            role: dbUser.role,
            employeeProfile: dbUser.employeeProfile,
            permissions: userPermissions 
        }
    };
};

export const changePassword = async (userId, currentPassword, newPassword) => {
    if (userId === "000000000000000000000000") {
        const error = new Error("Super Admin password must be changed in environment variables.");
        error.statusCode = 403;
        throw error;
    }

    const dbUser = await prisma.user.findUnique({
        where: { id: userId }
    });

    if (!dbUser) {
        const error = new Error("User not found");
        error.statusCode = 404;
        throw error;
    }

    const isPasswordValid = await bcrypt.compare(currentPassword, dbUser.password);
    if (!isPasswordValid) {
        const error = new Error("Incorrect current password. Please try again.");
        error.statusCode = 401;
        throw error;
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
        where: { id: userId },
        data: { password: hashedNewPassword }
    });

    return true;
};

export const requestPasswordReset = async (email) => {
    const dbUser = await prisma.user.findUnique({ where: { email } });

    if (!dbUser) return true; 

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    const otpExpiry = new Date(Date.now() + 15 * 60 * 1000);

    await prisma.user.update({
        where: { email },
        data: {
            resetOtp: otp,
            resetOtpExpiry: otpExpiry
        }
    });

    await sendPasswordResetOTP(email, otp);
    return true;
};

export const verifyAndResetPassword = async (email, otp, newPassword) => {
    const dbUser = await prisma.user.findUnique({ where: { email } });

    if (!dbUser) {
        const error = new Error("Invalid request");
        error.statusCode = 400;
        throw error;
    }

    if (dbUser.resetOtp !== otp) {
        const error = new Error("Invalid OTP");
        error.statusCode = 400;
        throw error;
    }

    if (new Date() > dbUser.resetOtpExpiry) {
        const error = new Error("OTP has expired. Please request a new one.");
        error.statusCode = 400;
        throw error;
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
        where: { email },
        data: { 
            password: hashedNewPassword,
            resetOtp: null,
            resetOtpExpiry: null
        }
    });

    return true;
};

export const verifyOtp = async (email, otp) => {
    const dbUser = await prisma.user.findUnique({ where: { email } });

    if (!dbUser || dbUser.resetOtp !== otp) {
        const error = new Error("Invalid OTP");
        error.statusCode = 400;
        throw error;
    }

    if (new Date() > dbUser.resetOtpExpiry) {
        const error = new Error("OTP has expired. Please request a new one.");
        error.statusCode = 400;
        throw error;
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 15 * 60 * 1000);

    await prisma.user.update({
        where: { email },
        data: { 
            resetToken,
            resetTokenExpiry,
            resetOtp: null,
            resetOtpExpiry: null
        }
    });

    return resetToken;
};

export const submitNewPassword = async (token, newPassword) => {
    const dbUser = await prisma.user.findFirst({
        where: { resetToken: token }
    });

    if (!dbUser) {
        const error = new Error("Invalid or expired reset session. Please restart the process.");
        error.statusCode = 400;
        throw error;
    }

    if (new Date() > dbUser.resetTokenExpiry) {
        const error = new Error("Reset session expired. Please request a new OTP.");
        error.statusCode = 400;
        throw error;
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
        where: { id: dbUser.id },
        data: { 
            password: hashedNewPassword,
            resetToken: null,
            resetTokenExpiry: null
        }
    });

    return true;
};

export const getMyProfile = async (userId, role) => {
    if (role === 'CLIENT') {
        const client = await prisma.clientProfile.findUnique({
            where: { userId: userId },  
            include: {
                user: { select: { email: true, isActive: true } }
            }
        });

        if (!client) {
            const err = new Error('Client profile not found');
            err.code = 'P2025';
            throw err;
        }
        return { type: "CLIENT", profile: client };
    }

    if (role === 'EMPLOYEE' || role === 'ADMIN') {
        const employee = await prisma.employeeProfile.findUnique({
            where: { userId: userId },  
            include: {
                user: { select: { email: true, isActive: true, role: true } }
            }
        });

        if (!employee) {
            const err = new Error('Employee profile not found');
            err.code = 'P2025';
            throw err;
        }
        return { type: "EMPLOYEE", profile: employee };
    }

    throw new Error('Invalid user role');
};


export const getMe = async (userId) => {
    const dbUser = await prisma.user.findUnique({
        where: { id: userId },
        include: { employeeProfile: true }
    });

    if (!dbUser) throw new Error("User not found");

    let userPermissions = null;
    if (dbUser.employeeProfile?.designation) {
        const roleRecord = await prisma.companyRole.findUnique({
            where: { name: dbUser.employeeProfile.designation }
        });
        userPermissions = roleRecord?.permissions || null;
    }

    return {
        id: dbUser.id,
        email: dbUser.email,
        role: dbUser.role,
        employeeProfile: dbUser.employeeProfile,
        permissions: userPermissions 
    };
};
