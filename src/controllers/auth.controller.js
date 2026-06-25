import * as authService from '../services/auth.service.js';

export const handleAdminLogin = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        const result = await authService.loginAdmin(email, password);

        return res.status(200).json({
            status: 'success',
            message: 'Admin authentication successful',
            token: result.token,
            user: result.user
        });
    } catch (error) {
        return res.status(error.statusCode || 500).json({
            status: 'fail',
            message: error.message || 'Internal Server Error'
        });
    }
};