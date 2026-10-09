/**
 * Dedicated Controlled Local Caching for AI Chats & Analyses Only
 * 
 * Strict Policy Exception:
 * While sensitive user data, auth tokens, and session states must NEVER touch localStorage,
 * this module provides a structured local caching mechanism exclusively for:
 * 1. AI chat histories (Floating assistant and Dashboard chat)
 * 2. Automated lightweight financial health check summaries
 * 3. DeepSeek insights and financial goals feasibility projections
 * 
 * Security Guard:
 * Strictly forbids storing auth tokens, passwords, session objects, or financial credentials.
 */

export interface CachedChatMessage {
  id: string;
  sender: 'assistant' | 'user';
  text: string;
  time: string;
}

export interface CachedFinancialHealthCheck {
  score: number; // 0-100
  status: 'عالی' | 'مناسب' | 'نیازمند توجه' | 'بحرانی';
  summary: string;
  recommendations: string[];
  budgetUsageAdvice: string;
  savingsRate: number;
  generatedAt: string;
}

export interface CachedGoalFeasibility {
  score: number;
  statusText: string;
  requiredMonthly: number;
  projectedMonths: number;
  advice: string;
  analyzedAt: string;
}

const AI_CHAT_KEY = 'chandboom_ai_chat_history';
const DASHBOARD_CHAT_KEY = 'chandboom_ai_dashboard_chat';
const HEALTH_CHECK_KEY = 'chandboom_ai_health_check';
const GOALS_INSIGHTS_KEY = 'chandboom_ai_goals_feasibility';

// Security sanitation check to ensure zero sensitive auth data enters localStorage
function assertNoSensitiveData(dataStr: string): boolean {
  const lower = dataStr.toLowerCase();
  const forbiddenKeywords = ['access_token', 'refresh_token', 'sb-', 'auth.token', 'password', 'card_number', 'cvv2', 'private_key'];
  for (const kw of forbiddenKeywords) {
    if (lower.includes(kw)) {
      console.warn(`[AI Cache Guard] Blocked attempt to store sensitive keyword: ${kw}`);
      return false;
    }
  }
  return true;
}

// 1. Floating AI Assistant Chat History
export function getCachedAIChat(): CachedChatMessage[] | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(AI_CHAT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
  } catch (err) {
    console.warn('[AI Cache] Failed to read AI chat cache:', err);
  }
  return null;
}

export function setCachedAIChat(messages: CachedChatMessage[]): void {
  if (typeof window === 'undefined') return;
  try {
    const serialized = JSON.stringify(messages.slice(-50)); // keep last 50 messages
    if (assertNoSensitiveData(serialized)) {
      window.localStorage.setItem(AI_CHAT_KEY, serialized);
    }
  } catch (err) {
    console.warn('[AI Cache] Failed to write AI chat cache:', err);
  }
}

export function clearCachedAIChat(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(AI_CHAT_KEY);
  } catch {}
}

// 2. Dashboard AI Chat History
export function getCachedDashboardChat(): CachedChatMessage[] | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(DASHBOARD_CHAT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
  } catch (err) {
    console.warn('[AI Cache] Failed to read dashboard chat cache:', err);
  }
  return null;
}

export function setCachedDashboardChat(messages: CachedChatMessage[]): void {
  if (typeof window === 'undefined') return;
  try {
    const serialized = JSON.stringify(messages.slice(-30));
    if (assertNoSensitiveData(serialized)) {
      window.localStorage.setItem(DASHBOARD_CHAT_KEY, serialized);
    }
  } catch (err) {
    console.warn('[AI Cache] Failed to write dashboard chat cache:', err);
  }
}

// 3. Automated Lightweight Financial Health Check Summary
export function getCachedFinancialHealthCheck(): CachedFinancialHealthCheck | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(HEALTH_CHECK_KEY);
    if (!raw) return null;
    const parsed: CachedFinancialHealthCheck = JSON.parse(raw);
    // Invalidate if older than 24 hours
    if (parsed.generatedAt) {
      const ageHours = (Date.now() - new Date(parsed.generatedAt).getTime()) / (1000 * 60 * 60);
      if (ageHours > 24) {
        window.localStorage.removeItem(HEALTH_CHECK_KEY);
        return null;
      }
    }
    return parsed;
  } catch (err) {
    console.warn('[AI Cache] Failed to read health check cache:', err);
  }
  return null;
}

export function setCachedFinancialHealthCheck(check: CachedFinancialHealthCheck): void {
  if (typeof window === 'undefined') return;
  try {
    const serialized = JSON.stringify(check);
    if (assertNoSensitiveData(serialized)) {
      window.localStorage.setItem(HEALTH_CHECK_KEY, serialized);
    }
  } catch (err) {
    console.warn('[AI Cache] Failed to write health check cache:', err);
  }
}

// 4. DeepSeek Financial Goals Feasibility Projections
export function getCachedGoalInsights(): Record<string, CachedGoalFeasibility> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(GOALS_INSIGHTS_KEY);
    if (!raw) return {};
    return JSON.parse(raw) || {};
  } catch (err) {
    console.warn('[AI Cache] Failed to read goals insights cache:', err);
  }
  return {};
}

export function setCachedGoalInsight(goalId: string, insight: CachedGoalFeasibility): void {
  if (typeof window === 'undefined') return;
  try {
    const current = getCachedGoalInsights();
    current[goalId] = insight;
    const serialized = JSON.stringify(current);
    if (assertNoSensitiveData(serialized)) {
      window.localStorage.setItem(GOALS_INSIGHTS_KEY, serialized);
    }
  } catch (err) {
    console.warn('[AI Cache] Failed to write goals insight cache:', err);
  }
}

export function clearAllAICaches(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(AI_CHAT_KEY);
    window.localStorage.removeItem(DASHBOARD_CHAT_KEY);
    window.localStorage.removeItem(HEALTH_CHECK_KEY);
    window.localStorage.removeItem(GOALS_INSIGHTS_KEY);
  } catch {}
}
