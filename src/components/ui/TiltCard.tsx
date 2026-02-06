import { ReactNode } from "react";
import { use3DTilt } from "@/hooks/use3DTilt";

type Props = {
  children: ReactNode;
  className?: string;
};

export const TiltCard = ({ children, className = "" }: Props) => {
  const tilt = use3DTilt();

  return (
    <div
      ref={tilt.ref}
      onMouseMove={tilt.handleMouseMove}
      onMouseLeave={tilt.handleMouseLeave}
      className={`transition-transform duration-200 will-change-transform ${className}`}
    >
      {children}
    </div>
  );
};
