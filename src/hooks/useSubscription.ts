import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { isTeamEmail, checkTeamAccount, TEAM_EMAILS } from '@/utils/teamAccounts';

interface SubscriptionInfo {
  tier: string | null;
  expiresAt: string | null;
  isActive: boolean;
  isPro: boolean;
  isElite: boolean;
  isFree: boolean;
  dailyMessageCount: number;
  dailyMessageLimit: number;
  canSendMessage: boolean;
  loading: boolean;
  isTeam: boolean;
}

const SUBSCRIPTION_CACHE_KEY = 'alsa_subscription_cache';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

interface CachedSubscription {
  data: SubscriptionInfo;
  timestamp: number;
  userId: string;
}

export const useSubscription = () => {
  const [subscription, setSubscription] = useState<SubscriptionInfo>({
    tier: null,
    expiresAt: null,
    isActive: false,
    isPro: false,
    isElite: false,
    isFree: true,
    dailyMessageCount: 0,
    dailyMessageLimit: 50,
    canSendMessage: true,
    loading: true,
    isTeam: false
  });

  const fetchSubscription = useCallback(async (forceRefresh = false) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        setSubscription(prev => ({ ...prev, loading: false }));
        localStorage.removeItem(SUBSCRIPTION_CACHE_KEY);
        return;
      }

      const userEmail = session.user.email?.toLowerCase();
      const userId = session.user.id;

      // Quick team check - this should ALWAYS take priority
      const isTeamMember = TEAM_EMAILS.includes(userEmail || '');
      
      if (isTeamMember) {
        console.log('✅ Team account detected (quick check):', userEmail);
        const teamSub: SubscriptionInfo = {
          tier: 'elite',
          expiresAt: null,
          isActive: true,
          isPro: false,
          isElite: true,
          isFree: false,
          dailyMessageCount: 0,
          dailyMessageLimit: Infinity,
          canSendMessage: true,
          loading: false,
          isTeam: true
        };
        setSubscription(teamSub);
        
        // Cache it
        const cache: CachedSubscription = {
          data: teamSub,
          timestamp: Date.now(),
          userId
        };
        localStorage.setItem(SUBSCRIPTION_CACHE_KEY, JSON.stringify(cache));
        return;
      }

      // Also do database check for team accounts
      const teamCheck = await checkTeamAccount(userEmail);
      if (teamCheck.isTeam) {
        console.log('✅ Team account detected (DB check):', userEmail, teamCheck);
        const teamSub: SubscriptionInfo = {
          tier: teamCheck.tier,
          expiresAt: null,
          isActive: true,
          isPro: teamCheck.tier === 'pro',
          isElite: teamCheck.tier === 'elite',
          isFree: false,
          dailyMessageCount: 0,
          dailyMessageLimit: Infinity,
          canSendMessage: true,
          loading: false,
          isTeam: true
        };
        setSubscription(teamSub);
        
        // Cache it
        const cache: CachedSubscription = {
          data: teamSub,
          timestamp: Date.now(),
          userId
        };
        localStorage.setItem(SUBSCRIPTION_CACHE_KEY, JSON.stringify(cache));
        return;
      }

      // Check cache for non-team users (unless force refresh)
      if (!forceRefresh) {
        try {
          const cachedData = localStorage.getItem(SUBSCRIPTION_CACHE_KEY);
          if (cachedData) {
            const cached: CachedSubscription = JSON.parse(cachedData);
            if (
              cached.userId === userId &&
              Date.now() - cached.timestamp < CACHE_DURATION &&
              !cached.data.isTeam // Don't use cache if it was team data
            ) {
              console.log('📦 Using cached subscription data');
              setSubscription(cached.data);
              return;
            }
          }
        } catch (e) {
          console.error('Cache read error:', e);
        }
      }

      // Fetch profile with subscription data
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('subscription_tier, subscription_expires_at')
        .eq('user_id', userId)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        console.error('Profile fetch error:', profileError);
      }

      // Fetch today's message count
      const today = new Date().toISOString().split('T')[0];
      const { data: messageCount } = await supabase
        .from('daily_message_counts')
        .select('message_count')
        .eq('user_id', userId)
        .eq('message_date', today)
        .maybeSingle();

      const tier = profile?.subscription_tier || 'free';
      const expiresAt = profile?.subscription_expires_at;
      
      // Check expiration properly
      let isExpired = true;
      if (expiresAt) {
        const expiryDate = new Date(expiresAt);
        isExpired = expiryDate < new Date();
      }
      
      const isActive = tier !== 'free' && !isExpired;
      const dailyCount = messageCount?.message_count || 0;
      const dailyLimit = tier === 'free' || !isActive ? 50 : Infinity;

      const subData: SubscriptionInfo = {
        tier: isActive ? tier : 'free',
        expiresAt,
        isActive,
        isPro: isActive && tier === 'pro',
        isElite: isActive && tier === 'elite',
        isFree: !isActive || tier === 'free',
        dailyMessageCount: dailyCount,
        dailyMessageLimit: dailyLimit,
        canSendMessage: dailyCount < dailyLimit,
        loading: false,
        isTeam: false
      };

      setSubscription(subData);

      // Cache the result
      const cache: CachedSubscription = {
        data: subData,
        timestamp: Date.now(),
        userId
      };
      localStorage.setItem(SUBSCRIPTION_CACHE_KEY, JSON.stringify(cache));
      
    } catch (error) {
      console.error('Error fetching subscription:', error);
      setSubscription(prev => ({ ...prev, loading: false }));
    }
  }, []);

  useEffect(() => {
    fetchSubscription();

    // Subscribe to auth changes
    const { data: { subscription: authSub } } = supabase.auth.onAuthStateChange((event) => {
      console.log('Auth state changed:', event);
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        // Clear cache and refetch on sign in
        localStorage.removeItem(SUBSCRIPTION_CACHE_KEY);
        fetchSubscription(true);
      } else if (event === 'SIGNED_OUT') {
        localStorage.removeItem(SUBSCRIPTION_CACHE_KEY);
        setSubscription({
          tier: null,
          expiresAt: null,
          isActive: false,
          isPro: false,
          isElite: false,
          isFree: true,
          dailyMessageCount: 0,
          dailyMessageLimit: 50,
          canSendMessage: true,
          loading: false,
          isTeam: false
        });
      }
    });

    // Also listen for profile updates (realtime)
    const profileChannel = supabase
      .channel('profile-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles'
        },
        (payload) => {
          console.log('Profile updated:', payload);
          // Clear cache and refetch
          localStorage.removeItem(SUBSCRIPTION_CACHE_KEY);
          fetchSubscription(true);
        }
      )
      .subscribe();

    return () => {
      authSub.unsubscribe();
      supabase.removeChannel(profileChannel);
    };
  }, [fetchSubscription]);

  const incrementMessageCount = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      // Team members don't need to track messages
      if (subscription.isTeam) return;

      const today = new Date().toISOString().split('T')[0];
      
      // Try to update existing record
      const { data: existing } = await supabase
        .from('daily_message_counts')
        .select('id, message_count')
        .eq('user_id', session.user.id)
        .eq('message_date', today)
        .maybeSingle();

      if (existing) {
        await supabase
          .from('daily_message_counts')
          .update({ message_count: existing.message_count + 1 })
          .eq('id', existing.id);
        
        setSubscription(prev => ({
          ...prev,
          dailyMessageCount: existing.message_count + 1,
          canSendMessage: existing.message_count + 1 < prev.dailyMessageLimit
        }));
      } else {
        await supabase
          .from('daily_message_counts')
          .insert({ user_id: session.user.id, message_date: today, message_count: 1 });
        
        setSubscription(prev => ({
          ...prev,
          dailyMessageCount: 1,
          canSendMessage: 1 < prev.dailyMessageLimit
        }));
      }
    } catch (error) {
      console.error('Error incrementing message count:', error);
    }
  };

  const refreshSubscription = useCallback(() => {
    localStorage.removeItem(SUBSCRIPTION_CACHE_KEY);
    fetchSubscription(true);
  }, [fetchSubscription]);

  return { ...subscription, incrementMessageCount, refreshSubscription };
};