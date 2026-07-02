import { getEnvVariable } from "../utils/tokenManagement";

// read all possible variables
const smtpService = getEnvVariable("SMTP_SERVICE");
const smtpHost = getEnvVariable("SMTP_HOST");
const smtpPort = getEnvVariable("SMTP_PORT");
const smtpUser = getEnvVariable("SMTP_USER");
const smtpPassword = getEnvVariable("SMTP_PASSWORD");
const fromEmail = getEnvVariable("FROM_EMAIL");
const nodeEnv = getEnvVariable("NODE_ENV");

let transportOptions: any;

if (smtpService === "gmail") {
    // gmail config for prod
    transportOptions = {
        service: "gmail",
        host: smtpHost,
        port: parseInt(smtpPort, 10),
        secure: parseInt(smtpPort, 10) === 465,
        auth: {
            user: smtpUser,
            pass: smtpPassword,
        },
        timeout: 20000,
    };
} else {
    // generic SMTP config for dev/tests
    transportOptions = {
        host: smtpHost,
        port: parseInt(smtpPort || "587", 10),
        secure: parseInt(smtpPort || "587", 10) === 465,
        auth: {
            user: smtpUser,
            pass: smtpPassword,
        },
        timeout: 20000,
    };
}

export const emailConfig = {
    SMTP_USER: smtpUser,
    FROM_EMAIL: fromEmail,
    transportOptions,
    nodeEnv,
};

export default emailConfig;
