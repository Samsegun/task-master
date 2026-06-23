import nodemailer, { SentMessageInfo } from "nodemailer";
import emailConfig from "../config/email.config";

class EmailService {
    static #transporter = nodemailer.createTransport(
        emailConfig.transportOptions,
    );

    static sendVerificationEmail = async (
        email: string,
        verificationToken: string,
        invitationToken?: string,
    ) => {
        // const verificationUrl = `${process.env.FRONTEND_URL}/api/auth/verify-email?token=${verificationToken}`;
        const verificationUrl = invitationToken
            ? `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}&invitationToken=${invitationToken}`
            : `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;

        const mailOptions = {
            from: emailConfig.FROM_EMAIL,
            to: email,
            subject: "Task-Master - Verify Your Email Address",
            html: `
        <section>
        <h1>Email Verification</h1>
        <p>Please click the link below to verify your email address:</p>
        <a href="${verificationUrl}">Verify Email</a>
        <p>This link will expire in 24 hours.</p>
        </section>
      `,
        };

        try {
            console.log("Sending email...");

            const info: SentMessageInfo =
                await this.#transporter.sendMail(mailOptions);

            console.log("Email sent");

            // only log preview URLs if explicitly using Ethereal in development
            if (emailConfig.nodeEnv === "development") {
                const previewUrl = nodemailer.getTestMessageUrl(info);
                if (previewUrl) {
                    console.log(
                        "Ethereal message sent! Preview URL: ",
                        previewUrl,
                    );
                }
            }
        } catch (error) {
            console.error("Error sending email:", error);
            throw error;
        }
    };

    static sendPasswordResetEmail = async (
        email: string,
        resetPasswordToken: string,
    ) => {
        // const resetPasswordUrl = `${
        //     process.env.FRONTEND_URL
        // }/api/auth/reset-password?token=${resetPasswordToken}&email=${encodeURIComponent(
        //     email
        // )}`;

        const resetPasswordUrl = `${
            process.env.FRONTEND_URL
        }/reset-password?token=${resetPasswordToken}&email=${encodeURIComponent(
            email,
        )}`;

        const mailOptions = {
            from: emailConfig.FROM_EMAIL,
            to: email,
            subject: "Task-Master - Reset Your Password ",
            html: `
            <section>
            <h1>Reset Password</h1>
            <p>Please click the link below to reset your password:</p>
            <a href="${resetPasswordUrl}">Reset Password</a>
            <p>This link will expire in 10 minutes.</p>
            </section>
          `,
        };

        try {
            console.log("Sending email...");
            const info: SentMessageInfo =
                await this.#transporter.sendMail(mailOptions);

            console.log("Email sent");

            if (emailConfig.nodeEnv === "development") {
                const previewUrl = nodemailer.getTestMessageUrl(info);
                if (previewUrl) {
                    console.log(
                        "Ethereal message sent! Preview URL: ",
                        previewUrl,
                    );
                }
            }
        } catch (error) {
            console.error("Error sending email:", error);
            throw error;
        }
    };

    static sendProjectInvitationEmail = async (
        email: string,
        payload: {
            inviterName: string;
            projectName: string;
            invitationToken: string;
            isNewUser: boolean;
        },
    ) => {
        const { inviterName, projectName, invitationToken, isNewUser } =
            payload;

        const invitationUrl = `${process.env.FRONTEND_URL}/process-invitation?token=${invitationToken}`;

        const htmlContent = isNewUser
            ? `
            <p><strong>${inviterName}</strong> has invited you to join <strong>${projectName}</strong> on TaskMaster.</p>
            <p>You'll need to create an account first, then you can accept the invitation.</p>
            <a href="${process.env.FRONTEND_URL}/register?invitationToken=${invitationToken}">
                Create Account & Join Project
            </a>
        `
            : `
            <p><strong>${inviterName}</strong> has invited you to join <strong>${projectName}</strong>.</p>
            <a href="${invitationUrl}">Accept Invitation</a>
        `;

        const mailOptions = {
            from: process.env.FROM_EMAIL,
            to: email,
            subject: `You've been invited to join ${projectName}`,
            html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2>Project Invitation</h2>
                <p>Hi there,</p>

                ${htmlContent}
                
                <p style="color: #666; font-size: 14px;">
                    This invitation will expire in 7 days.
                </p>
               
            </div>
        `,
        };

        try {
            console.log("Sending invitation email...");
            const info: SentMessageInfo =
                await this.#transporter.sendMail(mailOptions);

            console.log("Email sent");

            if (emailConfig.nodeEnv === "development") {
                const previewUrl = nodemailer.getTestMessageUrl(info);
                if (previewUrl) {
                    console.log(
                        "Ethereal message sent! Preview URL: ",
                        previewUrl,
                    );
                }
            }
        } catch (error) {
            console.error("Error sending email:", error);
            throw error;
        }
    };
}

export default EmailService;
