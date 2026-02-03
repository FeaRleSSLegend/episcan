/**
 * EPISCAN Outbreak Alerts Component
 * ==================================
 *
 * This component fetches and displays AI-detected outbreak alerts from the FastAPI backend.
 * It shows the "WOW" moment with real-time outbreak detection, risk scores, and severity badges.
 *
 * Features:
 * - Real-time outbreak detection display
 * - Color-coded severity badges (Low/Medium/High)
 * - Risk score percentages with Z-score calculation
 * - Affected student counts
 * - Common symptoms per location
 * - Auto-refresh every 30 seconds
 *
 * @component
 */

import { useState, useEffect } from 'react';
import { AlertTriangle, Users, Activity, MapPin, TrendingUp } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

/**
 * Configuration
 */
const FASTAPI_URL = import.meta.env.VITE_FASTAPI_URL || 'http://localhost:8000';
const REFRESH_INTERVAL = 30000; // Refresh alerts every 30 seconds

/**
 * OutbreakAlerts Component
 */
const OutbreakAlerts = () => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  /**
   * Fetch outbreak alerts from FastAPI backend
   */
  const fetchAlerts = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${FASTAPI_URL}/alerts`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setAlerts(data);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Error fetching outbreak alerts:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Initialize and set up auto-refresh
   */
  useEffect(() => {
    // Initial fetch
    fetchAlerts();

    // Set up auto-refresh interval
    const intervalId = setInterval(fetchAlerts, REFRESH_INTERVAL);

    // Cleanup on unmount
    return () => clearInterval(intervalId);
  }, []);

  /**
   * Get severity badge variant (color)
   */
  const getSeverityVariant = (severity) => {
    switch (severity) {
      case 'High':
        return 'destructive'; // Red
      case 'Medium':
        return 'warning'; // Yellow/Orange
      case 'Low':
        return 'secondary'; // Gray
      default:
        return 'default';
    }
  };

  /**
   * Get severity icon color
   */
  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'High':
        return 'text-red-600';
      case 'Medium':
        return 'text-yellow-600';
      case 'Low':
        return 'text-blue-600';
      default:
        return 'text-gray-600';
    }
  };

  /**
   * Format timestamp for display
   */
  const formatTime = (date) => {
    if (!date) return '';
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).format(date);
  };

  /**
   * Render loading state
   */
  if (loading && alerts.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 animate-pulse" />
            Outbreak Detection System
          </CardTitle>
          <CardDescription>
            AI-powered early warning system analyzing health reports...
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  /**
   * Render error state
   */
  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Error Loading Alerts</AlertTitle>
        <AlertDescription>
          {error}. Please ensure the FastAPI backend is running at {FASTAPI_URL}.
        </AlertDescription>
      </Alert>
    );
  }

  /**
   * Render no alerts state
   */
  if (alerts.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-green-600" />
            Outbreak Detection System
          </CardTitle>
          <CardDescription>
            AI-powered early warning system • Last updated: {formatTime(lastUpdated)}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <Activity className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-green-700 mb-2">
              All Clear! ✓
            </h3>
            <p className="text-sm text-muted-foreground max-w-md">
              No outbreak alerts detected. All health metrics are within normal parameters.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  /**
   * Render alerts - THE "WOW" MOMENT! 🎉
   */
  return (
    <div className="space-y-4">
      {/* Header Card */}
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600 animate-pulse" />
            Active Outbreak Alerts
          </CardTitle>
          <CardDescription>
            AI-detected anomalies using statistical analysis (7-day baseline, 2σ threshold) •
            Last updated: {formatTime(lastUpdated)}
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Alert Cards */}
      {alerts.map((alert, index) => (
        <Card
          key={index}
          className={`w-full border-l-4 ${
            alert.severity === 'High'
              ? 'border-l-red-600 bg-red-50/50'
              : alert.severity === 'Medium'
              ? 'border-l-yellow-600 bg-yellow-50/50'
              : 'border-l-blue-600 bg-blue-50/50'
          }`}
        >
          <CardHeader>
            {/* Severity Badge and Location */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <MapPin className={`h-5 w-5 ${getSeverityColor(alert.severity)}`} />
                <CardTitle className="text-xl">{alert.location}</CardTitle>
              </div>
              <Badge
                variant={getSeverityVariant(alert.severity)}
                className="text-sm font-bold px-3 py-1"
              >
                {alert.severity.toUpperCase()} RISK
              </Badge>
            </div>

            {/* THE WOW MOMENT - Risk Score Display */}
            <div className="bg-white rounded-lg p-4 border-2 border-dashed border-gray-300 mt-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <TrendingUp className={`h-8 w-8 ${getSeverityColor(alert.severity)}`} />
                  <div>
                    <p className="text-xs text-muted-foreground font-medium">
                      AI Risk Score (Z-Score Based)
                    </p>
                    <p className={`text-3xl font-bold ${getSeverityColor(alert.severity)}`}>
                      {alert.risk_score}%
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground font-medium">
                    Affected Students
                  </p>
                  <p className="text-3xl font-bold text-foreground">
                    {alert.affected_students}
                  </p>
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Affected Students */}
            <div className="flex items-center gap-3 p-3 bg-white rounded-lg border">
              <Users className="h-5 w-5 text-muted-foreground flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-foreground">
                  {alert.affected_students} {alert.affected_students === 1 ? 'student' : 'students'} affected
                </p>
                <p className="text-xs text-muted-foreground">
                  Reporting symptoms in the last 24 hours
                </p>
              </div>
            </div>

            {/* Common Symptoms */}
            {alert.common_symptoms && alert.common_symptoms.length > 0 && (
              <div className="p-3 bg-white rounded-lg border">
                <p className="text-sm font-semibold mb-2 text-foreground">
                  Most Common Symptoms:
                </p>
                <div className="flex flex-wrap gap-2">
                  {alert.common_symptoms.map((symptom, idx) => (
                    <Badge key={idx} variant="outline" className="capitalize">
                      {symptom}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Detection Info */}
            <div className="text-xs text-muted-foreground border-t pt-3">
              <p>
                ⚡ Detected: {new Date(alert.detection_time).toLocaleString()}
              </p>
              <p className="mt-1">
                📊 Algorithm: Statistical Anomaly Detection (Mean + 2σ Threshold)
              </p>
              {alert._debug && (
                <details className="mt-2">
                  <summary className="cursor-pointer hover:text-foreground">
                    View Technical Details
                  </summary>
                  <div className="mt-2 p-2 bg-gray-100 rounded text-xs font-mono">
                    <p>Baseline Mean (μ): {alert._debug.baseline_mean}</p>
                    <p>Std Deviation (σ): {alert._debug.baseline_std_dev}</p>
                    <p>Current Count: {alert._debug.current_count}</p>
                    <p>Z-Score: {alert._debug.z_score}</p>
                    <p className="mt-1 text-muted-foreground">
                      Formula: Z = (Current - μ) / σ
                    </p>
                  </div>
                </details>
              )}
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Example "Wow" Message Format (commented out - for presentation reference) */}
      {/*
        Example display:
        "HIGH severity alert: Hostel A - 5 students, 63% risk score"

        This is automatically generated from the card above, but here's the raw format:
      */}
      {alerts.length > 0 && (
        <Alert className="bg-gradient-to-r from-red-50 to-yellow-50 border-red-200">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertTitle className="text-red-900">Quick Summary for Presentation</AlertTitle>
          <AlertDescription className="text-sm text-red-800">
            {alerts.map((alert, idx) => (
              <p key={idx} className="font-semibold">
                • {alert.severity.toUpperCase()} severity alert: {alert.location} - {' '}
                {alert.affected_students} {alert.affected_students === 1 ? 'student' : 'students'}, {' '}
                {alert.risk_score}% risk score
              </p>
            ))}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default OutbreakAlerts;
