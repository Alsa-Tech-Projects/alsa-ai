import React, { useRef } from "react";

interface WakeGestureHandlerProps {
  onSwipeUp: () => void;
  onSwipeDown: () => void;
  children: React.ReactNode;
}

const SWIPE_THRESHOLD = 120; // Minimum pixel distance to confirm global gesture

const WakeGestureHandler: React.FC<WakeGestureHandlerProps> = ({
  onSwipeUp,
  onSwipeDown,
  children,
}) => {
  const touchStartY = useRef<number | null>(null);
  const touchStartX = useRef<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartY.current === null || touchStartX.current === null) return;

    const touchEndY = e.changedTouches[0].clientY;
    const touchEndX = e.changedTouches[0].clientX;

    const deltaY = touchStartY.current - touchEndY;
    const deltaX = touchStartX.current - touchEndX;

    // Ensure the gesture is primarily vertical, ignoring diagonal noise
    if (Math.abs(deltaY) > Math.abs(deltaX)) {
      if (deltaY > SWIPE_THRESHOLD) {
        // Upward Swipe
        onSwipeUp();
      } else if (deltaY < -SWIPE_THRESHOLD) {
        // Downward Swipe
        onSwipeDown();
      }
    }

    // Reset touch trackers
    touchStartY.current = null;
    touchStartX.current = null;
  };

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className="w-full h-full relative overflow-hidden"
    >
      {children}
    </div>
  );
};

export default WakeGestureHandler;
