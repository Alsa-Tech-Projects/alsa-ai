import { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import FaceAuth from '@/components/FaceAuth';
import { isFaceAuthEnabled, isSessionUnlocked, isEnrolled } from '@/utils/faceAuth';

interface Props { children: React.ReactNode }

/**
 * Wraps protected pages. If face-auth is enabled and the session is locked,
 * shows the FaceAuth gate. Otherwise renders children.
 */
const FaceAuthGate = ({ children }: Props) => {
  const location = useLocation();
  const [unlocked, setUnlocked] = useState(() => !isFaceAuthEnabled() || isSessionUnlocked());
  const [tick, setTick] = useState(0);

  useEffect(() => {
    setUnlocked(!isFaceAuthEnabled() || isSessionUnlocked());
  }, [tick, location.pathname]);

  if (unlocked) return <>{children}</>;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <FaceAuth
          forceMode={isEnrolled() ? 'verify' : 'enroll'}
          onSuccess={() => setTick(t => t + 1)}
        />
      </div>
    </div>
  );
};

export default FaceAuthGate;
