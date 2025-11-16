import { inngest} from "@/lib/inngest/client";
import { NEWS_SUMMARY_EMAIL_PROMPT, PERSONALIZED_WELCOME_EMAIL_PROMPT} from "@/lib/inngest/prompts";
import { sendNewsSummaryEmail, sendWelcomeEmail, sendPriceAlertEmail } from "@/lib/nodemailer";
import { getAllUsersForNewsEmail } from "@/lib/actions/user.actions";
import { getWatchlistSymbolsByEmail } from "@/lib/actions/watchlist.actions";
import { getNews } from "@/lib/actions/finnhub.actions";
import { formatDateToday} from "@/lib/utils";
import { connectToDb } from "@/database/mongoose";
import { Alert } from "@/database/models/alert.model";
import { getQuotes } from "@/lib/actions/finnhub.actions";

export const sendSignUpEmail = inngest.createFunction(
    { id: 'sign-up-email' },
    { event: 'app/user.created'},
    async ({ event, step }) => {
        const userProfile = `
            - Country: ${event.data.country}
            - Investment goals: ${event.data.investmentGoals}
            - Risk tolerance: ${event.data.riskTolerance}
            - Preferred industry: ${event.data.preferredIndustry}
        `

        const prompt = PERSONALIZED_WELCOME_EMAIL_PROMPT.replace('{{userProfile}}', userProfile)

        const response = await step.ai.infer('generate-welcome-intro', {
            model: step.ai.models.gemini({ model: 'gemini-2.5-flash-lite' }),
            body: {
                contents: [
                    {
                        role: 'user',
                        parts: [
                            { text: prompt }
                        ]
                    }]
            }
        })

        await step.run('send-welcome-email', async () => {
            const part = response.candidates?.[0]?.content?.parts?.[0];
            const introText = (part && 'text' in part ? part.text : null) ||'Thanks for joining marketinni. You now have the tools to track markets and make smarter moves.'

            const { data: { email, name } } = event;

            return await sendWelcomeEmail({ email, name, intro: introText });
        })

        return {
            success: true,
            message: 'Welcome email sent successfully'
        }
    })


export const sendDailyNewsSummary = inngest.createFunction(
    { id: 'daily-news-summary' },
    [ { event: 'app/send.daily.news' }, { cron: '0 12 * * *' } ],
    async ({ step }) => {

        const users = await step.run('get-all-users', getAllUsersForNewsEmail)

        if(!users || users.length === 0) return { success: false, message: 'No users found for news email' };


        const results = await step.run('fetch-user-news', async () => {
            const perUser: Array<{ user: UserForNewsEmail; articles: MarketNewsArticle[] }> = [];
            for (const user of users as UserForNewsEmail[]) {
                try {
                    const symbols = await getWatchlistSymbolsByEmail(user.email);
                    let articles = await getNews(symbols);

                    articles = (articles || []).slice(0, 6);

                    if (!articles || articles.length === 0) {
                        articles = await getNews();
                        articles = (articles || []).slice(0, 6);
                    }
                    perUser.push({ user, articles });
                } catch (e) {
                    console.error('daily-news: error preparing user news', user.email, e);
                    perUser.push({ user, articles: [] });
                }
            }
            return perUser;
        });

        // Step #3: (placeholder) Summarize news via AI
        const userNewsSummaries: { user: User; newsContent: string | null}[] = [];

        for (const { user, articles } of results) {
            try {
                const prompt = NEWS_SUMMARY_EMAIL_PROMPT.replace('{{newsData}}', JSON.stringify(articles, null, 2));

                const response = await step.ai.infer(`summarize-news-${user.email}`, {
                    model: step.ai.models.gemini({ model: 'gemini-2.5-flash-lite' }),
                    body: {
                        contents: [{ role: 'user', parts: [{ text:prompt }]}]
                    }
                });

                const part = response.candidates?.[0]?.content?.parts?.[0];
                const newsContent = (part && 'text' in part ? part.text : null) || 'No market news.'
                userNewsSummaries.push({ user, newsContent });

            } catch (e) {
                console.error('Failed to summarize news for : ', user.email,e);
                userNewsSummaries.push({ user, newsContent: null });
            }
        }

        // Step #4: (placeholder) Send the emails
        await step.run('send-news-emails', async () => {
            await Promise.all(
                userNewsSummaries.map(async ({ user, newsContent}) => {
                    if(!newsContent) return false;

                    return await sendNewsSummaryEmail({ email: user.email, date: formatDateToday, newsContent })
                })
            )
        })

        return { success: true, message: 'Daily news summary emails sent successfully' }
    }
)

export const checkPriceAlerts = inngest.createFunction(
    { id: 'check-price-alerts' },
    [ { event: 'app/check.price.alerts' }, { cron: '*/15 * * * *' } ], // Every 15 minutes
    async ({ step }) => {
        
        await step.run('connect-to-database', async () => {
            await connectToDb();
        });

        // Get all active alerts
        const alerts = await step.run('get-active-alerts', async () => {
            return await Alert.find({ active: true }).lean();
        });

        if (!alerts || alerts.length === 0) {
            return { success: true, message: 'No active alerts to check' };
        }

        // Group alerts by symbol to minimize API calls
        const symbolsToCheck = Array.from(new Set(alerts.map(a => a.symbol)));
        
        // Fetch current prices for all symbols
        const quotes = await step.run('fetch-current-prices', async () => {
            return await getQuotes(symbolsToCheck);
        });

        // Check each alert
        const triggeredAlerts: Array<{ alert: any; currentPrice: number; userEmail: string }> = [];
        
        for (const alert of alerts) {
            const quote = quotes[alert.symbol];
            if (!quote || !quote.price) continue;

            // Extract numeric price
            const priceMatch = quote.price.match(/[\d.]+/);
            if (!priceMatch) continue;
            
            const currentPrice = parseFloat(priceMatch[0]);
            if (!isFinite(currentPrice)) continue;

            // Check if alert should be triggered
            let shouldTrigger = false;
            switch (alert.operator) {
                case '>':
                    shouldTrigger = currentPrice > alert.threshold;
                    break;
                case '<':
                    shouldTrigger = currentPrice < alert.threshold;
                    break;
                case '>=':
                    shouldTrigger = currentPrice >= alert.threshold;
                    break;
                case '<=':
                    shouldTrigger = currentPrice <= alert.threshold;
                    break;
                case '==':
                    shouldTrigger = Math.abs(currentPrice - alert.threshold) < 0.01;
                    break;
            }

            // Check if alert was triggered recently (avoid spam)
            const now = new Date();
            const lastTriggered = alert.lastTriggeredAt ? new Date(alert.lastTriggeredAt) : null;
            const hoursSinceLastTrigger = lastTriggered 
                ? (now.getTime() - lastTriggered.getTime()) / (1000 * 60 * 60)
                : Infinity;

            // Only trigger if conditions met and not triggered in last 4 hours
            if (shouldTrigger && hoursSinceLastTrigger > 4) {
                // Get user email from userId
                const mongoose = await connectToDb();
                const db = mongoose.connection.db;
                if (!db) continue;

                const user = await db.collection('user').findOne<{ _id?: unknown; id?: string; email?: string }>({ 
                    $or: [{ id: alert.userId }, { _id: alert.userId }]
                });
                
                if (user && user.email) {
                    triggeredAlerts.push({ 
                        alert, 
                        currentPrice,
                        userEmail: user.email 
                    });

                    // Update lastTriggeredAt
                    await Alert.updateOne(
                        { _id: alert._id },
                        { $set: { lastTriggeredAt: now } }
                    );
                }
            }
        }

        // Send alert emails
        if (triggeredAlerts.length > 0) {
            await step.run('send-alert-emails', async () => {
                await Promise.all(
                    triggeredAlerts.map(async ({ alert, currentPrice, userEmail }) => {
                        const alertType: 'upper' | 'lower' = (alert.operator === '>' || alert.operator === '>=') ? 'upper' : 'lower';
                        
                        try {
                            await sendPriceAlertEmail({
                                email: userEmail,
                                symbol: alert.symbol,
                                company: alert.symbol, // TODO: fetch company name
                                currentPrice: `$${currentPrice.toFixed(2)}`,
                                targetPrice: `$${alert.threshold.toFixed(2)}`,
                                alertType,
                                timestamp: new Date().toLocaleString('en-US', { 
                                    month: 'short', 
                                    day: 'numeric', 
                                    year: 'numeric',
                                    hour: 'numeric',
                                    minute: '2-digit',
                                    hour12: true
                                })
                            });
                        } catch (e) {
                            console.error('Failed to send alert email for', alert.symbol, e);
                        }
                    })
                );
            });
        }

        return { 
            success: true, 
            message: `Checked ${alerts.length} alerts, triggered ${triggeredAlerts.length} notifications`,
            alertsChecked: alerts.length,
            alertsTriggered: triggeredAlerts.length
        };
    }
)