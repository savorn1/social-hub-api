import { registerAs } from '@nestjs/config';

export default registerAs('integrations', () => ({
  facebook: {
    appId: process.env.FB_APP_ID,
    appSecret: process.env.FB_APP_SECRET,
    verifyToken: process.env.FB_VERIFY_TOKEN,
    webhookUrl: process.env.FB_WEBHOOK_URL,
    graphApiUrl:
      process.env.FB_GRAPH_API_URL || 'https://graph.facebook.com/v25.0',
  },
  telegram: {
    botToken: process.env.TELEGRAM_BOT_TOKEN,
    webhookUrl: process.env.TELEGRAM_WEBHOOK_URL,
    secretToken: process.env.TELEGRAM_SECRET_TOKEN,
  },
  whatsapp: {
    verifyToken: process.env.WA_VERIFY_TOKEN,
  },
  openai: {
    apiKey: process.env.OPENAI_API_KEY,
    model: process.env.OPENAI_MODEL || 'gpt-4o',
  },
}));
