import nodemailer from "nodemailer";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
dotenv.config();
import Handlebars from "handlebars";

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

export const confirmPaymentEmail = async (data) => {
    try {
        data["first_fee"] = process.env.FIRST_FEE;
        data["last_fee"] = process.env.LAST_FEE;
        // console.log(data)
        data["first_at"] = new Date(data.first_at).toLocaleString(undefined, {year:"numeric", month:"short", day:"numeric", hour:"numeric", minute:"numeric"})
        const source = await get_template("Confirm-Payment.html");
        const template = Handlebars.compile(source);
        const htmlContent = template({order:data});
        transporter.sendMail({
            from: '"Savorelle Restaurant" <noreply@savorelle.com>',
            to:data.customer_email,
            subject:"Payment Confirmed.",
            html:htmlContent
        });
        return true;
    } catch(error) {
        console.error("Error while sending confirm payment email:",error.message);
    };
};

export const payRestEmail = async (data) => {
    try {
        data["first_at"] = new Date(data.first_at).toLocaleString(undefined, {year:"numeric", month:"short", day:"numeric", hour:"numeric", minute:"numeric"});
        const source = await get_template("Pay-Rest.html");
        const template = Handlebars.compile(source);
        const url = process.env.FRONTEND+`/pay-rest?order-id=${data.id}`;
        const htmlContent = template({order:data, payment_link:url});
        console.log(data)
        transporter.sendMail({
            from: '"Savorelle Restaurant" <noreply@savorelle.com>',
            to:data.customer_email,
            subject: "Payment Needed.",
            html:htmlContent
        });
        return true;
    } catch(error) {
        console.error("Error while sending pay rest payment email:",error.message);
    };
};