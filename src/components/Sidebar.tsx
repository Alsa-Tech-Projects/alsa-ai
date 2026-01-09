import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { 
  MessageSquare, 
  Settings, 
  History, 
  User, 
  BarChart3, 
  Menu,
  X,
  Wifi,
  WifiOff
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SidebarProps {
  bridgeConnected?: boolean;
  onToggleBridge?: () => void;
  onNewChat?: () => void;
  onOpenMemory?: () => void;
  currentConversationId?: string;
}

const Sidebar = ({ bridgeConnected = false, onToggleBridge, onNewChat, onOpenMemory, currentConversationId }: SidebarProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { icon: MessageSquare, label: "Chat", path: "/" },
    { icon: History, label: "History", path: "/history" },
    { icon: BarChart3, label: "Analytics", path: "/analytics" },
    { icon: User, label: "Profile", path: "/profile" },
    { icon: Settings, label: "Settings", path: "/settings" },
  ];

  const handleNavigation = (path: string) => {
    navigate(path);
    setIsOpen(false);
  };

  return (
    <>
      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 left-4 z-50 md:hidden bg-background/80 backdrop-blur-sm"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={cn(
        "fixed left-0 top-0 h-full w-64 bg-card border-r border-border z-40 transform transition-transform duration-300 ease-in-out",
        "md:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      )}>
        <div className="flex flex-col h-full">
          {/* Logo/Brand */}
          <div className="p-6 border-b border-border">
            <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              JARVIS AI
            </h1>
            <p className="text-xs text-muted-foreground mt-1">Your AI Assistant</p>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            {menuItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <button
                  key={item.path}
                  onClick={() => handleNavigation(item.path)}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200",
                    "hover:bg-accent hover:text-accent-foreground",
                    isActive 
                      ? "bg-primary/10 text-primary border border-primary/20" 
                      : "text-muted-foreground"
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  <span className="font-medium">{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* PC Bridge Status - Clickable Toggle */}
          <div className="p-4 border-t border-border">
            <button
              onClick={onToggleBridge}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200",
                "hover:bg-accent/50",
                bridgeConnected 
                  ? "bg-green-500/10 text-green-500 border border-green-500/20" 
                  : "bg-destructive/10 text-destructive border border-destructive/20"
              )}
            >
              {bridgeConnected ? (
                <Wifi className="h-5 w-5" />
              ) : (
                <WifiOff className="h-5 w-5" />
              )}
              <div className="text-left">
                <span className="font-medium text-sm block">PC Bridge</span>
                <span className="text-xs opacity-75">
                  {bridgeConnected ? "Connected - Click to disconnect" : "Disconnected - Click to connect"}
                </span>
              </div>
            </button>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-border">
            <p className="text-xs text-muted-foreground text-center">
              Powered by Gemini AI
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
