import nodemailer, { SentMessageInfo } from "nodemailer";
import emailConfig from "../config/email.config";

class EmailService {
    // static #transporter = nodemailer.createTransport({
    //     service: "gmail",
    //     auth: {
    //         user: emailConfig.SMTP_USER,
    //         pass: emailConfig.GOOGLE_APP_PASSWORD,
    //     },
    // });
    static #transporter = nodemailer.createTransport(
        emailConfig.transportOptions
    );

    static sendVerificationEmail = async (
        email: string,
        verificationToken: string
    ) => {
        const verificationUrl = `${process.env.FRONTEND_URL}/api/auth/verify-email?token=${verificationToken}`;
        // const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;

        const mailOptions = {
            from: emailConfig.FROM_EMAIL,
            to: email,
            subject: "Verify Your Email Address - Task-Master",
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

            const info: SentMessageInfo = await this.#transporter.sendMail(
                mailOptions
            );

            console.log("Email sent");
            console.log(
                "Ethereal message sent! Preview URL: ",
                nodemailer.getTestMessageUrl(info)
            );
        } catch (error) {
            console.error("Error sending email:", error);
            throw error;
        }
    };

    static sendPasswordResetEmail = async (
        email: string,
        resetPasswordToken: string
    ) => {
        const resetPasswordUrl = `${
            process.env.FRONTEND_URL
        }/api/auth/reset-password?token=${resetPasswordToken}&email=${encodeURIComponent(
            email
        )}`;
        // const resetPasswordUrl = `${
        //     process.env.FRONTEND_URL
        // }/reset-password?token=${resetPasswordToken}&email=${encodeURIComponent(
        //     email
        // )}`;

        const mailOptions = {
            from: process.env.FROM_EMAIL!,
            to: email,
            subject: "Reset Your Password - Task-Master",
            html: `
            <section>
            <h1>Reset Password</h1>
            <p>Please click the link below to reset your password:</p>
            <a href="${resetPasswordUrl}">Reset Password</a>
            <p>This link will expire in 1 hour.</p>
            </section>
          `,
        };

        try {
            console.log("Sending email...");

            await this.#transporter.sendMail(mailOptions);

            console.log("Email sent");
        } catch (error) {
            console.error("Error sending email:", error);
            throw error;
        }
    };
}

export default EmailService;
