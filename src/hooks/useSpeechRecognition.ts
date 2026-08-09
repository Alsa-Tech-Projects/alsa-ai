import { useState, useCallback, useRef, useEffect } from 'react';

/**
 * Fast streaming-ish speech recognition:
 *  - Web Audio se raw PCM capture (MediaRecorder ke fragmented blobs se bachne ke liye)
 *  - 2.5s silence = sentence complete -> chunk turant WAV bana ke transcribe pe bheja jaata hai
 *  - Mic band nahi hota, background me hi agla chunk record hota rehta hai (fast feel)
 */

const EDGE_FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/transcribe`;

const TARGET_SR = 16000;
const SILENCE_MS = 1200;      // user 1.2s chup = sentence complete (fast auto-send)
const SILENCE_RMS = 0.012;    // silence threshold
const MAX_CHUNK_MS = 15000;   // safety flush


function downsample(buffer: Float32Array, inRate: number, outRate: number): Float32Array {
  if (outRate >= inRate) return buffer;
  const ratio = inRate / outRate;
  const out = new Float32Array(Math.floor(buffer.length / ratio));
  for (let i = 0; i < out.length; i++) out[i] = buffer[Math.floor(i * ratio)];
  return out;
}

function encodeWav(chunks: Float32Array[], sampleRate: number): Blob {
  const len = chunks.reduce((a, c) => a + c.length, 0);
  const merged = new Float32Array(len);
  let off = 0;
  for (const c of chunks) { merged.set(c, off); off += c.length; }
  const pcm = downsample(merged, sampleRate, TARGET_SR);

  const buffer = new ArrayBuffer(44 + pcm.length * 2);
  const view = new DataView(buffer);
  const w = (o: number, s: string) => { for (let i = 0; i < s.length; i++) view.setUint8(o + i, s.charCodeAt(i)); };
  w(0, 'RIFF');
  view.setUint32(4, 36 + pcm.length * 2, true);
  w(8, 'WAVE'); w(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, TARGET_SR, true);
  view.setUint32(28, TARGET_SR * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  w(36, 'data');
  view.setUint32(40, pcm.length * 2, true);
  let p = 44;
  for (let i = 0; i < pcm.length; i++, p += 2) {
    const s = Math.max(-1, Math.min(1, pcm[i]));
    view.setInt16(p, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }
  return new Blob([buffer], { type: 'audio/wav' });
}

export const useSpeechRecognition = (isAISpeaking: boolean = false) => {
  const [transcript, setTranscript] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const streamRef = useRef<MediaStream | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);
  const nodeRef = useRef<ScriptProcessorNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);

  const chunksRef = useRef<Float32Array[]>([]);
  const hasVoiceRef = useRef(false);
  const lastVoiceAtRef = useRef(0);
  const chunkStartRef = useRef(0);
  const flushingRef = useRef(false);
  const pendingFlushRef = useRef<Float32Array[]>([]);
  const flushRef = useRef<() => void>(() => undefined);

  const transcribe = useCallback(async (blob: Blob) => {
    if (blob.size < 3000) return;
    try {
      const fd = new FormData();
      fd.append('file', blob, 'recording.wav');
      const anon = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      const res = await fetch(EDGE_FUNCTION_URL, {
        method: 'POST',
        headers: anon ? { apikey: anon, Authorization: `Bearer ${anon}` } : undefined,
        body: fd,
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();
      const text = (data?.text || '').trim();
      if (text) setTranscript((prev) => (prev ? prev + ' ' + text : text));
    } catch (e: any) {
      console.error('Transcription error:', e);
      setError(e?.message || 'Transcription failed');
    }
  }, []);

  const flush = useCallback(() => {
    const chunks = chunksRef.current;
    chunksRef.current = [];
    hasVoiceRef.current = false;
    chunkStartRef.current = Date.now();
    if (!chunks.length) return;

    // Agar pichla upload abhi chal raha hai to nayi speech ko lose mat karo.
    // Pichle implementation me yahi chunk manual mic off tak atka rehta tha.
    if (flushingRef.current) {
      pendingFlushRef.current.push(...chunks);
      return;
    }

    flushingRef.current = true;
    const sr = ctxRef.current?.sampleRate || 48000;
    const blob = encodeWav(chunks, sr);
    // Recording chalu rehti hai; queued utterance previous request ke baad turant jaati hai.
    transcribe(blob).finally(() => {
      flushingRef.current = false;
      if (pendingFlushRef.current.length) {
        chunksRef.current = pendingFlushRef.current;
        pendingFlushRef.current = [];
        hasVoiceRef.current = true;
        flushRef.current();
      }
    });
  }, [transcribe]);
  flushRef.current = flush;

  const stopListening = useCallback(() => {
    try { nodeRef.current?.disconnect(); } catch {}
    try { sourceRef.current?.disconnect(); } catch {}
    try { streamRef.current?.getTracks().forEach((t) => t.stop()); } catch {}
    try { ctxRef.current?.close(); } catch {}
    nodeRef.current = null;
    sourceRef.current = null;
    streamRef.current = null;
    setIsListening(false);
    // last chunk bhi bhejo
    if (chunksRef.current.length && hasVoiceRef.current) {
      const sr = ctxRef.current?.sampleRate || 48000;
      const blob = encodeWav(chunksRef.current, sr);
      chunksRef.current = [];
      transcribe(blob);
    }
    chunksRef.current = [];
    pendingFlushRef.current = [];
    ctxRef.current = null;
  }, [transcribe]);

  const startListening = useCallback(async () => {
    if (isListening) return;
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });
      streamRef.current = stream;

      const AC: typeof AudioContext =
        (window as any).AudioContext || (window as any).webkitAudioContext;
      const ctx = new AC();
      if (ctx.state === 'suspended') await ctx.resume();
      ctxRef.current = ctx;

      const source = ctx.createMediaStreamSource(stream);
      const node = ctx.createScriptProcessor(4096, 1, 1);
      sourceRef.current = source;
      nodeRef.current = node;

      chunksRef.current = [];
      pendingFlushRef.current = [];
      hasVoiceRef.current = false;
      chunkStartRef.current = Date.now();
      lastVoiceAtRef.current = Date.now();

      node.onaudioprocess = (e) => {
        const input = e.inputBuffer.getChannelData(0);
        chunksRef.current.push(new Float32Array(input));

        let sum = 0;
        for (let i = 0; i < input.length; i++) sum += input[i] * input[i];
        const rms = Math.sqrt(sum / input.length);
        const now = Date.now();

        if (rms > SILENCE_RMS) {
          hasVoiceRef.current = true;
          lastVoiceAtRef.current = now;
        }

        const silentFor = now - lastVoiceAtRef.current;
        const chunkLen = now - chunkStartRef.current;

        if (hasVoiceRef.current && silentFor >= SILENCE_MS) {
          flush();
        } else if (hasVoiceRef.current && chunkLen >= MAX_CHUNK_MS) {
          flush();
        } else if (!hasVoiceRef.current && chunkLen > SILENCE_MS) {
          // sirf silence — buffer khaali karo taaki memory na bhare
          chunksRef.current = [];
          chunkStartRef.current = now;
        }
      };

      source.connect(node);
      node.connect(ctx.destination);
      setIsListening(true);
    } catch (err: any) {
      console.error('Mic access failed:', err);
      setError(err?.message || 'Microphone access denied');
      setIsListening(false);
    }
  }, [isListening, flush]);

  const resetTranscript = useCallback(() => setTranscript(''), []);

  // AI bol raha ho to mic band (echo se bachne ke liye)
  useEffect(() => {
    if (isAISpeaking && isListening) stopListening();
  }, [isAISpeaking, isListening, stopListening]);

  useEffect(() => () => { stopListening(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    transcript,
    isListening,
    listening: isListening,
    error,
    startListening,
    stopListening,
    resetTranscript,
  };
};
