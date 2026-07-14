import { useEffect } from "react";

interface UseWakeKeyboardProps {
  onClose: () => void;
  onExpand: () => void;
}

export const useWakeKeyboard = ({ onClose, onExpand }: UseWakeKeyboardProps) => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // 1. Escape key instantly kills the wake overlay session safely
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }

      // 2. Enter key or ArrowUp expands the workspace to full chat
      if (event.key === "Enter" || event.key === "ArrowUp") {
        // Only trigger if the user isn't actively typing inside an input element somewhere else
        const activeElem = document.activeElement;
        const isTyping = activeElem && (
          activeElem.tagName === "INPUT" || 
          activeElem.tagName === "TEXTAREA" || 
          activeElem.hasAttribute("contenteditable")
        );

        if (!isTyping) {
          event.preventDefault();
          onExpand();
        }
      }
    };

    // Attach listener globally to handle overlay state cleanup instantly
    window.addEventListener("keydown", handleKeyDown);

    // Clean up event listener when the component unmounts to prevent memory leaks
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose, onExpand]);
};
