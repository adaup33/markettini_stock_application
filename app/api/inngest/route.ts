import {serve} from "inngest/next";
import {inngest} from "@/lib/inngest/client";
import {sendSignUpEmail,sendDailyNewsSummary, checkPriceAlerts} from "@/lib/inngest/functions";

// Force Node.js runtime for Inngest functions that use nodemailer, MongoDB, and Gemini AI
export const runtime = 'nodejs';

export const { GET, POST, PUT } = serve({
    client: inngest,
    functions: [sendDailyNewsSummary,sendSignUpEmail, checkPriceAlerts],
})