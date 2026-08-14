// List of authorized administrator emails for WalletYar support management
export const ADMIN_EMAILS: string[] = [
  'seyedmahanhejrati@gmail.com',
  'admin@walletyar.ir',
  'support@walletyar.ir',
  'admin@gmail.com',
];

export function isUserAdmin(email?: string | null): boolean {
  if (!email) return false;
  const cleanEmail = email.trim().toLowerCase();

  // Check predefined admin list
  if (ADMIN_EMAILS.some((admin) => admin.toLowerCase() === cleanEmail)) {
    return true;
  }

  // Check dynamically configured admin emails in localStorage
  try {
    const saved = localStorage.getItem('walletyar_admin_whitelist');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.some((e: string) => e.trim().toLowerCase() === cleanEmail)) {
        return true;
      }
    }
  } catch {
    // Ignore JSON errors
  }

  return false;
}
