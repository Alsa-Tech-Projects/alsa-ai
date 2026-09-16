import React from "react";
import { Minus, Square, X, Sparkles } from "lucide-react";

interface TitleBarProps {
  title?: string;
  className?: string;
  forceShow?: boolean;
}

export const TitleBar: React.FC<TitleBarProps> = ({
  title = "Alsa AI",
  className = "",
  forceShow = false,
}) => {
  const isElectron = typeof window !== "undefined" && Boolean(window.electronAPI);

  // In normal browser mode, avoid taking up vertical space unless forced or running inside Electron
  if (!isElectron && !forceShow) {
    return null;
  }

  const handleMinimize = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.electronAPI?.controlWindow("minimize");
  };

  const handleMaximize = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.electronAPI?.controlWindow("maximize");
  };

  const handleClose = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.electronAPI?.controlWindow("close");
  };

  return (
    <>
      <header
        className={`h-9 w-full select-none bg-background/95 backdrop-blur border-b border-border/40 text-foreground flex items-center justify-between px-3 text-xs z-[9999] fixed top-0 left-0 right-0 ${className}`}
        style={{ WebkitAppRegion: "drag" } as React.CSSProperties}
      >
        {/* Left side: App Logo and Title */}
        <div
          className="flex items-center gap-2 font-medium"
          style={{ WebkitAppRegion: "no-drag" } as React.CSSProperties}
        >
          <div className="h-4 w-4 rounded-sm bg-primary/10 flex items-center justify-center text-primary">
            <Sparkles className="h-3 w-3" />
          </div>
          <span className="font-semibold tracking-tight text-foreground/90">{title}</span>
          <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
            Desktop
          </span>
        </div>

        {/* Center: Draggable Spacer / Neural Workspace Title */}
        <div className="flex-1 flex justify-center text-muted-foreground/60 text-[11px] truncate px-4 pointer-events-none">
          Alsa AI • From Chat To Execution
        </div>

        {/* Right side: Window Action Controls */}
        <div
          className="flex items-center -mr-3 h-full"
          style={{ WebkitAppRegion: "no-drag" } as React.CSSProperties}
        >
          <button
            type="button"
            onClick={handleMinimize}
            className="h-full px-3.5 inline-flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/70 transition-colors focus:outline-none"
            title="Minimize"
            aria-label="Minimize Window"
          >
            <Minus className="h-3.5 w-3.5" />
          </button>

          <button
            type="button"
            onClick={handleMaximize}
            className="h-full px-3.5 inline-flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/70 transition-colors focus:outline-none"
            title="Maximize"
            aria-label="Maximize or Restore Window"
          >
            <Square className="h-3.5 w-3.5" />
          </button>

          <button
            type="button"
            onClick={handleClose}
            className="h-full px-4 inline-flex items-center justify-center text-muted-foreground hover:text-destructive-foreground hover:bg-destructive transition-colors focus:outline-none"
            title="Close"
            aria-label="Close Window"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </header>

      {/* Spacer to prevent page content from being hidden under fixed titlebar */}
      <div className="h-9 w-full shrink-0" aria-hidden="true" />
    </>
  );
};

export default TitleBar;
