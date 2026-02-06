import { useEffect } from "react";

export const useCursorGlow = () => {
  useEffect(() => {
    const glow = document.createElement("div");

    glow.className =
      "pointer-events-none fixed top-0 left-0 w-[300px] h-[300px] rounded-full blur-[120px] bg-blue-500/20 z-40 transition-transform duration-75";

    document.body.appendChild(glow);

    const move = (e: MouseEvent) => {
      glow.style.transform = `translate(${e.clientX - 150}px, ${e.clientY - 150}px)`;
    };

    window.addEventListener("mousemove", move);

    return () => {
      window.removeEventListener("mousemove", move);
      glow.remove();
    };
  }, []);
};
