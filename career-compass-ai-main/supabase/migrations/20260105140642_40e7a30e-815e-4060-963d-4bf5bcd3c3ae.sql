-- Create storage bucket for resumes
INSERT INTO storage.buckets (id, name, public)
VALUES ('resumes', 'resumes', false)
ON CONFLICT (id) DO NOTHING;

-- Create RLS policy for resumes bucket - users can upload their own
CREATE POLICY "Users can upload their own resumes"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'resumes' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Users can view their own resumes
CREATE POLICY "Users can view their own resumes"
ON storage.objects
FOR SELECT
USING (bucket_id = 'resumes' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Users can delete their own resumes
CREATE POLICY "Users can delete their own resumes"
ON storage.objects
FOR DELETE
USING (bucket_id = 'resumes' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Add notification preferences to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS email_notifications boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS notification_preferences jsonb DEFAULT '{"deadline_reminders": true, "opportunity_matches": true}'::jsonb;

-- Create table for tracking sent notifications (to avoid duplicates)
CREATE TABLE IF NOT EXISTS public.notification_log (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  notification_type text NOT NULL,
  reference_id uuid,
  sent_at timestamp with time zone NOT NULL DEFAULT now(),
  metadata jsonb
);

ALTER TABLE public.notification_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications"
ON public.notification_log
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "System can insert notifications"
ON public.notification_log
FOR INSERT
WITH CHECK (true);