import * as authService from '../services/auth.service.js';

export const handleLogin = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        const result = await authService.loginUser(email, password);

        return res.status(200).json({
            status: 'success',
            message: 'Authentication successful',
            token: result.token,
            data: result.user  
        });
    } catch (error) {
        return res.status(error.statusCode || 500).json({
            status: 'fail',
            message: error.message || 'Internal Server Error'
        });
    }
};

export const getMe = async (req, res) => {
    try {
        const userData = await authService.getMe(req.user.id);
        return res.status(200).json({
            status: 'success',
            data: userData
        });
    } catch (error) {
        return res.status(401).json({ status: 'fail', message: error.message });
    }
};