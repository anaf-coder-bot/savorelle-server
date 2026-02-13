import nodemailer from "nodemailer";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user:process.env.EMAIL_USER,
        pass:process.env.EMAIL_PASS
    },
});

const get_template = async (filename) => {
    const templatePath = path.join(__dirname, `../templates/${filename}`);
    return await fs.readFile(templatePath, "utf-8");
};

export const sendWelcomeEmail = async (data) => {
    try {

        let htmlContent = await get_template("welcome-email.html");

        htmlContent = htmlContent
                            .replace(/{{name}}/g, data.name)
                            .replace(/{{username}}/g, data.username)
                            .replace(/{{password}}/g, data.pass)
                            .replace(/{{path}}/g, process.env.FRONTEND);
        
        transporter.sendMail({
            from: '"Savorelle Restaurant" <noreply@savorelle.com>',
            to: data.email,
            subject: 'Welcome to the Savorelle Team! 🥂',
            html: htmlContent,
        });
        return {success:true};

    } catch(error) {
        console.error("Error while sending welcome email:",error.message);
    };
};

export const notifyEmailChange = async (data) => {
    try {
        let htmlContent = await get_template("Email-update.html");

        htmlContent = htmlContent
                        .replace(/{{username}}/g, data.username)
                        .replace(/{{newEmail}}/g, data.newEmail);
        
        const recipients = [data.oldEmail, data.newEmail];

        recipients.map(email => 
            transporter.sendMail({
                from: '"Savorelle Security" <noreply@savorelle.com>',
                to: email,
                subject: 'Your Savorelle account email was updated.',
                html: htmlContent,
            }),
        );
        return {success:true};

    } catch(error) {
        console.error("Error while sending notify email email:",error.message);
    };
};

export const confirmEmail = async (data) => {
    try {
        let htmlContent = await get_template("Confirm-Email.html");

        htmlContent = htmlContent
                        .replace(/{{customer_name}}/g, data.name)
                        .replace(/{{code}}/g, data.code);
        
        transporter.sendMail({
            from: '"Savorelle Restaurant" <noreply@savorelle.com>',
            to:data.email,
            subject: 'Confirm your gmail.',
            html:htmlContent
        });
        return true;
    } catch(error) {
        console.error("Error while sending confirm email email:",error.message);
    };
};