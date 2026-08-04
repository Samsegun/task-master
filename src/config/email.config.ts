import { getEnvVariable } from "../utils/tokenManagement";

const resendApiKey = getEnvVariable("RESEND_API_KEY");
const fromEmail = getEnvVariable("FROM_EMAIL");
const nodeEnv = getEnvVariable("NODE_ENV");

const emailConfig = {
    provider: resendApiKey ? "resend" : "smtp",
    RESEND_API_KEY: resendApiKey,
    FROM_EMAIL: fromEmail,
    nodeEnv,
};

export default emailConfig;
