import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Initialize Gemini AI Client
  const getAiClient = () => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn('GEMINI_API_KEY is not defined in environment variables.');
    }
    return new GoogleGenAI({
      apiKey: apiKey || '',
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  };

  // Health check endpoint
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', app: 'WealthYar' });
  });

  // AI Financial Analysis API
  app.post('/api/ai/analyze', async (req, res) => {
    try {
      const { totalIncome, totalExpense, balance, savingsGoal, categoryBreakdown, topExpenses, goalProgress } = req.body;

      const ai = getAiClient();
      const prompt = `
شما "مشاور ارشد مالی ولتیار (WealthYar)" هستید.
اطلاعات وضعیت مالی فعلی کاربر به شرح زیر است:
- مجموع درآمد ماهانه: ${Number(totalIncome || 0).toLocaleString('fa-IR')} تومان
- مجموع هزینه ماهانه: ${Number(totalExpense || 0).toLocaleString('fa-IR')} تومان
- خالص دارایی / مانده حساب: ${Number(balance || 0).toLocaleString('fa-IR')} تومان
- هدف پس‌انداز ماهانه: ${Number(savingsGoal || 0).toLocaleString('fa-IR')} تومان
- درصد تحقق هدف پس‌انداز: %${Math.min(Math.round(goalProgress || 0), 100)}
- تفکیک هزینه‌ها بر اساس دسته‌بندی: ${JSON.stringify(categoryBreakdown || {})}
- پرخرج‌ترین تراکنش‌ها: ${JSON.stringify(topExpenses || [])}

لطفا یک تحلیل جامع، دقیق و کاربردی به زبان فارسی شیوا و محترمانه با ساختار زیر ارائه دهید:
1. **خلاصه وضعیت مالی:** ارزیابی کلی نسبت درآمد به هزینه و سلامت مالی.
2. **شناسایی ریسک و هزینه‌های پرخطر:** تحلیل دسته‌بندی‌هایی که بیشترین سهم از درآمد را بلعیده‌اند و هشدار مدیریت ریسک.
3. **ارزیابی هدف پس‌انداز:** راهکارهای عملی برای پر کردن فاصله باقی‌مانده تا هدف پس‌انداز.
4. **توصیه بودجه‌بندی (قانون ۵۰/۳۰/۲۰):** پیشنهاد تقسیم‌بندی درست درآمد این ماه به نیازمندی‌ها (۵۰٪)، خواسته‌ها (۳۰٪) و پس‌انداز/سرمایه‌گذاری (۲۰٪).
5. **۳ پیشنهاد هوشمند و فوری:** اقدامات سریع و ملموسی که کاربر همین امروز می‌تواند انجام دهد.
`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: prompt,
        config: {
          systemInstruction: 'شما مشاور ارشد فین‌تک و مدیریت دارایی ولتیار هستید. لحن شما حرفه‌ای، مشوق، ملموس و کاملا دقیق است. تمام اعداد را با جداکننده و به فارسی یا با دقت مالی ارائه کنید.',
        },
      });

      res.json({ success: true, analysis: response.text || 'تحلیل تولید نشد.' });
    } catch (error: any) {
      console.error('Error generating AI analysis:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'خطا در برقراری ارتباط با هوش مصنوعی ولتیار',
      });
    }
  });

  // AI Chat Assistant API
  app.post('/api/ai/chat', async (req, res) => {
    try {
      const { messages, financialContext } = req.body;

      const ai = getAiClient();

      const contextSummary = financialContext
        ? `
اطلاعات مالی واقعی کاربر ولتیار:
- درآمد ماهانه: ${Number(financialContext.totalIncome || 0).toLocaleString('fa-IR')} تومان
- هزینه ماهانه: ${Number(financialContext.totalExpense || 0).toLocaleString('fa-IR')} تومان
- دارایی فعلی: ${Number(financialContext.balance || 0).toLocaleString('fa-IR')} تومان
- هدف پس‌انداز: ${Number(financialContext.savingsGoal || 0).toLocaleString('fa-IR')} تومان
`
        : '';

      const formattedHistory = (messages || []).map((m: { role: string; content: string }) => `${m.role === 'user' ? 'کاربر' : 'مشاور ولتیار'}: ${m.content}`).join('\n\n');

      const fullPrompt = `${contextSummary}\n\nتاریخچه گفتگو:\n${formattedHistory}\n\nپاسخ بعدی مشاور مالی ولتیار:`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: fullPrompt,
        config: {
          systemInstruction: 'شما دستیار و مشاور مالی هوشمند ولتیار (WealthYar) هستید. به سوالات کاربر دقیق، ملموس و به زبان فارسی شیوا پاسخ دهید. اگر کاربر سوالی درباره بودجه‌بندی، کاهش هزینه، سرمایه‌گذاری یا مدیریت پس‌انداز پرسید، از داده‌های واقعی حساب او استفاده کنید و راهکار عالی بدهید.',
        },
      });

      res.json({ success: true, reply: response.text || 'پاسخی دریافت نشد.' });
    } catch (error: any) {
      console.error('Error in AI Chat endpoint:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'خطا در پردازش هوش مصنوعی',
      });
    }
  });

  // Vite middleware setup for Development & Static server for Production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`WealthYar Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
