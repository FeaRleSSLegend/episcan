/**
 * useStudentStats Hook
 * ====================
 *
 * Custom React hook to fetch real-time student health statistics from Supabase.
 * Replaces mock data in StudentDashboard with actual database queries.
 *
 * Features:
 * - Weekly check-in count
 * - Current health status (based on latest report)
 * - Active alerts count
 * - Check-in streak calculation
 *
 * @returns {Object} Student health statistics and loading states
 */

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface StudentStats {
  weeklyCheckins: number;
  currentHealth: 'Good' | 'Mild Symptoms' | 'Moderate' | 'Severe' | 'Pending Check-in';
  healthDescription: string;
  activeAlerts: number;
  activeAlertDetails: { title: string; message: string; priority: string }[];
  streak: number;
  loading: boolean;
  error: string | null;
  lastCheckinTime: string | null;
}

export const useStudentStats = (userId: string | undefined): StudentStats => {
  const [stats, setStats] = useState<StudentStats>({
    weeklyCheckins: 0,
    currentHealth: 'Good',
    healthDescription: 'No data available',
    activeAlerts: 0,
    activeAlertDetails: [],
    streak: 0,
    loading: true,
    error: null,
    lastCheckinTime: null,
  });

  useEffect(() => {
    const fetchStudentStats = async () => {
      if (!userId) {
        setStats(prev => ({ ...prev, loading: false, error: 'User not authenticated' }));
        return;
      }

      try {
        setStats(prev => ({ ...prev, loading: true, error: null }));

        // Get date boundaries
        const now = new Date();
        const weekAgo = new Date(now);
        weekAgo.setDate(weekAgo.getDate() - 7);
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        // ============================================================
        // 1. FETCH WEEKLY CHECK-INS (last 7 days)
        // ============================================================
        const { data: weeklyReports, error: weeklyError } = await supabase
          .from('health_reports')
          .select('id')
          .eq('user_id', userId)
          .gte('created_at', weekAgo.toISOString());

        if (weeklyError) throw weeklyError;
        const weeklyCheckins = weeklyReports?.length || 0;

        // ============================================================
        // 2. FETCH LATEST HEALTH REPORT (current health status)
        // ============================================================
        // ✅ FIXED: Added 'location' to match health_reports schema and prevent 406 error
        const { data: latestReport, error: latestError } = await supabase
          .from('health_reports')
          .select('symptoms, temperature, location, created_at')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (latestError && latestError.code !== 'PGRST116') throw latestError; // PGRST116 = no rows

        let currentHealth: 'Good' | 'Mild Symptoms' | 'Moderate' | 'Severe' | 'Pending Check-in' = 'Good';
        let healthDescription = 'No symptoms reported';
        let lastCheckinTime: string | null = null;

        if (latestReport) {
          lastCheckinTime = latestReport.created_at;
          const symptoms = latestReport.symptoms || [];
          const temp = latestReport.temperature;

          // Check if the last check-in was more than 24 hours ago
          const reportTime = new Date(latestReport.created_at).getTime();
          const twentyFourHoursAgo = Date.now() - (24 * 60 * 60 * 1000);

          if (reportTime < twentyFourHoursAgo) {
            // Last check-in was more than 24 hours ago
            currentHealth = 'Pending Check-in';
            healthDescription = 'Please submit your daily check-in';
          } else if (symptoms.length === 0 && (!temp || temp < 37.5)) {
            currentHealth = 'Good';
            healthDescription = 'No symptoms reported';
          } else if (temp && temp >= 39.0) {
            currentHealth = 'Severe';
            healthDescription = `High fever (${temp}°C)`;
          } else if (symptoms.length >= 3 || (temp && temp >= 38.0)) {
            currentHealth = 'Moderate';
            healthDescription = `${symptoms.length} symptoms reported`;
          } else {
            currentHealth = 'Mild Symptoms';
            healthDescription = symptoms.length > 0
              ? symptoms.slice(0, 2).join(', ')
              : 'Slight temperature';
          }
        } else {
          // No reports at all
          currentHealth = 'Pending Check-in';
          healthDescription = 'Submit your first check-in';
        }

        // ============================================================
        // 3. FETCH ACTIVE ALERTS (from system_notifications + FastAPI)
        // ============================================================
        let activeAlerts = 0;
        let activeAlertDetails: { title: string; message: string; priority: string }[] = [];
        const userLocation = latestReport?.location || '';

        // 3a. Fetch High/Critical system notifications for user's audience
        try {
          const { data: systemAlerts, error: alertsError } = await supabase
            .from('system_notifications')
            .select('id, title, message, priority, audience')
            .eq('status', 'sent')
            .in('priority', ['high', 'critical'])
            .in('audience', ['all', 'students'])
            .order('created_at', { ascending: false })
            .limit(10);

          if (!alertsError && systemAlerts && systemAlerts.length > 0) {
            activeAlerts = systemAlerts.length;
            activeAlertDetails = systemAlerts.map((alert: any) => ({
              title: alert.title,
              message: alert.message,
              priority: alert.priority,
            }));
          }
        } catch (notifError) {
          console.warn('Could not fetch system notifications:', notifError);
        }

        // 3b. Also check FastAPI for outbreak alerts at user's location
        if (userLocation) {
          try {
            const fastApiUrl = import.meta.env.VITE_FASTAPI_URL || 'http://localhost:8000';
            const alertsResponse = await fetch(`${fastApiUrl}/alerts`);
            if (alertsResponse.ok) {
              const outbreakAlerts = await alertsResponse.json();
              const locationAlert = outbreakAlerts.find((alert: any) => alert.location === userLocation);
              if (locationAlert) {
                activeAlerts += 1;
                activeAlertDetails.push({
                  title: `Outbreak Alert: ${locationAlert.location}`,
                  message: `${locationAlert.affected_students} affected students - Risk: ${locationAlert.risk_score}%`,
                  priority: locationAlert.severity?.toLowerCase() === 'high' ? 'critical' : 'high',
                });
              }
            }
          } catch (alertError) {
            console.warn('Could not fetch alerts from FastAPI:', alertError);
          }
        }

        // ============================================================
        // 4. CALCULATE CHECK-IN STREAK
        // ============================================================
        // Fetch all reports ordered by date to calculate consecutive days
        const { data: allReports, error: streakError } = await supabase
          .from('health_reports')
          .select('created_at')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(30); // Check last 30 days

        if (streakError) throw streakError;

        let streak = 0;
        if (allReports && allReports.length > 0) {
          const reportDates = allReports.map(r => {
            const date = new Date(r.created_at);
            return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
          });

          // Deduplicate dates (multiple reports in same day = 1 day)
          const uniqueDates = [...new Set(reportDates)].sort((a, b) => b - a);

          // Check for consecutive days
          let currentDate = new Date(todayStart).getTime();
          for (const reportDate of uniqueDates) {
            if (reportDate === currentDate) {
              streak++;
              currentDate -= 24 * 60 * 60 * 1000; // Go back 1 day
            } else if (reportDate < currentDate) {
              break; // Streak broken
            }
          }
        }

        // ============================================================
        // 5. UPDATE STATE
        // ============================================================
        setStats({
          weeklyCheckins,
          currentHealth,
          healthDescription,
          activeAlerts,
          activeAlertDetails,
          streak,
          loading: false,
          error: null,
          lastCheckinTime,
        });

      } catch (error) {
        console.error('Error fetching student stats:', error);
        setStats(prev => ({
          ...prev,
          loading: false,
          error: error instanceof Error ? error.message : 'Failed to fetch stats',
        }));
      }
    };

    fetchStudentStats();

    // Set up real-time subscription for live updates
    const subscription = supabase
      .channel('student_health_changes')
      .on('postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'health_reports',
          filter: `user_id=eq.${userId}`
        },
        () => {
          // Refetch stats when student's reports change
          fetchStudentStats();
        }
      )
      .subscribe();

    // Cleanup
    return () => {
      subscription.unsubscribe();
    };
  }, [userId]);

  return stats;
};

export default useStudentStats;
