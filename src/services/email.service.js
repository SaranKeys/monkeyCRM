import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com', 
    port: process.env.SMTP_PORT || 587,
    secure: false,
    auth: {
        user: process.env.SMTP_USER || "dev.promonkey@gmail.com" , 
        pass: process.env.SMTP_PASS || "izevbpblgoerbqym"
    },
    logger: true, 
    debug: true
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



export const sendClientWelcomeEmail = async (toEmail, clientName, rawPassword, loginUrl) => {
    const mailOptions = {
        from: `"proMonkey CRM" <${process.env.SMTP_USER || "dev.promonkey@gmail.com"}>`,
        to: toEmail,
        subject: 'Welcome to proMonkey CRM - Your Account is Ready',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
                <h2 style="color: #2563eb;">Welcome to proMonkey CRM, ${clientName}!</h2>
                <p>Your client portal account has been successfully created by our administration team.</p>
                <p>You can use this portal to track project progress, view updates, and manage your documents.</p>
                
                <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #e2e8f0;">
                    <h3 style="margin-top: 0; color: #1e293b;">Your Login Credentials</h3>
                    <p><strong>Login URL:</strong> <a href="${loginUrl}" style="color: #2563eb;">${loginUrl}</a></p>
                    <p><strong>Email:</strong> ${toEmail}</p>
                    <p><strong>Password:</strong> <span style="font-family: monospace; background: #e2e8f0; padding: 2px 6px; border-radius: 4px;">${rawPassword}</span></p>
                </div>
                
                <p><em>For security reasons, we highly recommend changing your password after your first login.</em></p>
                <br/>
                <p>Best Regards,<br/><strong>The proMonkey Team</strong></p>
            </div>
        `
    };

    try {
        console.log(`[Email Service] Attempting to send welcome email to: ${toEmail}...`);
        
        const info = await transporter.sendMail(mailOptions);
        
        console.log('----------------------------------------------------');
        console.log(`[Email Service] SUCCESS! Email sent successfully.`);
        console.log(`[Email Service] Message ID: ${info.messageId}`);
        console.log(`[Email Service] Accepted by Google:`, info.accepted);
        console.log(`[Email Service] Rejected by Google:`, info.rejected);
        console.log('----------------------------------------------------');
        
        return true;
    } catch (error) {
        console.error('----------------------------------------------------');
        console.error('[Nodemailer Error - Welcome Email]:', error.message);
        console.error('Full Error Stack:', error);
        console.error('----------------------------------------------------');
        return false; 
    }
};