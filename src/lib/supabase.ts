import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Configuration keys from environment or custom runtime settings
const DEFAULT_SUPABASE_URL = ((import.meta as any).env?.VITE_SUPABASE_URL as string) || '';
const DEFAULT_SUPABASE_ANON_KEY = ((import.meta as any).env?.VITE_SUPABASE_ANON_KEY as string) || '';

let supabaseInstance: SupabaseClient | null = null;

export function getSupabaseConfig(): { url: string; anonKey: string; isConfigured: boolean } {
  try {
    const savedConfig = localStorage.getItem('kefyar_supabase_config');
    if (savedConfig) {
      const parsed = JSON.parse(savedConfig);
      if (parsed.url && parsed.anonKey) {
        return { url: parsed.url, anonKey: parsed.anonKey, isConfigured: true };
      }
    }
  } catch (e) {
    console.warn('Error reading saved Supabase config:', e);
  }

  const isConfigured = Boolean(
    DEFAULT_SUPABASE_URL &&
    DEFAULT_SUPABASE_ANON_KEY &&
    !DEFAULT_SUPABASE_URL.includes('your-project')
  );

  return {
    url: DEFAULT_SUPABASE_URL,
    anonKey: DEFAULT_SUPABASE_ANON_KEY,
    isConfigured,
  };
}

export function saveSupabaseConfig(url: string, anonKey: string): boolean {
  try {
    if (!url || !anonKey) {
      localStorage.removeItem('kefyar_supabase_config');
      supabaseInstance = null;
      return true;
    }
    localStorage.setItem('kefyar_supabase_config', JSON.stringify({ url: url.trim(), anonKey: anonKey.trim() }));
    supabaseInstance = null; // reset to re-init
    return true;
  } catch (e) {
    console.error('Failed to save Supabase config', e);
    return false;
  }
}

export function getSupabaseClient(): SupabaseClient | null {
  const config = getSupabaseConfig();
  if (!config.isConfigured || !config.url || !config.anonKey) {
    return null;
  }

  if (!supabaseInstance) {
    try {
      supabaseInstance = createClient(config.url, config.anonKey);
    } catch (err) {
      console.error('Failed to instantiate Supabase client:', err);
      return null;
    }
  }

  return supabaseInstance;
}

/**
 * Tests connection to Supabase instance
 */
export async function testSupabaseConnection(url?: string, anonKey?: string): Promise<{ success: boolean; message: string }> {
  try {
    const testUrl = url || getSupabaseConfig().url;
    const testKey = anonKey || getSupabaseConfig().anonKey;

    if (!testUrl || !testKey || testUrl.includes('your-project')) {
      return {
        success: false,
        message: 'آدرس پروژه یا کلید عمومی (Anon Key) وارد نشده است.',
      };
    }

    const client = createClient(testUrl, testKey);
    const { data, error } = await client.from('users').select('count', { count: 'exact', head: true });

    if (error) {
      // If table doesn't exist yet, it's still connected to Supabase project
      if (error.code === '42P01' || error.message.includes('relation "public.users" does not exist')) {
        return {
          success: true,
          message: 'اتصال به پروژه سوپابیس با موفقیت برقرار شد (نیاز به اجرای اسکریپت ساخت جداول).',
        };
      }
      return {
        success: false,
        message: `خطای اتصال سوپابیس: ${error.message}`,
      };
    }

    return {
      success: true,
      message: 'اتصال به دیتابیس Supabase با موفقیت برقرار و تایید شد.',
    };
  } catch (e: any) {
    return {
      success: false,
      message: e.message || 'برقراری ارتباط با سوپابیس ناموفق بود.',
    };
  }
}
