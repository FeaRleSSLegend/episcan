/**
 * useNotificationBadge Hook
 * =========================
 *
 * Real-time notification badge counter for navigation items.
 * Tracks unread counts for:
 * - Anonymous messages (for health officers/admins)
 * - System notifications (for all users)
 * - Health reports alerts (for health officers/admins)
 *
 * Uses Supabase Realtime to update badges without page refresh.
 */

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface NotificationBadges {
  messages: number;        // Unread anonymous messages
  notifications: number;   // Unread system notifications
  alerts: number;          // High-risk health reports
}

export const useNotificationBadge = (): NotificationBadges => {
  const { user, role } = useAuth();
  const [badges, setBadges] = useState<NotificationBadges>({
    messages: 0,
    notifications: 0,
    alerts: 0,
  });

  useEffect(() => {
    if (!user?.id || !role) return;

    const fetchBadgeCounts = async () => {
      try {
        // ============================================================
        // 1. ANONYMOUS MESSAGES BADGE (Health Officers & Admins Only)
        // ============================================================
        if (role === 'health_officer' || role === 'admin') {
          const { data: messages, error: messagesError } = await supabase
            .from('anonymous_messages')
            .select('id, is_read')
            .eq('is_read', false);

          if (!messagesError && messages) {
            setBadges((prev) => ({ ...prev, messages: messages.length }));
          }
        }

        // ============================================================
        // 2. SYSTEM NOTIFICATIONS BADGE (All Users)
        // ============================================================
        // Get user's role for audience filtering
        const { data: notifications, error: notificationsError } = await supabase
          .from('system_notifications')
          .select(`
            id,
            audience,
            user_notification_reads!left(id, user_id)
          `)
          .eq('status', 'sent')
          .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()); // Last 30 days

        if (!notificationsError && notifications) {
          // Filter notifications for this user's audience
          const relevantNotifications = notifications.filter((n: any) => {
            if (n.audience === 'all') return true;
            if (n.audience === 'students' && role === 'student') return true;
            if (n.audience === 'parents' && role === 'parent') return true;
            if (n.audience === 'health_officers' && role === 'health_officer') return true;
            if (n.audience === 'admins' && role === 'admin') return true;
            return false;
          });

          // Count unread (not in user_notification_reads for this user)
          const unreadCount = relevantNotifications.filter(
            (n: any) => !n.user_notification_reads?.some((r: any) => r.user_id === user.id)
          ).length;

          setBadges((prev) => ({ ...prev, notifications: unreadCount }));
        }

        // ============================================================
        // 3. HEALTH ALERTS BADGE (Health Officers & Admins Only)
        // ============================================================
        if (role === 'health_officer' || role === 'admin') {
          const today = new Date();
          today.setHours(0, 0, 0, 0);

          const { data: reports, error: reportsError } = await supabase
            .from('health_reports')
            .select('id, temperature, symptoms')
            .gte('created_at', today.toISOString());

          if (!reportsError && reports) {
            // Count high-risk reports (fever >= 38.5 or 3+ symptoms)
            const highRiskCount = reports.filter(
              (r: any) =>
                (r.temperature && r.temperature >= 38.5) ||
                (r.symptoms && r.symptoms.length >= 3)
            ).length;

            setBadges((prev) => ({ ...prev, alerts: highRiskCount }));
          }
        }
      } catch (error) {
        console.error('Error fetching badge counts:', error);
      }
    };

    // Initial fetch
    fetchBadgeCounts();

    // ============================================================
    // REAL-TIME SUBSCRIPTIONS
    // ============================================================

    // Subscribe to new anonymous messages
    const messagesChannel = supabase
      .channel('badge-messages')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'anonymous_messages',
        },
        () => {
          fetchBadgeCounts();
        }
      )
      .subscribe();

    // Subscribe to new system notifications
    const notificationsChannel = supabase
      .channel('badge-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'system_notifications',
        },
        () => {
          fetchBadgeCounts();
        }
      )
      .subscribe();

    // Subscribe to new health reports
    const reportsChannel = supabase
      .channel('badge-reports')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'health_reports',
        },
        () => {
          fetchBadgeCounts();
        }
      )
      .subscribe();

    // Subscribe to notification read status changes
    const readsChannel = supabase
      .channel('badge-reads')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'user_notification_reads',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          fetchBadgeCounts();
        }
      )
      .subscribe();

    // Cleanup
    return () => {
      supabase.removeChannel(messagesChannel);
      supabase.removeChannel(notificationsChannel);
      supabase.removeChannel(reportsChannel);
      supabase.removeChannel(readsChannel);
    };
  }, [user?.id, role]);

  return badges;
};

export default useNotificationBadge;
