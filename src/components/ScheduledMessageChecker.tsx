import { useEffect, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { 
  getPendingScheduledMessages, 
  markScheduledMessageSent,
  formatScheduledTime
} from '@/utils/scheduledMessageManager';
import { sendTelegramMsg, sendWhatsAppMsg, checkBridgeConnection } from '@/utils/pcBridge';

interface ScheduledMessageCheckerProps {
  userId: string | null;
}

const ScheduledMessageChecker = ({ userId }: ScheduledMessageCheckerProps) => {
  const { toast } = useToast();
  const checkIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isProcessingRef = useRef(false);

  useEffect(() => {
    if (!userId) return;

    const checkAndSendPendingMessages = async () => {
      // Prevent concurrent processing
      if (isProcessingRef.current) return;
      isProcessingRef.current = true;

      try {
        // Check bridge connection first
        const bridgeStatus = await checkBridgeConnection();
        if (!bridgeStatus.connected) {
          isProcessingRef.current = false;
          return; // Bridge not connected, skip this cycle
        }

        // Get pending messages
        const pendingMessages = await getPendingScheduledMessages(userId);
        
        for (const msg of pendingMessages) {
          let result: { success: boolean; message?: string; error?: string };
          
          if (msg.platform === 'telegram') {
            result = await sendTelegramMsg(msg.contact_value, msg.message_content);
          } else {
            result = await sendWhatsAppMsg(msg.contact_value, msg.message_content);
          }

          // Mark as sent (with error if failed)
          await markScheduledMessageSent(msg.id, result.success ? undefined : (result.error || result.message));

          // Notify user
          if (result.success) {
            toast({
              title: `📤 Scheduled ${msg.platform === 'telegram' ? 'Telegram' : 'WhatsApp'} Sent`,
              description: `Message to ${msg.contact_name || msg.contact_value} was sent successfully!`
            });
          } else {
            toast({
              title: `❌ Scheduled Message Failed`,
              description: `Failed to send to ${msg.contact_name}: ${result.error || 'Unknown error'}`,
              variant: 'destructive'
            });
          }
        }
      } catch (error) {
        console.error('Error checking scheduled messages:', error);
      } finally {
        isProcessingRef.current = false;
      }
    };

    // Check immediately on mount
    checkAndSendPendingMessages();

    // Check every 30 seconds
    checkIntervalRef.current = setInterval(checkAndSendPendingMessages, 30000);

    return () => {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
    };
  }, [userId, toast]);

  // This component doesn't render anything visible
  return null;
};

export default ScheduledMessageChecker;
