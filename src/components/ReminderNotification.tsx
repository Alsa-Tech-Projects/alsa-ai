import { useState, useEffect, useRef } from 'react';
import { Bell, X, Check, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Reminder, 
  checkDueReminders, 
  completeReminder, 
  markReminderNotified,
  playAlarmSound,
  formatReminderTime
} from '@/utils/reminderManager';

interface ReminderNotificationProps {
  userId: string | null;
}

const ReminderNotification = ({ userId }: ReminderNotificationProps) => {
  const [dueReminders, setDueReminders] = useState<Reminder[]>([]);
  const [activeReminder, setActiveReminder] = useState<Reminder | null>(null);
  const [isAlarmPlaying, setIsAlarmPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const checkIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Check for due reminders every minute
  useEffect(() => {
    if (!userId) return;

    const checkReminders = async () => {
      const reminders = await checkDueReminders(userId);
      const now = new Date();
      
      // Find reminders that are due now (within 1 minute) and not yet notified
      const dueNow = reminders.filter(r => {
        const reminderTime = new Date(r.reminder_time);
        const diff = Math.abs(now.getTime() - reminderTime.getTime());
        return diff <= 60000 && !r.is_notified; // Within 1 minute and not notified
      });

      // Find reminders coming up in the next hour for notification
      const upcomingReminders = reminders.filter(r => {
        const reminderTime = new Date(r.reminder_time);
        const diff = reminderTime.getTime() - now.getTime();
        return diff > 0 && diff <= 3600000 && !r.is_notified; // 1 hour before
      });

      setDueReminders(upcomingReminders);

      // Trigger alarm for due reminders
      if (dueNow.length > 0 && !isAlarmPlaying) {
        const firstDue = dueNow[0];
        setActiveReminder(firstDue);
        setIsAlarmPlaying(true);
        audioRef.current = playAlarmSound();
        
        // Send browser notification if permitted
        if (Notification.permission === 'granted') {
          new Notification('ALSA AI Reminder', {
            body: firstDue.title,
            icon: '/Alsa-Ai-Logo.png',
            tag: firstDue.id
          });
        }

        // Mark as notified
        await markReminderNotified(firstDue.id);
      }
    };

    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    checkReminders();
    checkIntervalRef.current = setInterval(checkReminders, 30000); // Check every 30 seconds

    return () => {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, [userId, isAlarmPlaying]);

  const handleDismiss = async () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setIsAlarmPlaying(false);
    setActiveReminder(null);
  };

  const handleComplete = async () => {
    if (activeReminder) {
      await completeReminder(activeReminder.id);
    }
    handleDismiss();
  };

  const handleSnooze = () => {
    // Snooze for 10 minutes
    handleDismiss();
    setTimeout(() => {
      if (activeReminder) {
        setActiveReminder(activeReminder);
        setIsAlarmPlaying(true);
        audioRef.current = playAlarmSound();
      }
    }, 10 * 60 * 1000);
  };

  return (
    <>
      {/* Upcoming reminders indicator */}
      {dueReminders.length > 0 && !activeReminder && (
        <div className="fixed top-4 right-4 z-50 bg-gradient-to-r from-amber-500 to-orange-500 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2 animate-pulse">
          <Bell className="w-4 h-4" />
          <span className="text-sm font-medium">
            {dueReminders.length} reminder{dueReminders.length > 1 ? 's' : ''} coming up
          </span>
        </div>
      )}

      {/* Alarm Dialog */}
      <Dialog open={!!activeReminder} onOpenChange={() => handleDismiss()}>
        <DialogContent className="bg-gradient-to-br from-slate-900 to-slate-950 border-amber-500/50 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-amber-400">
              <div className="w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center animate-bounce">
                <Bell className="w-6 h-6 text-amber-400" />
              </div>
              <span className="text-2xl">Reminder!</span>
            </DialogTitle>
          </DialogHeader>
          
          <div className="py-6">
            <h2 className="text-xl font-bold text-white mb-2">{activeReminder?.title}</h2>
            {activeReminder?.description && (
              <p className="text-white/70">{activeReminder.description}</p>
            )}
            <div className="flex items-center gap-2 mt-4 text-white/50">
              <Clock className="w-4 h-4" />
              <span className="text-sm">
                {activeReminder && formatReminderTime(activeReminder.reminder_time)}
              </span>
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              onClick={handleSnooze}
              variant="outline"
              className="flex-1 border-white/20 hover:bg-white/10"
            >
              <Clock className="w-4 h-4 mr-2" />
              Snooze 10m
            </Button>
            <Button
              onClick={handleComplete}
              className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600"
            >
              <Check className="w-4 h-4 mr-2" />
              Done
            </Button>
            <Button
              onClick={handleDismiss}
              variant="ghost"
              size="icon"
              className="text-white/50 hover:text-white"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ReminderNotification;
