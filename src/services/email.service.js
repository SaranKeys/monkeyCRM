import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com', 
    port: process.env.SMTP_PORT || 587,
    secure: false,
    auth: {
        user: process.env.SMTP_USER || "dev.promonkey@gmail.com" , 
        pass: process.env.SMTP_PASS || "izevbpblgoerbqym"
    }
});

export const sendPasswordResetOTP = async (toEmail, otp) => {
    const mailOptions = {
        from: `"Monkey CRM Support" <${process.env.SMTP_USER}>`,
        to: toEmail,
        subject: 'Your Password Reset OTP',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2>Password Reset Request</h2>
                <p>We received a request to reset your password. Here is your One-Time Password (OTP):</p>
                <h1 style="background: #f4f4f4; padding: 10px; text-align: center; letter-spacing: 5px;">${otp}</h1>
                <p>This OTP is valid for <strong>15 minutes</strong>. Do not share this code with anyone.</p>
                <p>If you did not request this reset, you can safely ignore this email.</p>
            </div>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        return true;
    } catch (error) {
        console.error('[Nodemailer Error]:', error);
        throw new Error('Failed to send OTP email. Please try again later.');
    }
};