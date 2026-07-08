// On-device face authentication using @vladmandic/human
// Stores ONLY a 1024-float face embedding (descriptor) in localStorage.
// No images, no server, no upload. 100% privacy-first.

import Human, { type Config } from '@vladmandic/human';

const STORAGE_DESCRIPTOR_KEY = 'alsa_face_descriptor_v1';
const STORAGE_UNLOCK_KEY = 'alsa_face_unlocked_session';
const SIMILARITY_THRESHOLD = 0.55; // Human library: lower distance = closer match. Threshold ~0.55 is a good default.

let humanInstance: Human | null = null;

const baseConfig: Partial<Config> = {
  modelBasePath: 'https://cdn.jsdelivr.net/npm/@vladmandic/human/models/',
  warmup: 'face',
  cacheSensitivity: 0,
  face: {
    enabled: true,
    detector: { rotation: false, maxDetected: 1, minConfidence: 0.5, return: false },
    description: { enabled: true },
    iris: { enabled: false },
    emotion: { enabled: false },
    antispoof: { enabled: true },
    liveness: { enabled: true },
  },
  body: { enabled: false },
  hand: { enabled: false },
  gesture: { enabled: false },
  object: { enabled: false },
  segmentation: { enabled: false },
};

export const getHuman = async (): Promise<Human> => {
  if (humanInstance) return humanInstance;
  humanInstance = new Human(baseConfig);
  await humanInstance.load();
  await humanInstance.warmup();
  return humanInstance;
};

export const detectFaceDescriptor = async (
  source: HTMLVideoElement | HTMLCanvasElement | HTMLImageElement,
): Promise<{ descriptor: number[]; live: boolean; real: boolean } | null> => {
  const human = await getHuman();
  const result = await human.detect(source);
  const face = result?.face?.[0];
  if (!face || !face.embedding || face.embedding.length === 0) return null;
  return {
    descriptor: Array.from(face.embedding),
    live: (face.live ?? 1) > 0.5,
    real: (face.real ?? 1) > 0.5,
  };
};

export const enrollFace = (descriptor: number[]) => {
  localStorage.setItem(STORAGE_DESCRIPTOR_KEY, JSON.stringify(descriptor));
};

export const getEnrolledDescriptor = (): number[] | null => {
  const raw = localStorage.getItem(STORAGE_DESCRIPTOR_KEY);
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
};

export const clearEnrollment = () => {
  localStorage.removeItem(STORAGE_DESCRIPTOR_KEY);
  lockSession();
};

export const isEnrolled = (): boolean => !!getEnrolledDescriptor();

// Cosine-style distance via Human.match.distance equivalent.
const distance = (a: number[], b: number[]): number => {
  if (a.length !== b.length) return 1;
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    const d = a[i] - b[i];
    sum += d * d;
  }
  return Math.sqrt(sum) / Math.sqrt(a.length);
};

export const verifyAgainstEnrolled = (descriptor: number[]): { match: boolean; score: number } => {
  const enrolled = getEnrolledDescriptor();
  if (!enrolled) return { match: false, score: 1 };
  const d = distance(enrolled, descriptor);
  return { match: d < SIMILARITY_THRESHOLD, score: d };
};

export const unlockSession = () => {
  sessionStorage.setItem(STORAGE_UNLOCK_KEY, '1');
};

export const lockSession = () => {
  sessionStorage.removeItem(STORAGE_UNLOCK_KEY);
};

export const isSessionUnlocked = (): boolean =>
  sessionStorage.getItem(STORAGE_UNLOCK_KEY) === '1';

export const isFaceAuthEnabled = (): boolean =>
  localStorage.getItem('alsa_face_auth_enabled') === '1';

export const setFaceAuthEnabled = (enabled: boolean) => {
  localStorage.setItem('alsa_face_auth_enabled', enabled ? '1' : '0');
  if (!enabled) lockSession();
};

// ============ Backup password (required fallback) ============
const STORAGE_BACKUP_KEY = 'alsa_face_backup_pw_v1';

const sha256 = async (text: string): Promise<string> => {
  const buf = new TextEncoder().encode(text);
  const hash = await crypto.subtle.digest('SHA-256', buf);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
};

export const setBackupPassword = async (password: string): Promise<void> => {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const saltHex = Array.from(salt).map(b => b.toString(16).padStart(2, '0')).join('');
  const hash = await sha256(saltHex + ':' + password);
  localStorage.setItem(STORAGE_BACKUP_KEY, JSON.stringify({ salt: saltHex, hash }));
};

export const hasBackupPassword = (): boolean => !!localStorage.getItem(STORAGE_BACKUP_KEY);

export const verifyBackupPassword = async (password: string): Promise<boolean> => {
  const raw = localStorage.getItem(STORAGE_BACKUP_KEY);
  if (!raw) return false;
  try {
    const { salt, hash } = JSON.parse(raw);
    const check = await sha256(salt + ':' + password);
    return check === hash;
  } catch { return false; }
};

export const clearBackupPassword = () => localStorage.removeItem(STORAGE_BACKUP_KEY);
