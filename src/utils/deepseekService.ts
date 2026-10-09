import { ParsedAITransaction, TransactionCategory, TransactionType } from '../types';
import { sanitizeAIPrompt } from './security';
import { parsePersianAmount, autoCategorize, generateFinancialAdvice } from './aiParser';

/**
 * DeepSeek AI API Integration Service
 * Powered by DeepSeek Chat completions API (OpenAI-compatible endpoint)
 * STRICT PRIVACY & UI RULE: The name "DeepSeek" is never exposed in user-facing UI.
 */

const DEEPSEEK_API_URL = 'https://api.deepseek.com/chat/completions';

/**
 * Retrieves the DeepSeek API Key from environment variables if present
 */
export function getDeepSeekApiKey(): string {
  // Check for client-side or server-side env variables
  const key =
    (typeof process !== 'undefined' && process.env?.DEEPSEEK_API_KEY) ||
    (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_DEEPSEEK_API_KEY) ||
    (typeof import.meta !== 'undefined' && (import.meta as any).env?.DEEPSEEK_API_KEY) ||
    '';
  return key ? key.trim() : '';
}

/**
 * Checks whether DeepSeek API is configured
 */
export function isDeepSeekConfigured(): boolean {
  return Boolean(getDeepSeekApiKey());
}

/**
 * System prompt instructing DeepSeek to act strictly as the financial parser
 */
const SYSTEM_PARSER_PROMPT = `شما موتور هوش مصنوعی پردازش تراکنش مالی سامانه «چندبوم» (Chandboom) هستید.
وظیفه شما تبدیل جملات و متن‌های فارسی کاربر به یک ساختار JSON تمیز برای ثبت تراکنش است.
دسته‌بندی‌های مجاز:
['خوراک و غذا', 'خرید و پوشاک', 'حمل و نقل', 'مسکن و قبوض', 'سلامت و درمان', 'آموزش و یادگیری', 'تفریح و سرگرمی', 'سرمایه‌گذاری', 'حقوق و دستمزد', 'سایر']

فرمت خروجی صرفاً یک آبجکت JSON معتبر بدون هیچ توضیح اضافی با فیلدهای زیر باشد:
{
  "type": "expense" یا "income",
  "amount": عدد به تومان (عدد صحیح),
  "category": یکی از دسته‌بندی‌های مجاز بالا,
  "description": شرح مختصر فارسی تراکنش
}`;

/**
 * Parses a financial input text using DeepSeek Chat API
 * Falls back gracefully to local Persian NLP parser if offline or key is not provided.
 */
export async function parseTransactionWithDeepSeek(input: string): Promise<ParsedAITransaction> {
  const { safePrompt } = sanitizeAIPrompt(input);
  const apiKey = getDeepSeekApiKey();

  if (apiKey) {
    try {
      const response = await fetch(DEEPSEEK_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [
            { role: 'system', content: SYSTEM_PARSER_PROMPT },
            { role: 'user', content: safePrompt },
          ],
          temperature: 0.1,
          response_format: { type: 'json_object' },
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const content = data.choices?.[0]?.message?.content;
        if (content) {
          const parsed = JSON.parse(content);
          if (parsed && typeof parsed.amount === 'number') {
            return {
              type: (parsed.type as TransactionType) || 'expense',
              amount: parsed.amount,
              category: (parsed.category as TransactionCategory) || autoCategorize(safePrompt),
              date: new Date().toISOString(),
              description: parsed.description || safePrompt,
              confidence: 0.98,
            };
          }
        }
      }
    } catch (error) {
      console.warn('DeepSeek API call fallback to local parser:', error);
    }
  }

  // Robust offline local parser fallback
  const localParsed = parsePersianAmount(safePrompt);
  const lower = safePrompt.toLowerCase();
  let type: TransactionType = 'expense';
  if (
    lower.includes('حقوق') ||
    lower.includes('واریز') ||
    lower.includes('دریافت') ||
    lower.includes('پاداش') ||
    lower.includes('سود') ||
    lower.includes('درآمد')
  ) {
    type = 'income';
  }

  return {
    type,
    amount: localParsed,
    category: autoCategorize(safePrompt),
    date: new Date().toISOString(),
    description: safePrompt.length > 50 ? safePrompt.substring(0, 50) + '...' : safePrompt,
    confidence: localParsed > 0 ? 0.95 : 0.5,
  };
}

/**
 * Generates financial advice & budgeting projections using DeepSeek
 */
export async function generateDeepSeekAdvice(
  userQuery: string,
  metrics: { totalIncome: number; totalExpense: number; balance: number },
  monthlyCap: number,
  demographics?: { age?: number; gender?: string; fullName?: string }
): Promise<string> {
  const { safePrompt } = sanitizeAIPrompt(userQuery);
  const apiKey = getDeepSeekApiKey();

  if (apiKey) {
    try {
      const demographicInfo = demographics
        ? `\nاطلاعات هویتی کاربر: نام: ${demographics.fullName || 'کاربر'} | سن: ${
            demographics.age ? demographics.age + ' سال' : 'مشخص‌نشده'
          } | جنسیت: ${demographics.gender || 'مشخص‌نشده'}`
        : '';

      const promptContext = `وضعیت مالی کاربر:${demographicInfo}
- مجموع درآمد ماه: ${metrics.totalIncome.toLocaleString('fa-IR')} تومان
- مجموع هزینه‌ها: ${metrics.totalExpense.toLocaleString('fa-IR')} تومان
- تراز موجودی: ${metrics.balance.toLocaleString('fa-IR')} تومان
- سقف بودجه مصوب: ${monthlyCap.toLocaleString('fa-IR')} تومان

سوال کاربر: ${safePrompt}`;

      const response = await fetch(DEEPSEEK_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [
            {
              role: 'system',
              content:
                'شما دستیار هوش مصنوعی سامانه مدیریت مالی «چندبوم» (Chandboom) هستید. توصیه‌های اختصاصی، دقیق، دلسوزانه و متناسب با سن و رده سنی کاربر حداکثر در ۳ تا ۴ بند فارسی درباره مدیریت پس‌انداز و بودجه ارائه دهید.',
            },
            { role: 'user', content: promptContext },
          ],
          temperature: 0.4,
          max_tokens: 800,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const reply = data.choices?.[0]?.message?.content;
        if (reply) {
          return reply.trim();
        }
      }
    } catch (err) {
      console.warn('DeepSeek advice error, using local advisor:', err);
    }
  }

  // Local Persian Financial rule-based generator
  return generateFinancialAdvice(safePrompt, metrics, monthlyCap).text;
}
