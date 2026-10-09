import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Configuration keys from environment or custom runtime settings (بدون مسیر اضافی /rest/v1)
const DEFAULT_SUPABASE_URL = 'https://yqmhtfuwnnlzenqrhyxm.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 
  ((import.meta as any).env?.VITE_SUPABASE_ANON_KEY as string) ||
  'sb_publishable_IJT6kGn76dNThqX2iXgwzg_OzkEtuLT';

let supabaseInstance: SupabaseClient | null = null;

export function cleanSupabaseUrl(rawUrl: string): string {
  if (!rawUrl) return '';
  let cleaned = rawUrl.trim();
  // Remove accidental subpaths like /rest/v1, /auth/v1, /v1, and trailing slashes
  cleaned = cleaned.replace(/\/(auth|rest|storage|functions|graphql|v1)(\/.*)?$/i, '');
  cleaned = cleaned.replace(/\/+$/, '');
  if (cleaned && !cleaned.startsWith('http://') && !cleaned.startsWith('https://')) {
    cleaned = 'https://' + cleaned;
  }
  return cleaned;
}

export function getSupabaseConfig(): { url: string; anonKey: string; isConfigured: boolean } {
  try {
    const savedConfig = localStorage.getItem('kefyar_supabase_config');
    if (savedConfig) {
      const parsed = JSON.parse(savedConfig);
      if (parsed.url && parsed.anonKey) {
        const cleanUrl = cleanSupabaseUrl(parsed.url);
        return { url: cleanUrl, anonKey: parsed.anonKey.trim(), isConfigured: true };
      }
    }
  } catch (e) {
    console.warn('Error reading saved Supabase config:', e);
  }

  const cleanDefaultUrl = cleanSupabaseUrl(DEFAULT_SUPABASE_URL);
  const isConfigured = Boolean(
    cleanDefaultUrl &&
    DEFAULT_SUPABASE_ANON_KEY &&
    !cleanDefaultUrl.includes('your-project')
  );

  return {
    url: cleanDefaultUrl,
    anonKey: DEFAULT_SUPABASE_ANON_KEY.trim(),
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
    const cleanUrl = cleanSupabaseUrl(url);
    localStorage.setItem('kefyar_supabase_config', JSON.stringify({ url: cleanUrl, anonKey: anonKey.trim() }));
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
      supabaseInstance = createClient(config.url, config.anonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
      });
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
    const config = getSupabaseConfig();
    const testUrl = url ? cleanSupabaseUrl(url) : config.url;
    const testKey = anonKey || config.anonKey;

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