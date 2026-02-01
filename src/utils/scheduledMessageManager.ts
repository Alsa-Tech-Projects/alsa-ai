// Scheduled Message Manager for ALSA AI
import { supabase } from '@/integrations/supabase/client';

export interface ScheduledMessage {
  id: string;
  user_id: string;
  platform: 'telegram' | 'whatsapp';
  contact_name: string;
  contact_value: string;
  message_content: string;
  scheduled_time: string;
  is_sent: boolean;
  is_cancelled: boolean;
  created_at: string;
  sent_at: string | null;
  error_message: string | null;
}

// Parse natural language for scheduled message
export const parseScheduledMessageFromText = (text: string): {
  platform: 'telegram' | 'whatsapp';
  contactName: string;
  message: string;
  scheduledTime: Date;
} | null => {
  const lowerText = text.toLowerCase();
  
  // Patterns for scheduled message detection
  // "send telegram message to Rahul at today 6:00 pm: are you ready for playing cricket"
  // "send whatsapp message to Mom tomorrow at 9 am: good morning"
  const patterns = [
    // Pattern: send [platform] message to [name] at [time]: [message]
    /send\s+(telegram|whatsapp)\s+(?:message|msg|massage)\s+to\s+(\w+)\s+(?:at\s+)?(.+?):\s*(.+)/i,
    // Pattern: [platform] message to [name] at [time]: [message]
    /(telegram|whatsapp)\s+(?:message|msg|massage)\s+to\s+(\w+)\s+(?:at\s+)?(.+?):\s*(.+)/i,
    // Pattern: schedule [platform] message to [name] for [time]: [message]
    /schedule\s+(telegram|whatsapp)\s+(?:message|msg|massage)\s+to\s+(\w+)\s+(?:for|at)\s+(.+?):\s*(.+)/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const platform = match[1].toLowerCase() as 'telegram' | 'whatsapp';
      const contactName = match[2].trim();
      const timeString = match[3].trim();
      const message = match[4].trim();
      
      const scheduledTime = parseScheduledTimeString(timeString);
      
      if (scheduledTime && scheduledTime > new Date()) {
        return { platform, contactName, message, scheduledTime };
      }
    }
  }

  return null;
};

// Parse time string for scheduling
export const parseScheduledTimeString = (timeStr: string): Date | null => {
  const now = new Date();
  const lowerTime = timeStr.toLowerCase().trim();

  // "today 6:00 pm", "today at 6pm"
  if (lowerTime.startsWith('today')) {
    const timeMatch = lowerTime.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i);
    if (timeMatch) {
      let hours = parseInt(timeMatch[1]);
      const minutes = parseInt(timeMatch[2] || '0');
      const meridian = timeMatch[3]?.toLowerCase();
      
      if (meridian === 'pm' && hours !== 12) hours += 12;
      if (meridian === 'am' && hours === 12) hours = 0;
      
      const result = new Date(now);
      result.setHours(hours, minutes, 0, 0);
      return result;
    }
  }

  // "tomorrow 6:00 pm", "tomorrow at 9am"
  if (lowerTime.startsWith('tomorrow')) {
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
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

  // Just time like "6:00 pm", "9am"
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
  const relativeMatch = lowerTime.match(/in\s+(\d+)\s*(minute|hour|day)s?/i);
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

// Create a scheduled message
export const createScheduledMessage = async (
  userId: string,
  platform: 'telegram' | 'whatsapp',
  contactName: string,
  contactValue: string,
  messageContent: string,
  scheduledTime: Date
): Promise<{ success: boolean; scheduledMessage?: ScheduledMessage; error?: string }> => {
  try {
    const { data, error } = await supabase
      .from('scheduled_messages')
      .insert({
        user_id: userId,
        platform,
        contact_name: contactName,
        contact_value: contactValue,
        message_content: messageContent,
        scheduled_time: scheduledTime.toISOString(),
        is_sent: false,
        is_cancelled: false
      })
      .select()
      .single();

    if (error) throw error;

    return { success: true, scheduledMessage: data as ScheduledMessage };
  } catch (error: any) {
    console.error('Error creating scheduled message:', error);
    return { success: false, error: error.message };
  }
};

// Get user's scheduled messages
export const getUserScheduledMessages = async (userId: string): Promise<ScheduledMessage[]> => {
  try {
    const { data, error } = await supabase
      .from('scheduled_messages')
      .select('*')
      .eq('user_id', userId)
      .eq('is_cancelled', false)
      .order('scheduled_time', { ascending: true });

    if (error) throw error;
    return (data || []) as ScheduledMessage[];
  } catch (error) {
    console.error('Error fetching scheduled messages:', error);
    return [];
  }
};

// Get pending scheduled messages that are due
export const getPendingScheduledMessages = async (userId: string): Promise<ScheduledMessage[]> => {
  try {
    const now = new Date();
    
    const { data, error } = await supabase
      .from('scheduled_messages')
      .select('*')
      .eq('user_id', userId)
      .eq('is_sent', false)
      .eq('is_cancelled', false)
      .lte('scheduled_time', now.toISOString())
      .order('scheduled_time', { ascending: true });

    if (error) throw error;
    return (data || []) as ScheduledMessage[];
  } catch (error) {
    console.error('Error fetching pending scheduled messages:', error);
    return [];
  }
};

// Mark scheduled message as sent
export const markScheduledMessageSent = async (messageId: string, error?: string): Promise<boolean> => {
  try {
    const updateData: any = {
      is_sent: true,
      sent_at: new Date().toISOString()
    };
    
    if (error) {
      updateData.error_message = error;
    }

    const { error: dbError } = await supabase
      .from('scheduled_messages')
      .update(updateData)
      .eq('id', messageId);

    return !dbError;
  } catch (error) {
    console.error('Error marking message as sent:', error);
    return false;
  }
};

// Cancel a scheduled message
export const cancelScheduledMessage = async (messageId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('scheduled_messages')
      .update({ is_cancelled: true })
      .eq('id', messageId);

    return !error;
  } catch (error) {
    console.error('Error cancelling scheduled message:', error);
    return false;
  }
};

// Delete a scheduled message
export const deleteScheduledMessage = async (messageId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('scheduled_messages')
      .delete()
      .eq('id', messageId);

    return !error;
  } catch (error) {
    console.error('Error deleting scheduled message:', error);
    return false;
  }
};

// Format scheduled time for display
export const formatScheduledTime = (isoString: string): string => {
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
