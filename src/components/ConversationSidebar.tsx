import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { MessageSquarePlus, Trash2, LogOut, Sparkles, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export interface Conversation {
  id: string;
  title: string;
  updated_at: string;
}

interface Props {
  activeId: string | null;
  onSelect: (id: string | null) => void;
  refreshKey: number;
  open: boolean;
  onClose: () => void;
}

export const ConversationSidebar = ({ activeId, onSelect, refreshKey, open, onClose }: Props) => {
  const { user, signOut } = useAuth();
  const [convos, setConvos] = useState<Conversation[]>([]);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("conversations")
      .select("id, title, updated_at")
      .order("updated_at", { ascending: false })
      .then(({ data, error }) => {
        if (error) console.error(error);
        else setConvos(data || []);
      });
  }, [user, refreshKey]);

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const { error } = await supabase.from("conversations").delete().eq("id", id);
    if (error) {
      toast.error("Couldn't delete");
      return;
    }
    setConvos((c) => c.filter((x) => x.id !== id));
    if (activeId === id) onSelect(null);
  };

  return (
    <>
      {open && (
        <div className="fixed inset-0 bg-black/50 z-30 md:hidden" onClick={onClose} />
      )}
      <aside
        className={cn(
          "fixed md:static inset-y-0 left-0 z-40 w-72 bg-sidebar border-r border-sidebar-border flex flex-col transition-transform",
          open ? "translate-x-0" : "-translate-x-full md:translate-x-0",
        )}
      >
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl gemini-bg-gradient flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-lg gemini-text-gradient">Alsa AI</span>
          </div>
          <button onClick={onClose} className="md:hidden text-muted-foreground p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-3">
          <Button
            onClick={() => {
              onSelect(null);
              onClose();
            }}
            className="w-full justify-start gap-2 bg-surface-elevated hover:bg-surface-hover text-foreground rounded-full h-11"
            variant="ghost"
          >
            <MessageSquarePlus className="w-4 h-4" />
            New chat
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto chat-scroll mt-4 px-2">
          <p className="text-xs text-muted-foreground px-3 mb-2 uppercase tracking-wide">Recent</p>
          {convos.length === 0 ? (
            <p className="text-sm text-muted-foreground px-3">No chats yet</p>
          ) : (
            convos.map((c) => (
              <button
                key={c.id}
                onClick={() => {
                  onSelect(c.id);
                  onClose();
                }}
                className={cn(
                  "group w-full text-left px-3 py-2.5 rounded-2xl text-sm flex items-center justify-between transition-colors",
                  activeId === c.id
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent/50",
                )}
              >
                <span className="truncate flex-1">{c.title}</span>
                <Trash2
                  onClick={(e) => handleDelete(e, c.id)}
                  className="w-4 h-4 opacity-0 group-hover:opacity-60 hover:!opacity-100 hover:text-destructive flex-shrink-0 ml-2"
                />
              </button>
            ))
          )}
        </div>

        <div className="p-3 border-t border-sidebar-border">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <div className="w-8 h-8 rounded-full gemini-bg-gradient flex items-center justify-center text-xs font-semibold text-white flex-shrink-0">
                {user?.email?.[0].toUpperCase()}
              </div>
              <span className="text-sm text-sidebar-foreground truncate">{user?.email}</span>
            </div>
            <Button size="icon" variant="ghost" onClick={signOut} title="Sign out">
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </aside>
    </>
  );
};
