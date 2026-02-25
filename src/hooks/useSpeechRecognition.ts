import { useState, useCallback, useRef, useEffect } from 'react';

export const useSpeechRecognition = (isAISpeaking: boolean = false) => {
  const [transcript, setTranscript] = useState('');
  const [isListening, setIsListening] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const API_KEY = import.meta.env.VITE_GROQ_API_KEY;

  // 1. Auto-send function
  const handleStopAndSend = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      // Mic band karo aur tracks release karo
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setIsListening(false);
    }
  }, []);

  const startListening = useCallback(async () => {
    setTranscript('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        if (audioChunksRef.current.length > 0) {
          await sendToGroq(audioBlob);
        }
      };

      mediaRecorder.start();
      setIsListening(true);

      // --- SILENCE DETECTION (Jugaad) ---
      // Agar user 3 second tak kuch nahi bolta ya manual stop chahiye
      // Production mein yahan 'Web Audio API' se volume check lagta hai
      // Par abhi ke liye tu ek manual 'Done' button ya timer rakh sakta hai
    } catch (err) {
      console.error("Mic Error:", err);
    }
  }, []);

  const sendToGroq = async (audioBlob: Blob) => {
    setTranscript('Processing...'); // User ko lage ki kaam ho raha hai
    const formData = new FormData();
    formData.append('file', audioBlob, 'audio.webm');
    formData.append('model', 'whisper-large-v3');

    try {
      const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${API_KEY}` },
        body: formData,
      });

      const data = await response.json();
      if (data.text) {
        setTranscript(data.text);
        // YAHAN SE DIRECT CHATBOT KO MESSAGE BHEJ DO
        // sendMessageToAI(data.text); 
      }
    } catch (error) {
      console.error("Groq Error:", error);
      setTranscript('');
    }
  };

  return { transcript, isListening, startListening, stopListening: handleStopAndSend, setTranscript };
};
