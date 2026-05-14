import { getEnvVariable } from "../utils/tokenManagement";

// read all possible variables
const smtpService = getEnvVariable("SMTP_SERVICE");
const smtpHost = getEnvVariable("SMTP_HOST");
const smtpPort = getEnvVariable("SMTP_PORT");
const smtpUser = getEnvVariable("SMTP_USER");
const smtpPassword = getEnvVariable("SMTP_PASSWORD");
const fromEmail = getEnvVariable("FROM_EMAIL");

let transportOptions: any;

if (smtpService === "gmail") {
    // gmail config
    transportOptions = {
        service: "gmail",
        auth: {
            user: smtpUser,
            pass: smtpPassword,
        },
    };
} else {
    // generic SMTP config
    transportOptions = {
        host: smtpHost,
        port: parseInt(smtpPort || "587", 10),
        secure: parseInt(smtpPort || "587", 10) === 465,
        auth: {
            user: smtpUser,
            pass: smtpPassword,
        },
    };
}

export const emailConfig = {
    SMTP_USER: smtpUser,
    FROM_EMAIL: fromEmail,
    transportOptions,
};

// const emailConfig = {
//     SMTP_USER: process.env.SMTP_USER!,
//     GOOGLE_APP_PASSWORD: process.env.GOOGLE_APP_PASSWORD!,
//     FROM_EMAIL: process.env.FROM_EMAIL!,
// };

export default emailConfig;
