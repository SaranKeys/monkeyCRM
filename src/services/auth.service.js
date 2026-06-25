import jwt from 'jsonwebtoken';

export const loginAdmin = async (email, password) => {
    const targetEmail = process.env.ADMIN_EMAIL || "admin@monkeycrm.com";
    const targetPassword = process.env.ADMIN_PASSWORD || "admin123@";

    if (email !== targetEmail || password !== targetPassword) {
        const error = new Error('Invalid email or password');
        error.statusCode = 401;
        throw error;
    }

    const payload = {
        role: 'ADMIN',
        email: targetEmail
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1d' });

    return {
        token,
        user: {
            email: targetEmail,
            role: 'ADMIN'
        }
    };
};