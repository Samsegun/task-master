const emailConfig = {
    SMTP_USER: process.env.SMTP_USER!,
    GOOGLE_APP_PASSWORD: process.env.GOOGLE_APP_PASSWORD!,
    FROM_EMAIL: process.env.FROM_EMAIL!,
};

export default emailConfig;
