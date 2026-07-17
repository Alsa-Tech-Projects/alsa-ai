import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
export const useSpeechRecognition = (isAISpeaking: boolean = false) => {
  const [transcript, setTranscript] = useState('');
  const [isListening, setIsListening] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const manualStopRef = useRef(true);

  // Audio ko Supabase Edge Function bhej kar transcript laane ka function
  const processAudioChunk = async (audioBlob: Blob) => {
    try {
      const formData = new FormData();
      // Whisper ko webm format chal jata hai
      formData.append('file', audioBlob, 'recording.webm');

      // 'transcribe' naam ka function hum Supabase mein banayenge
      const { data, error } = await supabase.functions.invoke('transcribe', {
        body: formData,
      });

      if (error) throw error;
      
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
      // Mic ki permission lena aur stream start karna
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      manualStopRef.current = false;

      // Jab user bol raha ho tab data chunks save karna
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      // Jab recording stop ho, tab audio process karna
      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        
        setIsListening(false);
        // Tracks stop karna zaroori hai warna browser tab mein red dot dikhta rahega
        stream.getTracks().forEach(track => track.stop());

        // Audio backend par bhej do
        await processAudioChunk(audioBlob);

        // Agar manual stop nahi kiya tha (yani continuous flow chahiye tha), toh wapas start karo
        // (Dhyan rakhna Whisper ke sath continuous thoda slow feel ho sakta hai browser api ke comparison mein)
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

  // Handle AI speaking interruption
  useEffect(() => {
    if (isAISpeaking && isListening) {
      stopListening();
    }
  }, [isAISpeaking, isListening, stopListening]);

  return { transcript, isListening, startListening, stopListening, resetTranscript };
};
