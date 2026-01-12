// Admin Configuration
// These emails have unlimited access and full subscription

export const ADMIN_EMAILS = [
  'qadrieisa@gmail.com',
  'alsa.ai.assistant@gmail.com'
];

export const isAdminEmail = (email: string | undefined | null): boolean => {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.toLowerCase());
};

export const getAdminSubscription = () => ({
  tier: 'elite',
  isAdmin: true,
  expiresAt: null, // Never expires
  credits: Infinity,
  features: {
    fullStackCoding: true,
    osShell: true,
    adbControl: true,
    excelAutomation: true,
    databaseManagement: true,
    prioritySupport: true,
    unlimitedCredits: true
  }
});

// Check if user has active subscription (admin or paid)
export const hasActiveSubscription = (email: string | undefined | null, subscriptionTier?: string | null): boolean => {
  if (isAdminEmail(email)) return true;
  return subscriptionTier === 'pro' || subscriptionTier === 'elite';
};

// Get user's effective tier
export const getEffectiveTier = (email: string | undefined | null, subscriptionTier?: string | null): string => {
  if (isAdminEmail(email)) return 'elite';
  return subscriptionTier || 'free';
};
