// Screen Recording Utility

export interface RecordingOptions {
  duration?: number; // Duration in seconds
  onComplete?: (blob: Blob) => void;
  onProgress?: (elapsed: number, total: number) => void;
}

let mediaRecorder: MediaRecorder | null = null;
let recordedChunks: Blob[] = [];
let recordingTimer: NodeJS.Timeout | null = null;

export async function startScreenRecording(options: RecordingOptions = {}): Promise<{ success: boolean; message: string }> {
  try {
    // Request screen capture permission
    const stream = await navigator.mediaDevices.getDisplayMedia({
      video: {
        displaySurface: 'monitor',
      },
      audio: true,
    });

    recordedChunks = [];
    
    // Create MediaRecorder
    const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9') 
      ? 'video/webm;codecs=vp9' 
      : 'video/webm';
    
    mediaRecorder = new MediaRecorder(stream, { mimeType });

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        recordedChunks.push(event.data);
      }
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(recordedChunks, { type: 'video/webm' });
      
      // Stop all tracks
      stream.getTracks().forEach(track => track.stop());
      
      if (options.onComplete) {
        options.onComplete(blob);
      } else {
        // Default: Download the video
        downloadRecording(blob);
      }
    };

    // Start recording
    mediaRecorder.start(1000); // Collect data every second

    // Set up duration timer if specified
    if (options.duration) {
      let elapsed = 0;
      recordingTimer = setInterval(() => {
        elapsed++;
        if (options.onProgress) {
          options.onProgress(elapsed, options.duration!);
        }
        if (elapsed >= options.duration!) {
          stopScreenRecording();
        }
      }, 1000);
    }

    return { success: true, message: `Screen recording started${options.duration ? ` for ${options.duration} seconds` : ''}` };
  } catch (error) {
    console.error('Screen recording error:', error);
    return { success: false, message: 'Failed to start screen recording. Please grant permission.' };
  }
}

export function stopScreenRecording(): { success: boolean; message: string } {
  if (recordingTimer) {
    clearInterval(recordingTimer);
    recordingTimer = null;
  }

  if (mediaRecorder && mediaRecorder.state !== 'inactive') {
    mediaRecorder.stop();
    return { success: true, message: 'Screen recording stopped. Saving video...' };
  }

  return { success: false, message: 'No recording in progress' };
}

export function isRecording(): boolean {
  return mediaRecorder !== null && mediaRecorder.state === 'recording';
}

function downloadRecording(blob: Blob) {
  const url = URL.createObjectURL(blob);
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const a = document.createElement('a');
  a.href = url;
  a.download = `screen-recording-${timestamp}.webm`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Parse recording request from natural language
export function parseRecordingRequest(text: string): { duration?: number } | null {
  const patterns = [
    /(?:record|recording|capture)\s+(?:screen|video)\s+(?:for\s+)?(\d+)\s*(?:minutes?|mins?)/i,
    /(?:record|recording|capture)\s+(?:screen|video)\s+(?:for\s+)?(\d+)\s*(?:seconds?|secs?)/i,
    /(\d+)\s*(?:minutes?|mins?)\s+(?:screen\s+)?(?:record|recording)/i,
    /(\d+)\s*(?:seconds?|secs?)\s+(?:screen\s+)?(?:record|recording)/i,
    /(?:start\s+)?(?:screen\s+)?(?:record|recording)/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      if (match[1]) {
        const value = parseInt(match[1]);
        // Check if minutes or seconds
        if (text.includes('minute') || text.includes('min')) {
          return { duration: value * 60 };
        }
        return { duration: value };
      }
      return {}; // Start recording without duration
    }
  }

  return null;
}

export default { startScreenRecording, stopScreenRecording, isRecording, parseRecordingRequest };