import { useEffect, useRef, useState } from 'react';
import { ShieldCheck, Camera, Trash2, Loader2, CheckCircle2, XCircle, KeyRound, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import {
  detectFaceDescriptor,
  enrollFace,
  verifyAgainstEnrolled,
  isEnrolled,
  isFaceAuthEnabled,
  setFaceAuthEnabled,
  clearEnrollment,
  unlockSession,
  isSessionUnlocked,
  setBackupPassword,
  hasBackupPassword,
  verifyBackupPassword,
  clearBackupPassword,
} from '@/utils/faceAuth';

type Mode = 'enroll' | 'verify';

interface Props {
  onSuccess?: () => void;
  forceMode?: Mode;
}

const FaceAuth = ({ onSuccess, forceMode }: Props) => {
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [mode, setMode] = useState<Mode>(forceMode || (isEnrolled() ? 'verify' : 'enroll'));
  const [status, setStatus] = useState<'idle' | 'starting' | 'ready' | 'scanning' | 'success' | 'failed'>('idle');
  const [scoreInfo, setScoreInfo] = useState<string>('');

  // Backup password state
  const [backupPw, setBackupPw] = useState('');
  const [backupPw2, setBackupPw2] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [showBackupFallback, setShowBackupFallback] = useState(false);
  const [verifyingPw, setVerifyingPw] = useState(false);

  const startCamera = async () => {
    setStatus('starting');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setStatus('ready');
    } catch (e: any) {
      toast({ title: 'Camera error', description: e?.message || 'Camera access denied', variant: 'destructive' });
      setStatus('failed');
    }
  };

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
  };

  useEffect(() => {
    startCamera();
    return () => stopCamera();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const finalizeEnrollment = async (descriptor: number[]) => {
    // Require backup password before completing enrollment
    if (!/^\d{4}$/.test(backupPw)) {
      toast({ title: 'Backup PIN required', description: 'Enter a 4-digit PIN before enrolling.', variant: 'destructive' });
      setStatus('ready');
      return;
    }
    if (backupPw !== backupPw2) {
      toast({ title: 'PINs do not match', description: 'Please re-enter the same 4-digit PIN.', variant: 'destructive' });
      setStatus('ready');
      return;
    }
    await setBackupPassword(backupPw);
    enrollFace(descriptor);
    setFaceAuthEnabled(true);
    unlockSession();
    setStatus('success');
    setScoreInfo('Enrolled successfully');
    toast({ title: 'Face enrolled', description: 'Backup PIN also saved. You can use it if face detection fails.' });
    setTimeout(() => onSuccess?.(), 600);
  };

  const captureAndProcess = async () => {
    if (!videoRef.current || status !== 'ready') return;

    // Pre-check for enrollment: ensure backup PIN is provided BEFORE starting scan
    if (mode === 'enroll') {
      if (!/^\d{4}$/.test(backupPw)) {
        toast({ title: 'Backup PIN required', description: 'Set a 4-digit PIN before enrolling.', variant: 'destructive' });
        return;
      }
      if (backupPw !== backupPw2) {
        toast({ title: 'PINs do not match', description: 'Please re-enter the same 4-digit PIN.', variant: 'destructive' });
        return;
      }
    }

    setStatus('scanning');
    setScoreInfo('Loading model & analysing face…');
    try {
      const result = await detectFaceDescriptor(videoRef.current);
      if (!result) {
        toast({ title: 'No face detected', description: 'Please face the camera clearly in good lighting.', variant: 'destructive' });
        setStatus('ready');
        return;
      }
      if (!result.live || !result.real) {
        toast({ title: 'Liveness check failed', description: 'Spoof detected. Please use a real face.', variant: 'destructive' });
        setStatus('ready');
        return;
      }

      if (mode === 'enroll') {
        await finalizeEnrollment(result.descriptor);
      } else {
        const { match, score } = verifyAgainstEnrolled(result.descriptor);
        setScoreInfo(`Distance: ${score.toFixed(3)} (lower = closer)`);
        if (match) {
          unlockSession();
          setStatus('success');
          toast({ title: 'Verified', description: 'Welcome back.' });
          setTimeout(() => onSuccess?.(), 600);
        } else {
          setStatus('failed');
          toast({ title: 'Face did not match', description: 'Try again with better lighting or use your backup PIN.', variant: 'destructive' });
          setTimeout(() => setStatus('ready'), 1500);
        }
      }
    } catch (e: any) {
      console.error(e);
      toast({ title: 'Authentication error', description: e?.message || 'Unknown error', variant: 'destructive' });
      setStatus('ready');
    }
  };

  const handleBackupVerify = async () => {
    if (!/^\d{4}$/.test(backupPw)) {
      toast({ title: 'Enter PIN', description: 'Please enter your 4-digit backup PIN.', variant: 'destructive' });
      return;
    }
    setVerifyingPw(true);
    const ok = await verifyBackupPassword(backupPw);
    setVerifyingPw(false);
    if (ok) {
      unlockSession();
      setStatus('success');
      toast({ title: 'Verified with backup PIN', description: 'Welcome back.' });
      setTimeout(() => onSuccess?.(), 500);
    } else {
      toast({ title: 'Wrong PIN', description: 'Backup PIN is incorrect.', variant: 'destructive' });
    }
  };

  return (
    <Card className="bg-card border-border max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-primary" />
          {mode === 'enroll' ? 'Enroll Your Face' : 'Face Authentication'}
        </CardTitle>
        <CardDescription>
          {mode === 'enroll'
            ? 'One-time setup. Your face descriptor stays on this device only — no upload. A 4-digit backup PIN is required as a fallback.'
            : 'Look at the camera to unlock the assistant. Use the backup PIN if face detection fails.'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!showBackupFallback && (
          <div className="relative aspect-[4/3] w-full bg-black rounded-xl overflow-hidden border border-border">
            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover scale-x-[-1]" />
            {status === 'success' && (
              <div className="absolute inset-0 bg-green-500/20 flex items-center justify-center">
                <CheckCircle2 className="w-20 h-20 text-green-400" />
              </div>
            )}
            {status === 'failed' && mode === 'verify' && (
              <div className="absolute inset-0 bg-red-500/20 flex items-center justify-center">
                <XCircle className="w-20 h-20 text-red-400" />
              </div>
            )}
          </div>
        )}

        {scoreInfo && !showBackupFallback && (
          <p className="text-xs text-muted-foreground text-center">{scoreInfo}</p>
        )}

        {/* Enroll: backup PIN setup */}
        {mode === 'enroll' && (
          <div className="space-y-2 rounded-lg border border-border p-3 bg-muted/30">
            <Label className="text-xs flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5" /> Backup 4-digit PIN (required)
            </Label>
            <div className="relative">
              <Input
                type={showPw ? 'text' : 'password'}
                inputMode="numeric"
                pattern="\d{4}"
                maxLength={4}
                placeholder="4-digit PIN"
                value={backupPw}
                onChange={(e) => setBackupPw(e.target.value.replace(/\D/g, '').slice(0, 4))}
                className="pr-9 tracking-[0.5em] text-center"
              />
              <button
                type="button"
                onClick={() => setShowPw(v => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground"
                aria-label="Toggle PIN visibility"
              >
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <Input
              type={showPw ? 'text' : 'password'}
              inputMode="numeric"
              pattern="\d{4}"
              maxLength={4}
              placeholder="Confirm 4-digit PIN"
              value={backupPw2}
              onChange={(e) => setBackupPw2(e.target.value.replace(/\D/g, '').slice(0, 4))}
              className="tracking-[0.5em] text-center"
            />
            <p className="text-[11px] text-muted-foreground">
              Use this PIN if your face can't be detected (e.g. low light at night).
            </p>
          </div>
        )}

        {/* Verify: backup PIN fallback panel */}
        {mode === 'verify' && showBackupFallback && (
          <div className="space-y-2 rounded-lg border border-border p-3 bg-muted/30">
            <Label className="text-xs flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5" /> Enter backup PIN
            </Label>
            <div className="relative">
              <Input
                type={showPw ? 'text' : 'password'}
                inputMode="numeric"
                pattern="\d{4}"
                maxLength={4}
                placeholder="4-digit PIN"
                value={backupPw}
                onChange={(e) => setBackupPw(e.target.value.replace(/\D/g, '').slice(0, 4))}
                onKeyDown={(e) => { if (e.key === 'Enter') handleBackupVerify(); }}
                className="pr-9 tracking-[0.5em] text-center"
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPw(v => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground"
                aria-label="Toggle PIN visibility"
              >
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleBackupVerify} disabled={verifyingPw} className="flex-1">
                {verifyingPw ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Verifying…</> : 'Unlock'}
              </Button>
              <Button variant="outline" onClick={() => { setShowBackupFallback(false); setBackupPw(''); }}>
                Back
              </Button>
            </div>
          </div>
        )}

        {!showBackupFallback && (
          <div className="flex gap-2">
            <Button
              onClick={captureAndProcess}
              disabled={status === 'starting' || status === 'scanning' || status === 'success'}
              className="flex-1"
            >
              {status === 'scanning' ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Analysing…</>
              ) : (
                <><Camera className="w-4 h-4 mr-2" /> {mode === 'enroll' ? 'Capture & Enroll' : 'Verify'}</>
              )}
            </Button>
            {mode === 'verify' && isEnrolled() && (
              <Button
                variant="outline"
                onClick={() => {
                  clearEnrollment();
                  clearBackupPassword();
                  setMode('enroll');
                  toast({ title: 'Enrollment cleared', description: 'Please re-enroll your face.' });
                }}
                title="Reset enrollment"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        )}

        {/* Verify: trigger fallback */}
        {mode === 'verify' && !showBackupFallback && hasBackupPassword() && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => { setShowBackupFallback(true); stopCamera(); }}
            className="w-full text-xs"
          >
            <KeyRound className="w-3.5 h-3.5 mr-1.5" /> Use backup PIN instead
          </Button>
        )}

        <p className="text-[11px] text-muted-foreground text-center">
          Your Images Data Is 100% Safe & Store In Encrypted Form
        </p>
      </CardContent>
    </Card>
  );
};

export default FaceAuth;
export { isFaceAuthEnabled, isSessionUnlocked, isEnrolled };
