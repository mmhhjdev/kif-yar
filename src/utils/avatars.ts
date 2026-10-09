/**
 * Clean vector avatars (Male & Female) designed for Kefyar
 * Encoded as optimized SVG Data URIs for maximum reliability and offline support
 */

export const MALE_AVATAR_SVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" fill="none"><rect width="120" height="120" rx="60" fill="%23E2EBE5"/><circle cx="60" cy="45" r="22" fill="%232D3748"/><path d="M42 42C42 32.0589 50.0589 24 60 24C69.9411 24 78 32.0589 78 42C78 44 76 45 74 42C72 38 66 32 60 32C54 32 48 38 46 42C44 45 42 44 42 42Z" fill="%231A202C"/><path d="M26 104C26 86.3269 40.3269 72 58 72H62C79.6731 72 94 86.3269 94 104V120H26V104Z" fill="%2315803D"/><path d="M50 72L60 86L70 72V80L60 94L50 80V72Z" fill="%23FFFFFF" opacity="0.9"/></svg>`;

export const FEMALE_AVATAR_SVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" fill="none"><rect width="120" height="120" rx="60" fill="%23EBF3EE"/><path d="M36 46C36 30 46 22 60 22C74 22 84 30 84 46C84 64 78 74 78 74C78 74 72 58 70 54C68 50 64 48 60 48C56 48 52 50 50 54C48 58 42 74 42 74C42 74 36 64 36 46Z" fill="%231A202C"/><circle cx="60" cy="48" r="19" fill="%23374151"/><path d="M28 106C28 89 42 76 58 76H62C78 76 92 89 92 106V120H28V106Z" fill="%23166534"/><path d="M52 76C52 82 56 86 60 86C64 86 68 82 68 76H52Z" fill="%23FFFFFF" opacity="0.9"/></svg>`;

export const DEFAULT_AVATARS = [
  {
    id: 'male',
    label: 'آواتار مرد',
    gender: 'مرد',
    url: MALE_AVATAR_SVG,
  },
  {
    id: 'female',
    label: 'آواتار زن',
    gender: 'زن',
    url: FEMALE_AVATAR_SVG,
  },
];
