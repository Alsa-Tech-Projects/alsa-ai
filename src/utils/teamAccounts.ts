// Team Accounts - Check if email is a team member with lifetime elite access
import { supabase } from '@/integrations/supabase/client';

// Fallback list for offline/quick checks
export const TEAM_EMAILS = [
  'alsa.ai.assistant@gmail.com',
  'qadrieisa@gmail.com',
  'coo-of-alsa-ai@alsa-ai.in',
  'useralsa@alsa-ai.in',
  'useralsa2@alsa-ai.in',
  'founder@alsa-ai.in'
];

export const isTeamEmail = (email: string | undefined | null): boolean => {
  if (!email) return false;
  return TEAM_EMAILS.includes(email.toLowerCase());
};

export const checkTeamAccount = async (email: string | undefined | null): Promise<{
  isTeam: boolean;
  tier: string;
  isLifetime: boolean;
}> => {
  if (!email) return { isTeam: false, tier: 'free', isLifetime: false };
  
  try {
    const { data, error } = await (supabase as any)
      .from('team_accounts')
      .select('subscription_tier, is_lifetime')
      .eq('email', email.toLowerCase())
      .single();
    
    if (error || !data) {
      // Fallback to local list
      if (isTeamEmail(email)) {
        return { isTeam: true, tier: 'elite', isLifetime: true };
      }
      return { isTeam: false, tier: 'free', isLifetime: false };
    }
    
    return {
      isTeam: true,
      tier: data.subscription_tier,
      isLifetime: data.is_lifetime
    };
  } catch {
    // Fallback to local list
    if (isTeamEmail(email)) {
      return { isTeam: true, tier: 'elite', isLifetime: true };
    }
    return { isTeam: false, tier: 'free', isLifetime: false };
  }
};

export const getTeamSubscription = () => ({
  tier: 'elite',
  isTeam: true,
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
