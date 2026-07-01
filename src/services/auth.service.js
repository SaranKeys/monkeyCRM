import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import prisma from '../config/prisma.js';  

export const loginUser = async (email, password) => {
    const targetEmail = process.env.ADMIN_EMAIL || "admin@monkeycrm.com";
    const targetPassword = process.env.ADMIN_PASSWORD || "admin123@";

  if (email === targetEmail && password === targetPassword) {
        
        const adminDbUser = await prisma.user.findUnique({ where: { email } });

        const adminId = adminDbUser ? adminDbUser.id : "000000000000000000000000";

        const token = jwt.sign(
            { id: adminId, role: 'ADMIN', email }, 
            process.env.JWT_SECRET, 
            { expiresIn: '1d' }
        );
        
        return { 
            token, 
            user: { id: adminId, email, role: 'ADMIN', name: 'Super Admin' } 
        };
    }

    const dbUser = await prisma.user.findUnique({
        where: { email }
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
            role: dbUser.role
        }
    };
};