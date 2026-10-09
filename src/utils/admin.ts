// The Admin Panel is exclusively accessible by the owner's Gmail
export const ADMIN_EMAILS: string[] = [
  'seyedmahanhejrati@gmail.com',
];

export function isAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  const clean = email.trim().toLowerCase();
  return ADMIN_EMAILS.includes(clean);
}

export function canAccessAdminPanel(userRole?: string, email?: string): boolean {
  // Strict enforcement: only whitelisted Gmail can access the Admin Panel
  return isAdminEmail(email);
}

