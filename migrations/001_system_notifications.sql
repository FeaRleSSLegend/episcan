-- ============================================================================
-- EPISCAN SYSTEM NOTIFICATIONS MIGRATION
-- ============================================================================
-- This migration adds the system_notifications and user_notification_reads
-- tables to enable admin-to-user broadcasting of health alerts and announcements.
--
-- Run this in your Supabase SQL Editor.
-- ============================================================================

-- ============================================================================
-- STEP 1: CREATE TABLES
-- ============================================================================

-- Main notifications table
CREATE TABLE IF NOT EXISTS public.system_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  audience TEXT NOT NULL CHECK (audience IN ('all', 'students', 'parents', 'health_officers', 'admins')),
  priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'critical')),
  status TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('draft', 'scheduled', 'sent')),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  scheduled_for TIMESTAMP WITH TIME ZONE,
  sent_at TIMESTAMP WITH TIME ZONE
);

-- Track which users have read which notifications
CREATE TABLE IF NOT EXISTS public.user_notification_reads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_id UUID REFERENCES public.system_notifications(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  read_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(notification_id, user_id)
);

-- ============================================================================
-- STEP 2: CREATE INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_system_notifications_audience
  ON public.system_notifications(audience);

CREATE INDEX IF NOT EXISTS idx_system_notifications_status
  ON public.system_notifications(status);

CREATE INDEX IF NOT EXISTS idx_system_notifications_created_at
  ON public.system_notifications(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_user_notification_reads_user
  ON public.user_notification_reads(user_id);

CREATE INDEX IF NOT EXISTS idx_user_notification_reads_notification
  ON public.user_notification_reads(notification_id);

-- ============================================================================
-- STEP 3: ENABLE ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE public.system_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_notification_reads ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 4: CREATE RLS POLICIES
-- ============================================================================

-- Policy: Admins can manage all system notifications
DROP POLICY IF EXISTS "Admins can manage all system notifications" ON public.system_notifications;
CREATE POLICY "Admins can manage all system notifications"
  ON public.system_notifications
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Policy: Users can read notifications targeted to them
DROP POLICY IF EXISTS "Users can read notifications for their audience" ON public.system_notifications;
CREATE POLICY "Users can read notifications for their audience"
  ON public.system_notifications
  FOR SELECT
  USING (
    audience = 'all' OR
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND (
          (audience = 'students' AND ur.role = 'student') OR
          (audience = 'parents' AND ur.role = 'parent') OR
          (audience = 'health_officers' AND ur.role = 'health_officer') OR
          (audience = 'admins' AND ur.role = 'admin')
        )
    )
  );

-- Policy: Users can mark notifications as read
DROP POLICY IF EXISTS "Users can mark their notifications as read" ON public.user_notification_reads;
CREATE POLICY "Users can mark their notifications as read"
  ON public.user_notification_reads
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can view their read status
DROP POLICY IF EXISTS "Users can view their notification read status" ON public.user_notification_reads;
CREATE POLICY "Users can view their notification read status"
  ON public.user_notification_reads
  FOR SELECT
  USING (auth.uid() = user_id);

-- ============================================================================
-- STEP 5: ENABLE REALTIME (for live notification updates)
-- ============================================================================

-- Enable realtime for system_notifications table
ALTER PUBLICATION supabase_realtime ADD TABLE public.system_notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_notification_reads;

-- ============================================================================
-- STEP 6: SEED SAMPLE DATA (Optional - for testing)
-- ============================================================================

-- Uncomment the section below to add sample notifications for testing

/*
-- Get the first admin user (replace with your actual admin user_id if needed)
DO $$
DECLARE
  admin_user_id UUID;
BEGIN
  SELECT user_id INTO admin_user_id
  FROM public.user_roles
  WHERE role = 'admin'
  LIMIT 1;

  IF admin_user_id IS NOT NULL THEN
    INSERT INTO public.system_notifications (title, message, audience, priority, status, created_by, sent_at)
    VALUES
      (
        'Welcome to EPISCAN',
        'Thank you for joining EPISCAN. Complete your daily health check-ins to help us keep our community safe.',
        'all',
        'normal',
        'sent',
        admin_user_id,
        NOW()
      ),
      (
        'Flu Season Alert',
        'Increased flu cases detected on campus. Please practice good hygiene and consider getting vaccinated.',
        'students',
        'high',
        'sent',
        admin_user_id,
        NOW() - INTERVAL '1 day'
      ),
      (
        'Health Screening Reminder',
        'Annual health screenings are scheduled for next week. Check with your health officer for your assigned time slot.',
        'students',
        'normal',
        'sent',
        admin_user_id,
        NOW() - INTERVAL '2 days'
      );

    RAISE NOTICE 'Sample notifications created successfully!';
  ELSE
    RAISE NOTICE 'No admin user found. Skipping sample data insertion.';
  END IF;
END $$;
*/

-- ============================================================================
-- VERIFICATION
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ SYSTEM NOTIFICATIONS MIGRATION COMPLETE';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Tables Created:';
  RAISE NOTICE '  • system_notifications';
  RAISE NOTICE '  • user_notification_reads';
  RAISE NOTICE '';
  RAISE NOTICE 'Indexes Created: 5';
  RAISE NOTICE 'RLS Policies: 4';
  RAISE NOTICE 'Realtime: ENABLED';
  RAISE NOTICE '';
  RAISE NOTICE 'Next Steps:';
  RAISE NOTICE '  1. Verify tables: SELECT * FROM system_notifications;';
  RAISE NOTICE '  2. Test admin access: Login as admin, go to /dashboard/notifications';
  RAISE NOTICE '  3. Send test notification to students';
  RAISE NOTICE '  4. Login as student, check /dashboard/alerts';
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
END $$;
