import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

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
    loading: true
  });

  useEffect(() => {
    const fetchSubscription = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) {
          setSubscription(prev => ({ ...prev, loading: false }));
          return;
        }

        // Fetch profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('subscription_tier, subscription_expires_at')
          .eq('user_id', session.user.id)
          .single();

        // Fetch today's message count
        const today = new Date().toISOString().split('T')[0];
        const { data: messageCount } = await supabase
          .from('daily_message_counts')
          .select('message_count')
          .eq('user_id', session.user.id)
          .eq('message_date', today)
          .single();

        const tier = profile?.subscription_tier || 'free';
        const expiresAt = profile?.subscription_expires_at;
        const isExpired = expiresAt ? new Date(expiresAt) < new Date() : true;
        const isActive = tier !== 'free' && !isExpired;
        
        const dailyCount = messageCount?.message_count || 0;
        const dailyLimit = tier === 'free' || !isActive ? 50 : Infinity;
        
        setSubscription({
          tier: isActive ? tier : 'free',
          expiresAt,
          isActive,
          isPro: isActive && tier === 'pro',
          isElite: isActive && tier === 'elite',
          isFree: !isActive || tier === 'free',
          dailyMessageCount: dailyCount,
          dailyMessageLimit: dailyLimit,
          canSendMessage: dailyCount < dailyLimit,
          loading: false
        });
      } catch (error) {
        console.error('Error fetching subscription:', error);
        setSubscription(prev => ({ ...prev, loading: false }));
      }
    };

    fetchSubscription();

    // Subscribe to auth changes
    const { data: { subscription: authSub } } = supabase.auth.onAuthStateChange(() => {
      fetchSubscription();
    });

    return () => authSub.unsubscribe();
  }, []);

  const incrementMessageCount = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      const today = new Date().toISOString().split('T')[0];
      
      // Try to update existing record
      const { data: existing } = await supabase
        .from('daily_message_counts')
        .select('id, message_count')
        .eq('user_id', session.user.id)
        .eq('message_date', today)
        .single();

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

  return { ...subscription, incrementMessageCount };
};