import { useState, useEffect, useCallback, useRef } from 'react';

export const useSpeechRecognition = (isAISpeaking: boolean = false) => {
  const [transcript, setTranscript] = useState('');
  const [isListening, setIsListening] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const manualStopRef = useRef(true);
  
  // Refs for tracking audio levels and cleaning up
  const audioContextRef = useRef<AudioContext | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Supabase Edge Function URL
  const EDGE_FUNCTION_URL = 'https://vzfkokgkwbvdxvfqzeko.supabase.co/functions/v1/transcribe';

  const processAudioChunk = async (audioBlob: Blob) => {
    try {
      const formData = new FormData();
      formData.append('file', audioBlob, 'recording.webm');

      const response = await fetch(EDGE_FUNCTION_URL, {
        method: 'POST',
        body: formData,
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

      // --- Voice Activity Detection (VAD) Logic ---
      const audioContext = new window.AudioContext();
      audioContextRef.current = audioContext;
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.minDecibels = -50; // Threshold for silence
      source.connect(analyser);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      let hasSpoken = false;
      let silenceStart = Date.now();
      const SILENCE_TIMEOUT = 2500; // Wait 2.5 seconds of silence before processing

      const checkAudioLevel = () => {
        if (manualStopRef.current || mediaRecorder.state === 'inactive') return;

        analyser.getByteFrequencyData(dataArray);
        const averageVolume = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;

        if (averageVolume > 10) { 
          // User is actively speaking
          hasSpoken = true;
          silenceStart = Date.now(); // Reset silence timer
        } else {
          // User is silent
          if (hasSpoken && (Date.now() - silenceStart > SILENCE_TIMEOUT)) {
            // User spoke, and has now been silent for 2.5s -> Process it
            mediaRecorder.stop();
            return; // Stop checking until mic restarts
          }
        }
        
        animationFrameRef.current = requestAnimationFrame(checkAudioLevel);
      };

      checkAudioLevel(); // Start the volume monitoring loop
      // -------------------------------------------

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        
        setIsListening(false);
        stream.getTracks().forEach(track => track.stop());

        // Cleanup AudioContext
        if (audioContextRef.current?.state !== 'closed') {
          audioContextRef.current?.close();
        }
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }

        // Only send to Supabase if they actually said something
        if (hasSpoken) {
          await processAudioChunk(audioBlob);
        }

        // Auto-restart if not manually stopped and AI isn't speaking
        if (!manualStopRef.current && !isAISpeaking) {
           startListening();
        }
      };

      mediaRecorder.start();
      setIsListening(true);
      console.log("Mic Started (Waiting for speech)...");
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
    if (audioContextRef.current?.state !== 'closed') {
      audioContextRef.current?.close();
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
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
