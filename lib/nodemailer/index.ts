import nodemailer from 'nodemailer';
import {WELCOME_EMAIL_TEMPLATE,NEWS_SUMMARY_EMAIL_TEMPLATE, STOCK_ALERT_UPPER_EMAIL_TEMPLATE, STOCK_ALERT_LOWER_EMAIL_TEMPLATE} from "@/lib/nodemailer/templates";

export const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.NODEMAILER_EMAIL!,
        pass: process.env.NODEMAILER_PASSWORD!,
    }
})

export const sendWelcomeEmail = async ({ email, name, intro }: WelcomeEmailData) => {
    const htmlTemplate = WELCOME_EMAIL_TEMPLATE
        .replace('{{name}}', name)
        .replace('{{intro}}', intro);

    const mailOptions = {
        from: `"Marketinni" <${process.env.NODEMAILER_EMAIL}>`,
        to: email,
        subject: `Welcome to Marketinni - your stock market toolkit is ready!`,
        text: 'Thanks for joining Marketinni',
        html: htmlTemplate,
    }

    await transporter.sendMail(mailOptions);
}

export const sendNewsSummaryEmail = async (
    { email, date, newsContent }: { email: string; date: string; newsContent: string }
): Promise<void> => {
    const htmlTemplate = NEWS_SUMMARY_EMAIL_TEMPLATE
        .replace('{{date}}', date)
        .replace('{{newsContent}}', newsContent);

    const mailOptions = {
        from: `"marketinni News" <${process.env.NODEMAILER_EMAIL}>`,
        to: email,
        subject: `📈 Market News Summary Today - ${date}`,
        text: `Today's market news summary from marketinni`,
        html: htmlTemplate,
    };

    await transporter.sendMail(mailOptions);
};

export const sendPriceAlertEmail = async ({
    email,
    symbol,
    company,
    currentPrice,
    targetPrice,
    alertType,
    timestamp
}: {
    email: string;
    symbol: string;
    company: string;
    currentPrice: string;
    targetPrice: string;
    alertType: 'upper' | 'lower';
    timestamp: string;
}): Promise<void> => {
    const template = alertType === 'upper' ? STOCK_ALERT_UPPER_EMAIL_TEMPLATE : STOCK_ALERT_LOWER_EMAIL_TEMPLATE;
    
    const htmlTemplate = template
        .replace(/{{symbol}}/g, symbol)
        .replace(/{{company}}/g, company)
        .replace(/{{currentPrice}}/g, currentPrice)
        .replace(/{{targetPrice}}/g, targetPrice)
        .replace(/{{timestamp}}/g, timestamp);

    const mailOptions = {
        from: `"Marketinni Alerts" <${process.env.NODEMAILER_EMAIL}>`,
        to: email,
        subject: alertType === 'upper' 
            ? `🚀 ${symbol} Hit Your Price Target! - $${currentPrice}`
            : `📉 ${symbol} Dropped to Your Target - $${currentPrice}`,
        text: `Price alert for ${symbol}: Current price is ${currentPrice}, your target was ${targetPrice}`,
        html: htmlTemplate,
    };

    await transporter.sendMail(mailOptions);
};
