import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Bell, Clock, Briefcase, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface NotificationPreferences {
  deadline_reminders: boolean;
  opportunity_matches: boolean;
}

export function NotificationSettings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    deadline_reminders: true,
    opportunity_matches: true,
  });

  useEffect(() => {
    if (user) {
      loadPreferences();
    }
  }, [user]);

  const loadPreferences = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('email_notifications, notification_preferences')
        .eq('id', user?.id)
        .single();

      if (error) throw error;

      if (data) {
        setEmailEnabled(data.email_notifications ?? true);
        if (data.notification_preferences && typeof data.notification_preferences === 'object') {
          const prefs = data.notification_preferences as Record<string, unknown>;
          setPreferences({
            deadline_reminders: prefs.deadline_reminders !== false,
            opportunity_matches: prefs.opportunity_matches !== false,
          });
        }
      }
    } catch (err) {
      console.error('Error loading preferences:', err);
    } finally {
      setLoading(false);
    }
  };

  const savePreferences = async (
    newEmailEnabled?: boolean,
    newPreferences?: Partial<NotificationPreferences>
  ) => {
    if (!user) return;

    setSaving(true);
    try {
      const updates: Record<string, unknown> = {};
      
      if (newEmailEnabled !== undefined) {
        updates.email_notifications = newEmailEnabled;
        setEmailEnabled(newEmailEnabled);
      }
      
      if (newPreferences) {
        const updatedPrefs = { ...preferences, ...newPreferences };
        updates.notification_preferences = updatedPrefs;
        setPreferences(updatedPrefs);
      }

      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id);

      if (error) throw error;

      toast({
        title: 'Settings saved',
        description: 'Your notification preferences have been updated',
      });
    } catch (err) {
      console.error('Error saving preferences:', err);
      toast({
        title: 'Error',
        description: 'Failed to save preferences',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Email Notifications
        </CardTitle>
        <CardDescription>
          Configure when you want to receive email notifications
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="email-enabled" className="font-medium">
              Enable Email Notifications
            </Label>
            <p className="text-sm text-muted-foreground">
              Receive important updates via email
            </p>
          </div>
          <Switch
            id="email-enabled"
            checked={emailEnabled}
            onCheckedChange={(checked) => savePreferences(checked)}
            disabled={saving}
          />
        </div>

        {emailEnabled && (
          <>
            <div className="border-t pt-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                  <div className="space-y-0.5">
                    <Label htmlFor="deadline-reminders" className="font-medium">
                      Deadline Reminders
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Get notified 24-48 hours before application deadlines
                    </p>
                  </div>
                </div>
                <Switch
                  id="deadline-reminders"
                  checked={preferences.deadline_reminders}
                  onCheckedChange={(checked) =>
                    savePreferences(undefined, { deadline_reminders: checked })
                  }
                  disabled={saving}
                />
              </div>
            </div>

            <div className="border-t pt-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Briefcase className="h-5 w-5 text-muted-foreground" />
                  <div className="space-y-0.5">
                    <Label htmlFor="opportunity-matches" className="font-medium">
                      New Opportunity Matches
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Get notified when new jobs match your profile
                    </p>
                  </div>
                </div>
                <Switch
                  id="opportunity-matches"
                  checked={preferences.opportunity_matches}
                  onCheckedChange={(checked) =>
                    savePreferences(undefined, { opportunity_matches: checked })
                  }
                  disabled={saving}
                />
              </div>
            </div>
          </>
        )}

        <p className="text-xs text-muted-foreground pt-2">
          Note: Email notifications require the RESEND_API_KEY to be configured.
        </p>
      </CardContent>
    </Card>
  );
}
