import { useState, useCallback, useRef, useEffect } from 'react';

export const useSpeechRecognition = (isAISpeaking: boolean = false) => {
  const [transcript, setTranscript] = useState('');
  const [isListening, setIsListening] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const isAISpeakingRef = useRef(isAISpeaking);

  // Vite specific way to get env variables
  const API_KEY = import.meta.env.VITE_GROQ_API_KEY;

  useEffect(() => {
    isAISpeakingRef.current = isAISpeaking;
    if (isAISpeaking && isListening) {
      stopListening();
    }
  }, [isAISpeaking, isListening]);

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
    } catch (err) {
      console.error("Mic Access Error:", err);
    }
  }, []);

  const stopListening = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
    setIsListening(false);
  }, []);

  const sendToGroq = async (audioBlob: Blob) => {
    if (!API_KEY) {
      console.error("VITE_GROQ_API_KEY is missing!");
      return;
    }

    const formData = new FormData();
    formData.append('file', audioBlob, 'audio.webm');
    formData.append('model', 'whisper-large-v3');

    try {
      const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
        },
        body: formData,
      });

      const data = await response.json();
      if (data.text) {
        setTranscript(data.text);
      }
    } catch (error) {
      console.error("Groq API Error:", error);
    }
  };

  return { transcript, isListening, startListening, stopListening, setTranscript };
};
  
