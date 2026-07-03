import nodemailer, { SentMessageInfo } from "nodemailer";
import emailConfig from "../config/email.config";

class EmailService {
    static #transporter = nodemailer.createTransport(
        emailConfig.transportOptions,
    );

    // private static async verifyTransporter() {
    //     try {
    //         await this.#transporter.verify();
    //         console.log("SMTP transporter verified successfully.");
    //     } catch (error) {
    //         console.error("SMTP transporter verification failed:", error);
    //         throw error;
    //     }
    // }

    // private static async sendMailWithRetry(
    //     mailOptions: SendMailOptions,
    //     retries = 3,
    //     delayMs = 1000,
    // ): Promise<SentMessageInfo> {
    //     for (let attempt = 1; attempt <= retries; attempt += 1) {
    //         try {
    //             if (attempt === 1) {
    //                 await this.verifyTransporter();
    //             }

    //             return await this.#transporter.sendMail(mailOptions);
    //         } catch (error: any) {
    //             const isTimeout =
    //                 error?.code === "ETIMEDOUT" ||
    //                 error?.message?.includes("Connection timeout");

    //             if (attempt === retries || !isTimeout) {
    //                 console.error(
    //                     `Email send failed on attempt ${attempt}:`,
    //                     error,
    //                 );
    //                 throw error;
    //             }

    //             console.warn(
    //                 `Email send attempt ${attempt} failed with timeout. Retrying in ${delayMs}ms...`,
    //             );

    //             await new Promise((resolve) => setTimeout(resolve, delayMs));
    //             delayMs *= 2;
    //         }
    //     }

    //     throw new Error("Failed to send email after retries.");
    // }

    static sendVerificationEmail = async (
        email: string,
        verificationToken: string,
        invitationToken?: string,
    ) => {
        // const verificationUrl = `${process.env.FRONTEND_URL}/api/auth/verify-email?token=${verificationToken}`;
        const verificationUrl = invitationToken
            ? `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}&invitationToken=${invitationToken}`
            : `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;

        const html = `
      <section>
        <h1>Email Verification</h1>
        <p>Please click the link below to verify your email address:</p>
        <a href="${verificationUrl}">Verify Email</a>
        <p>This link will expire in 24 hours.</p>
      </section>
    `;

        // for dev and tests - we use terminal logging instead of sending real emails
        if (
            emailConfig.nodeEnv === "development" ||
            emailConfig.nodeEnv === "test"
        ) {
            console.log(
                "---------------- DEVELOPMENT EMAIL MOCK ----------------",
            );
            console.log(`To: ${email}`);
            console.log(`Subject: Verify your email address`);
            console.log(`Verification Link: ${verificationUrl}`);
            console.log(
                "--------------------------------------------------------",
            );

            // we return a mock success response so app backend doesn't crash
            return { id: "mock_id_dev_mode", dev: true };
        }

        const mailOptions = {
            from: emailConfig.FROM_EMAIL,
            to: email,
            subject: "Task-Master - Verify Your Email Address",
            html,
        };

        try {
            console.log("Sending verification email...");

            const info: SentMessageInfo =
                await this.#transporter.sendMail(mailOptions);

            console.log("Email sent");
            return info;
        } catch (error) {
            console.error("Error sending verification email:", error);
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

        if (
            emailConfig.nodeEnv === "development" ||
            emailConfig.nodeEnv === "test"
        ) {
            console.log(
                "---------------- DEVELOPMENT EMAIL MOCK ----------------",
            );
            console.log(`To: ${email}`);
            console.log(`Subject: Task-Master - Reset Your Password`);
            console.log(`Reset Password Link: ${resetPasswordUrl}`);
            console.log(
                "--------------------------------------------------------",
            );

            // we return a mock success response so app backend doesn't crash
            return { id: "mock_id_dev_mode", dev: true };
        }

        try {
            console.log("Sending reset password email...");

            const info: SentMessageInfo =
                await this.#transporter.sendMail(mailOptions);

            console.log("Email sent");
            return info;
        } catch (error) {
            console.error("Error sending reset password email:", error);
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
            from: emailConfig.FROM_EMAIL,
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

        if (
            emailConfig.nodeEnv === "development" ||
            emailConfig.nodeEnv === "test"
        ) {
            console.log(
                "---------------- DEVELOPMENT EMAIL MOCK ----------------",
            );
            console.log(`To: ${email}`);
            console.log(
                `Subject: Task-Master - You've been invited to join ${projectName}`,
            );
            console.log(htmlContent);
            console.log(
                "--------------------------------------------------------",
            );

            // we return a mock success response so app backend doesn't crash
            return { id: "mock_id_dev_mode", dev: true };
        }

        try {
            console.log("Sending invitation email...");

            const info: SentMessageInfo =
                await this.#transporter.sendMail(mailOptions);

            console.log("Invitation Email sent");
            return info;
        } catch (error) {
            console.error("Error sending invitation email:", error);
            throw error;
        }
    };
}

export default EmailService;
