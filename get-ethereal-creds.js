import nodemailer from "nodemailer";

async function generateCredentials() {
    // Create a test account
    const account = await nodemailer.createTestAccount();

    console.log("Your Ethereal credentials:");
    console.log("===========================");
    console.log("Host:", account.smtp.host);
    console.log("Port:", account.smtp.port);
    console.log("User:", account.user);
    console.log("Password:", account.pass);
}

generateCredentials();
