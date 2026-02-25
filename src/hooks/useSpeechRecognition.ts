import { useState, useCallback, useRef, useEffect } from 'react';

export const useSpeechRecognition = () => {
  const [transcript, setTranscript] = useState('');
  const [isListening, setIsListening] = useState(false);
  const socketRef = useRef<WebSocket | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  const API_KEY = import.meta.env.VITE_DEEPGRAM_API_KEY;

  const stopListening = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
    }
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
    setIsListening(false);
  }, []);

  const startListening = useCallback(async () => {
    setTranscript('');
    setIsListening(true);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // CHANGE HERE: language=hi-IN hatakar detect_language=true lagaya hai
      const socket = new WebSocket(
        'wss://api.deepgram.com/v1/listen?model=nova-2&smart_format=true&detect_language=true&interim_results=true',
        ['token', API_KEY]
      );

      socket.onopen = () => {
        const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
        mediaRecorderRef.current = mediaRecorder;
        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0 && socket.readyState === 1) {
            socket.send(event.data);
          }
        };
        mediaRecorder.start(250);
      };

      socket.onmessage = (message) => {
        const data = JSON.parse(message.data);
        const receivedTranscript = data.channel?.alternatives[0]?.transcript;
        
        if (receivedTranscript) {
          // Ye usi lipi mein aayega jo Deepgram ne detect ki hai
          setTranscript(receivedTranscript);
        }
      };

      socketRef.current = socket;
    } catch (err) {
      console.error("Mic Error:", err);
      setIsListening(false);
    }
  }, [API_KEY]);

  // Export as useSpeechRecognition so Chat.tsx build doesn't fail
  return { transcript, isListening, startListening, stopListening, setTranscript };
};
      
