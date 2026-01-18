// Reminder Management System for ALSA AI
import { supabase } from '@/integrations/supabase/client';

export interface Reminder {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  reminder_time: string;
  is_completed: boolean;
  is_notified: boolean;
  created_at: string;
  updated_at: string;
}

// Alarm sound path
export const ALARM_SOUND_PATH = '/sounds/alarm.wav';

// Parse natural language for reminder
export const parseReminderFromText = (text: string): { title: string; time: Date; description?: string } | null => {
  const lowerText = text.toLowerCase();
  
  // Patterns for reminder detection
  const reminderPatterns = [
    /remind me (?:to |about )?(.+?) (?:at |on |tomorrow at |in )(.+)/i,
    /set (?:a )?reminder (?:for |to )?(.+?) (?:at |on |tomorrow at )(.+)/i,
    /(?:i have|there is) (?:a |an )?(.+?) (?:at |on |tomorrow at )(.+)/i,
    /reminder:? (.+?) (?:at |on |tomorrow at )(.+)/i,
  ];

  for (const pattern of reminderPatterns) {
    const match = text.match(pattern);
    if (match) {
      const title = match[1].trim();
      const timeString = match[2].trim();
      const reminderTime = parseTimeString(timeString);
      
      if (reminderTime) {
        return { title, time: reminderTime };
      }
    }
  }

  return null;
};

// Parse time string to Date
const parseTimeString = (timeStr: string): Date | null => {
  const now = new Date();
  const lowerTime = timeStr.toLowerCase();

  // Tomorrow patterns
  if (lowerTime.includes('tomorrow')) {
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Extract time from "tomorrow at 11 pm"
    const timeMatch = lowerTime.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i);
    if (timeMatch) {
      let hours = parseInt(timeMatch[1]);
      const minutes = parseInt(timeMatch[2] || '0');
      const meridian = timeMatch[3]?.toLowerCase();
      
      if (meridian === 'pm' && hours !== 12) hours += 12;
      if (meridian === 'am' && hours === 12) hours = 0;
      
      tomorrow.setHours(hours, minutes, 0, 0);
      return tomorrow;
    }
    
    // Default to 9 AM tomorrow
    tomorrow.setHours(9, 0, 0, 0);
    return tomorrow;
  }

  // Today time patterns like "11 pm", "3:30 pm", "15:00"
  const timeMatch = lowerTime.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i);
  if (timeMatch) {
    let hours = parseInt(timeMatch[1]);
    const minutes = parseInt(timeMatch[2] || '0');
    const meridian = timeMatch[3]?.toLowerCase();
    
    if (meridian === 'pm' && hours !== 12) hours += 12;
    if (meridian === 'am' && hours === 12) hours = 0;
    
    const result = new Date(now);
    result.setHours(hours, minutes, 0, 0);
    
    // If time has passed today, set for tomorrow
    if (result <= now) {
      result.setDate(result.getDate() + 1);
    }
    
    return result;
  }

  // Relative time: "in 30 minutes", "in 2 hours"
  const relativeMatch = lowerTime.match(/in (\d+)\s*(minute|hour|day)s?/i);
  if (relativeMatch) {
    const amount = parseInt(relativeMatch[1]);
    const unit = relativeMatch[2].toLowerCase();
    const result = new Date(now);
    
    if (unit === 'minute') result.setMinutes(result.getMinutes() + amount);
    if (unit === 'hour') result.setHours(result.getHours() + amount);
    if (unit === 'day') result.setDate(result.getDate() + amount);
    
    return result;
  }

  return null;
};

// Create a new reminder
export const createReminder = async (
  userId: string,
  title: string,
  reminderTime: Date,
  description?: string
): Promise<{ success: boolean; reminder?: Reminder; error?: string }> => {
  try {
    const { data, error } = await supabase
      .from('reminders')
      .insert({
        user_id: userId,
        title,
        description: description || null,
        reminder_time: reminderTime.toISOString(),
        is_completed: false,
        is_notified: false
      })
      .select()
      .single();

    if (error) throw error;

    return { success: true, reminder: data as Reminder };
  } catch (error: any) {
    console.error('Error creating reminder:', error);
    return { success: false, error: error.message };
  }
};

// Get user's reminders
export const getUserReminders = async (userId: string): Promise<Reminder[]> => {
  try {
    const { data, error } = await supabase
      .from('reminders')
      .select('*')
      .eq('user_id', userId)
      .eq('is_completed', false)
      .order('reminder_time', { ascending: true });

    if (error) throw error;
    return (data || []) as Reminder[];
  } catch (error) {
    console.error('Error fetching reminders:', error);
    return [];
  }
};

// Mark reminder as completed
export const completeReminder = async (reminderId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('reminders')
      .update({ is_completed: true })
      .eq('id', reminderId);

    return !error;
  } catch (error) {
    console.error('Error completing reminder:', error);
    return false;
  }
};

// Mark reminder as notified
export const markReminderNotified = async (reminderId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('reminders')
      .update({ is_notified: true })
      .eq('id', reminderId);

    return !error;
  } catch (error) {
    console.error('Error marking reminder notified:', error);
    return false;
  }
};

// Delete a reminder
export const deleteReminder = async (reminderId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('reminders')
      .delete()
      .eq('id', reminderId);

    return !error;
  } catch (error) {
    console.error('Error deleting reminder:', error);
    return false;
  }
};

// Play alarm sound
export const playAlarmSound = () => {
  const audio = new Audio(ALARM_SOUND_PATH);
  audio.loop = true;
  audio.play().catch(console.error);
  return audio;
};

// Check for due reminders and trigger notifications
export const checkDueReminders = async (userId: string): Promise<Reminder[]> => {
  try {
    const now = new Date();
    const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);

    const { data, error } = await supabase
      .from('reminders')
      .select('*')
      .eq('user_id', userId)
      .eq('is_completed', false)
      .lte('reminder_time', oneHourLater.toISOString())
      .order('reminder_time', { ascending: true });

    if (error) throw error;
    return (data || []) as Reminder[];
  } catch (error) {
    console.error('Error checking due reminders:', error);
    return [];
  }
};

// Format reminder time for display
export const formatReminderTime = (isoString: string): string => {
  const date = new Date(isoString);
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const isToday = date.toDateString() === now.toDateString();
  const isTomorrow = date.toDateString() === tomorrow.toDateString();

  const timeStr = date.toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit', 
    hour12: true 
  });

  if (isToday) return `Today at ${timeStr}`;
  if (isTomorrow) return `Tomorrow at ${timeStr}`;
  
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric', 
    hour: 'numeric', 
    minute: '2-digit', 
    hour12: true 
  });
};
