/**
 * useHealthReports Hook
 * =====================
 *
 * Custom React hook to fetch and manage health reports data from Supabase.
 * Provides real-time statistics for the Health Officer Dashboard.
 *
 * Features:
 * - Fetches total reports count
 * - Calculates healthy student percentage
 * - Groups reports by location
 * - Aggregates symptom frequencies
 * - Provides weekly trends
 *
 * @returns {Object} Health reports data and loading states
 */

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface DailyStats {
  date: string;
  count: number;
}

interface LocationStats {
  location: string;
  count: number;
}

interface SymptomStats {
  symptom: string;
  count: number;
  percentage: number;
}

interface HealthReportsData {
  totalReportsToday: number;
  totalReportsYesterday: number;
  healthyPercentage: number;
  totalStudents: number;
  weeklyTrend: DailyStats[];
  topSymptoms: SymptomStats[];
  locationBreakdown: LocationStats[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export const useHealthReports = (): HealthReportsData => {
  const [data, setData] = useState<HealthReportsData>({
    totalReportsToday: 0,
    totalReportsYesterday: 0,
    healthyPercentage: 0,
    totalStudents: 0,
    weeklyTrend: [],
    topSymptoms: [],
    locationBreakdown: [],
    loading: true,
    error: null,
    refetch: () => {},
  });

  const fetchHealthReports = async () => {
    try {
      setData(prev => ({ ...prev, loading: true, error: null }));

      // Get date boundaries
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const yesterdayStart = new Date(todayStart);
      yesterdayStart.setDate(yesterdayStart.getDate() - 1);
      const weekAgo = new Date(todayStart);
      weekAgo.setDate(weekAgo.getDate() - 7);

      // ============================================================
      // 1. FETCH TOTAL STUDENTS
      // ============================================================
      const { data: studentsData, error: studentsError } = await supabase
        .from('profiles')
        .select('user_id', { count: 'exact', head: true });

      if (studentsError) throw studentsError;
      const totalStudents = studentsData?.length || 0;

      // ============================================================
      // 2. FETCH TODAY'S REPORTS
      // ============================================================
      const { data: todayReports, error: todayError } = await supabase
        .from('health_reports')
        .select('*')
        .gte('created_at', todayStart.toISOString());

      if (todayError) throw todayError;
      const totalReportsToday = todayReports?.length || 0;

      // ============================================================
      // 3. FETCH YESTERDAY'S REPORTS
      // ============================================================
      const { data: yesterdayReports, error: yesterdayError } = await supabase
        .from('health_reports')
        .select('*')
        .gte('created_at', yesterdayStart.toISOString())
        .lt('created_at', todayStart.toISOString());

      if (yesterdayError) throw yesterdayError;
      const totalReportsYesterday = yesterdayReports?.length || 0;

      // ============================================================
      // 4. FETCH WEEKLY REPORTS (for trend calculation)
      // ============================================================
      const { data: weeklyReports, error: weeklyError } = await supabase
        .from('health_reports')
        .select('created_at')
        .gte('created_at', weekAgo.toISOString())
        .order('created_at', { ascending: true });

      if (weeklyError) throw weeklyError;

      // Group by day
      const dailyCounts: { [key: string]: number } = {};
      weeklyReports?.forEach(report => {
        const date = new Date(report.created_at).toLocaleDateString('en-US', {
          weekday: 'short'
        });
        dailyCounts[date] = (dailyCounts[date] || 0) + 1;
      });

      // Convert to array for chart (last 7 days)
      const weeklyTrend: DailyStats[] = [];
      const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

      for (let i = 6; i >= 0; i--) {
        const date = new Date(todayStart);
        date.setDate(date.getDate() - i);
        const dayName = days[date.getDay() === 0 ? 6 : date.getDay() - 1]; // Adjust for Sunday = 0

        const dayStart = new Date(date);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(date);
        dayEnd.setHours(23, 59, 59, 999);

        const count = weeklyReports?.filter(r => {
          const reportDate = new Date(r.created_at);
          return reportDate >= dayStart && reportDate <= dayEnd;
        }).length || 0;

        weeklyTrend.push({ date: dayName, count });
      }

      // ============================================================
      // 5. CALCULATE SYMPTOM FREQUENCIES
      // ============================================================
      const { data: recentReports, error: recentError } = await supabase
        .from('health_reports')
        .select('symptoms')
        .gte('created_at', weekAgo.toISOString());

      if (recentError) throw recentError;

      const symptomCounts: { [key: string]: number } = {};
      let totalSymptoms = 0;

      recentReports?.forEach(report => {
        if (Array.isArray(report.symptoms)) {
          report.symptoms.forEach(symptom => {
            if (symptom) {
              symptomCounts[symptom] = (symptomCounts[symptom] || 0) + 1;
              totalSymptoms++;
            }
          });
        }
      });

      // Convert to sorted array
      const topSymptoms: SymptomStats[] = Object.entries(symptomCounts)
        .map(([symptom, count]) => ({
          symptom: symptom.charAt(0).toUpperCase() + symptom.slice(1), // Capitalize
          count,
          percentage: totalSymptoms > 0 ? Math.round((count / totalSymptoms) * 100) : 0,
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5); // Top 5 symptoms

      // ============================================================
      // 6. GROUP BY LOCATION
      // ============================================================
      const locationCounts: { [key: string]: number } = {};

      todayReports?.forEach(report => {
        if (report.location) {
          locationCounts[report.location] = (locationCounts[report.location] || 0) + 1;
        }
      });

      const locationBreakdown: LocationStats[] = Object.entries(locationCounts)
        .map(([location, count]) => ({ location, count }))
        .sort((a, b) => b.count - a.count);

      // ============================================================
      // 7. CALCULATE HEALTHY PERCENTAGE
      // ============================================================
      // Students who reported today
      const uniqueStudentsReporting = new Set(todayReports?.map(r => r.user_id) || []).size;

      // Assume students who didn't report are healthy
      const healthyStudents = totalStudents - uniqueStudentsReporting;
      const healthyPercentage = totalStudents > 0
        ? Math.round((healthyStudents / totalStudents) * 100 * 10) / 10 // Round to 1 decimal
        : 100;

      // ============================================================
      // 8. UPDATE STATE
      // ============================================================
      setData({
        totalReportsToday,
        totalReportsYesterday,
        healthyPercentage,
        totalStudents,
        weeklyTrend,
        topSymptoms,
        locationBreakdown,
        loading: false,
        error: null,
        refetch: fetchHealthReports,
      });

    } catch (error) {
      console.error('Error fetching health reports:', error);
      setData(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch health reports',
      }));
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchHealthReports();

    // Set up real-time subscription (optional - for live updates)
    const subscription = supabase
      .channel('health_reports_changes')
      .on('postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'health_reports'
        },
        () => {
          // Refetch when any change occurs
          fetchHealthReports();
        }
      )
      .subscribe();

    // Cleanup subscription
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return data;
};

export default useHealthReports;
