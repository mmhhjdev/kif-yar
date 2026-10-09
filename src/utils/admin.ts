/**
 * سامانه مدیریت دسترسی و اعتبارسنجی ادمین‌های کیفیار
 */

// لیست ایمیل‌های مجاز برای دسترسی به پنل مدیریت پشتیبان (Admin Support)
export const ADMIN_EMAILS: string[] = [
  'seyedmahanhejrati@gmail.com',
  'mahan.hejrati91@gmail.com',
];

/**
 * بررسی اینکه آیا ایمیل داده شده متعلق به ادمین/مدیر سامانه است یا خیر
 */
export function isAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  const cleanEmail = email.trim().toLowerCase();
  return ADMIN_EMAILS.some((adm) => adm.toLowerCase() === cleanEmail);
}
