/**
 * useNotifications Hook
 * =====================
 *
 * Fetches real-time notifications from health_reports table.
 * Notifies users about:
 * - High-risk health reports in their location
 * - New anonymous message replies
 * - System alerts
 *
 * @returns {Object} Notifications data and unread count
 */

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { formatRelativeDate } from '@/lib/formatters';

interface Notification {
  id: string;
  type: 'alert' | 'message' | 'info';
  title: string;
  message?: string;
  time: string;
  read: boolean;
  link?: string;
  created_at: string;
}

interface UseNotificationsReturn {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
}

export const useNotifications = (): UseNotificationsReturn => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, role } = useAuth();

  useEffect(() => {
    const fetchNotifications = async () => {
      if (!user) {
        setNotifications([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const notificationsList: Notification[] = [];

        // ============================================================
        // 1. FETCH HIGH-RISK HEALTH REPORTS (for health officers/admins)
        // ============================================================
        if (role === 'health_officer' || role === 'admin') {
          const { data: highRiskReports, error: reportsError } = await supabase
            .from('health_reports')
            .select('id, temperature, location, symptoms, created_at')
            .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()) // Last 24 hours
            .order('created_at', { ascending: false })
            .limit(10);

          if (reportsError) throw reportsError;

          if (highRiskReports) {
            highRiskReports.forEach(report => {
              // Check if report is high-risk (fever >= 38.5 or 3+ symptoms)
              const isHighRisk =
                (report.temperature && report.temperature >= 38.5) ||
                (report.symptoms && report.symptoms.length >= 3);

              if (isHighRisk) {
                notificationsList.push({
                  id: `report-${report.id}`,
                  type: 'alert',
                  title: `High-risk report in ${report.location}`,
                  message: report.temperature
                    ? `Temperature: ${report.temperature}°C, ${report.symptoms?.length || 0} symptoms`
                    : `${report.symptoms?.length || 0} symptoms reported`,
                  time: formatRelativeDate(report.created_at),
                  read: false,
                  link: '/dashboard/reports',
                  created_at: report.created_at,
                });
              }
            });
          }
        }

        // ============================================================
        // 2. FETCH ANONYMOUS MESSAGE NOTIFICATIONS
        // ============================================================

        // For students: Check for officer replies
        if (role === 'student') {
          const { data: messages, error: messagesError } = await supabase
            .from('anonymous_messages')
            .select(`
              id,
              subject,
              created_at,
              message_threads!inner(id, sender_type, created_at, is_read)
            `)
            .eq('sender_user_id', user.id)
            .gte('message_threads.created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
            .eq('message_threads.sender_type', 'officer')
            .eq('message_threads.is_read', false);

          if (messagesError && messagesError.code !== 'PGRST116') throw messagesError;

          if (messages && messages.length > 0) {
            messages.forEach(msg => {
              notificationsList.push({
                id: `message-${msg.id}`,
                type: 'message',
                title: 'Health officer responded',
                message: `New reply to: "${(msg as any).subject}"`,
                time: formatRelativeDate((msg as any).message_threads[0]?.created_at || msg.created_at),
                read: false,
                link: '/dashboard/messages',
                created_at: (msg as any).message_threads[0]?.created_at || msg.created_at,
              });
            });
          }
        }

        // For health officers: Check for new student messages
        if (role === 'health_officer' || role === 'admin') {
          const { data: newMessages, error: newMessagesError } = await supabase
            .from('anonymous_messages')
            .select('id, subject, created_at, is_read')
            .eq('is_read', false)
            .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
            .order('created_at', { ascending: false })
            .limit(5);

          if (newMessagesError) throw newMessagesError;

          if (newMessages) {
            newMessages.forEach(msg => {
              notificationsList.push({
                id: `new-message-${msg.id}`,
                type: 'message',
                title: 'New anonymous message',
                message: `Subject: "${msg.subject}"`,
                time: formatRelativeDate(msg.created_at),
                read: false,
                link: '/dashboard/officer-messages',
                created_at: msg.created_at,
              });
            });
          }
        }

        // ============================================================
        // 3. SORT NOTIFICATIONS BY DATE (most recent first)
        // ============================================================
        notificationsList.sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );

        setNotifications(notificationsList);
      } catch (err) {
        console.error('Error fetching notifications:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch notifications');
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();

    // ============================================================
    // 4. SET UP REAL-TIME SUBSCRIPTION
    // ============================================================
    const channel = supabase
      .channel('notifications-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'health_reports',
        },
        () => {
          // Refetch notifications when new health report arrives
          fetchNotifications();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'anonymous_messages',
        },
        () => {
          // Refetch notifications when new message arrives
          fetchNotifications();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'message_threads',
        },
        () => {
          // Refetch notifications when message thread arrives
          fetchNotifications();
        }
      )
      .subscribe();

    // Cleanup
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, role]);

  const unreadCount = notifications.filter(n => !n.read).length;

  return {
    notifications,
    unreadCount,
    loading,
    error,
  };
};

export default useNotifications;
