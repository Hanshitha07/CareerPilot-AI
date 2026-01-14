-- Create interview_schedules table for scheduling interviews
CREATE TABLE public.interview_schedules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  opportunity_id UUID NOT NULL REFERENCES public.opportunities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
  duration_minutes INTEGER DEFAULT 60,
  interview_type TEXT DEFAULT 'phone',
  notes TEXT,
  reminder_sent BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.interview_schedules ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view own interview schedules"
ON public.interview_schedules FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own interview schedules"
ON public.interview_schedules FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own interview schedules"
ON public.interview_schedules FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own interview schedules"
ON public.interview_schedules FOR DELETE
USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_interview_schedules_updated_at
BEFORE UPDATE ON public.interview_schedules
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();