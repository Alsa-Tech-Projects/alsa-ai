import { useState, useEffect, useCallback, useRef } from 'react';

export const useSpeechRecognition = (isAISpeaking: boolean = false) => {
  const [transcript, setTranscript] = useState('');
  const [isListening, setIsListening] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const manualStopRef = useRef(true);

  // Naye Supabase Project ka Edge Function URL
  // Isme apni naye project ki ID daal dena
  const EDGE_FUNCTION_URL = 'https://vzfkokgkwbvdxvfqzeko.supabase.co/functions/v1/transcribe';

  const processAudioChunk = async (audioBlob: Blob) => {
    try {
      const formData = new FormData();
      formData.append('file', audioBlob, 'recording.webm');

      // Direct HTTP request to your external Edge Function
      const response = await fetch(EDGE_FUNCTION_URL, {
        method: 'POST',
        body: formData,
        // --no-verify-jwt use kiya hai backend par, isliye Authorization header ki zaroorat nahi
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data?.text) {
        setTranscript((prev) => (prev ? prev + ' ' + data.text : data.text));
      }
    } catch (error) {
      console.error("Transcription error:", error);
    }
  };

  const startListening = useCallback(async () => {
    if (isAISpeaking) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      manualStopRef.current = false;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        
        setIsListening(false);
        stream.getTracks().forEach(track => track.stop());

        await processAudioChunk(audioBlob);

        if (!manualStopRef.current && !isAISpeaking) {
           startListening();
        }
      };

      mediaRecorder.start();
      setIsListening(true);
      console.log("Mic Started (MediaRecorder)...");
    } catch (err) {
      console.error("Mic access denied or failed:", err);
      setIsListening(false);
    }
  }, [isAISpeaking]);

  const stopListening = useCallback(() => {
    manualStopRef.current = true;
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  }, []);

  const resetTranscript = useCallback(() => {
    setTranscript('');
  }, []);

  useEffect(() => {
    if (isAISpeaking && isListening) {
      stopListening();
    }
  }, [isAISpeaking, isListening, stopListening]);

  return { transcript, isListening, startListening, stopListening, resetTranscript };
};
