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

export const handleChangePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const userId = req.user.id;  

        await authService.changePassword(userId, currentPassword, newPassword);

        return res.status(200).json({
            status: 'success',
            message: 'Password updated successfully. You can now use your new password to log in.'
        });
    } catch (error) {
        return res.status(error.statusCode || 500).json({
            status: 'fail',
            message: error.message || 'Internal Server Error'
        });
    }
};


export const forgotPassword = async (req, res) => {
    try {
        await authService.requestPasswordReset(req.body.email);
        
        return res.status(200).json({
            status: 'success',
            message: 'If that email exists in our system, an OTP has been sent.'
        });
    } catch (error) {
        return res.status(error.statusCode || 500).json({ status: 'fail', message: error.message });
    }
};


export const verifyOtp = async (req, res) => {
    try {
        const { email, otp } = req.body;
        const resetToken = await authService.verifyOtp(email, otp);
        
        return res.status(200).json({
            status: 'success',
            message: 'OTP verified successfully.',
            data: { resetToken } 
        });
    } catch (error) {
        return res.status(error.statusCode || 500).json({ status: 'fail', message: error.message });
    }
};

export const resetPassword = async (req, res) => {
    try {
        const { token, newPassword } = req.body;
        await authService.submitNewPassword(token, newPassword);
        
        return res.status(200).json({
            status: 'success',
            message: 'Password reset successfully. You can now log in.'
        });
    } catch (error) {
        return res.status(error.statusCode || 500).json({ status: 'fail', message: error.message });
    }
};


export const getMyProfileInfo = async (req, res) => {
  try {
    const { id: userId, role } = req.user; 

    const result = await authService.getMyProfile(userId, role);

    return res.status(200).json({ 
        status: "success", 
        userType: result.type, 
        data: result.profile 
    });
  } catch (error) {
    if (error.code === "P2025") {
      return res.status(404).json({ status: "fail", message: "Profile not found." });
    }
    return res.status(500).json({ status: "fail", message: error.message });
  }
};