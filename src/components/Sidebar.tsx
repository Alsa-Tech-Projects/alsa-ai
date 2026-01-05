import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Wifi, WifiOff, MessageSquare, BarChart3, Lightbulb,
    Database, User, ChevronDown, ChevronRight,
    Edit, Share2, Trash2, Settings, MoreVertical
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
    ContextMenu,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";

interface SidebarProps {
    bridgeConnected: boolean;
    onNewChat: () => void;
    onOpenMemory: () => void;
    currentConversationId?: string | null;
}

const Sidebar = ({ bridgeConnected, onNewChat, onOpenMemory, currentConversationId }: SidebarProps) => {
    const navigate = useNavigate();
    const { toast } = useToast();
    const [user, setUser] = useState<any>(null);
    const [recentChats, setRecentChats] = useState<any[]>([]);
    const [showRecent, setShowRecent] = useState(true);

    // --- LOGIC FROM SECOND CODE ---
    const [renameDialogOpen, setRenameDialogOpen] = useState(false);
    const [renameTitle, setRenameTitle] = useState('');
    const [renamingChatId, setRenamingChatId] = useState<string | null>(null);

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setUser(session?.user ?? null);
        });
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
        });
        return () => subscription.unsubscribe();
    }, []);

    useEffect(() => {
        const loadRecentChats = async () => {
            if (!user) return;
            const { data } = await supabase
                .from('conversations')
                .select('*')
                .eq('user_id', user.id)
                .order('updated_at', { ascending: false })
                .limit(15);

            if (data) setRecentChats(data);
        };
        loadRecentChats();
    }, [user, currentConversationId]);

    const handleRenameChat = async () => {
        if (!renamingChatId || !renameTitle.trim()) return;
        try {
            const { error } = await supabase
                .from('conversations')
                .update({ title: renameTitle.trim() })
                .eq('id', renamingChatId);

            if (error) throw error;

            setRecentChats(prev => prev.map(chat =>
                chat.id === renamingChatId ? { ...chat, title: renameTitle.trim() } : chat
            ));

            toast({ title: "Chat renamed successfully" });
            setRenameDialogOpen(false);
            setRenamingChatId(null);
            setRenameTitle('');
        } catch (error) {
            toast({ title: "Failed to rename chat", variant: "destructive" });
        }
    };

    const handleDeleteChat = async (chatId: string) => {
        try {
            const { error } = await supabase
                .from('conversations')
                .delete()
                .eq('id', chatId);

            if (error) throw error;

            setRecentChats(prev => prev.filter(chat => chat.id !== chatId));
            toast({ title: "Chat deleted successfully" });

            if (currentConversationId === chatId) {
                onNewChat();
            }
        } catch (error) {
            toast({ title: "Failed to delete chat", variant: "destructive" });
        }
    };

    const handleShareChat = async (chatId: string) => {
        try {
            const shareUrl = `${window.location.origin}/shared/${chatId}`;
            await navigator.clipboard.writeText(shareUrl);
            toast({ title: "Share link copied to clipboard!" });
        } catch (error) {
            toast({ title: "Failed to copy share link", variant: "destructive" });
        }
    };

    return (
        <div className="w-64 h-screen bg-[#1a1a1a]/95 border-r border-white/5 flex flex-col sticky top-0 z-40 backdrop-blur-xl">

            {/* Bridge Status */}
            <div className="p-6 border-b border-white/5">
                <div className="flex items-center justify-between bg-black/40 p-2.5 rounded-xl border border-white/5">
                    <div className="flex items-center gap-2">
                        {bridgeConnected ? <Wifi className="w-3.5 h-3.5 text-green-400 animate-pulse" /> : <WifiOff className="w-3.5 h-3.5 text-red-400" />}
                        <span className="text-[11px] font-bold uppercase tracking-widest text-white/70">PC Bridge</span>
                    </div>
                    <div className={`h-1.5 w-1.5 rounded-full ${bridgeConnected ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-red-500'}`} />
                </div>
            </div>

            {/* Actions */}
            <div className="p-4 space-y-2">
                <Button onClick={onNewChat} className="w-full bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 border border-blue-500/20 rounded-xl justify-start h-11">
                    <MessageSquare className="w-4 h-4 mr-3" />
                    <span className="font-semibold text-sm">New Intelligence</span>
                </Button>
            </div>

            {/* Nav */}
            <div className="px-3 space-y-1">
                {[
                    { icon: BarChart3, label: 'Analytics', path: '/analytics' },
                    { icon: Lightbulb, label: 'Creative Hub', path: '/history' },
                    { icon: Database, label: 'Neural Memory', action: onOpenMemory },
                ].map((item, idx) => (
                    <Button key={idx} variant="ghost" className="w-full justify-start text-white/50 hover:text-white hover:bg-white/5 rounded-lg h-10 transition-all"
                        onClick={item.path ? () => navigate(item.path!) : item.action}>
                        <item.icon className="w-4 h-4 mr-3 opacity-70" />
                        <span className="text-sm font-medium">{item.label}</span>
                    </Button>
                ))}
            </div>

            {/* History Section with ContextMenu Logic */}
            <div className="flex-1 flex flex-col min-h-0 mt-6">
                <button className="flex items-center justify-between px-6 py-2 text-white/40 hover:text-white/80 transition-colors group" onClick={() => setShowRecent(!showRecent)}>
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Recent Sessions</span>
                    {showRecent ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                </button>

                {showRecent && (
                    <ScrollArea className="flex-1 px-3 mt-2">
                        <div className="space-y-1 pr-2">
                            {recentChats.map((chat) => (
                                <ContextMenu key={chat.id}>
                                    <ContextMenuTrigger>
                                        <Button
                                            variant="ghost"
                                            className={`w-full justify-start text-white/50 hover:text-white hover:bg-white/5 rounded-lg h-9 group transition-all relative overflow-hidden ${currentConversationId === chat.id ? 'bg-white/10 text-white border-l-2 border-blue-500' : ''}`}
                                            onClick={() => navigate(`/c/${chat.id}`)}
                                        >
                                            <span className="truncate text-xs font-normal">{chat.title || 'Untitled Session'}</span>
                                        </Button>
                                    </ContextMenuTrigger>
                                    <ContextMenuContent className="w-48 bg-[#2a2a2a] border-white/10 text-white">
                                        <ContextMenuItem className="flex items-center gap-2 cursor-pointer" onClick={() => {
                                            setRenamingChatId(chat.id);
                                            setRenameTitle(chat.title || '');
                                            setRenameDialogOpen(true);
                                        }}>
                                            <Edit className="w-4 h-4" /> Rename
                                        </ContextMenuItem>
                                        <ContextMenuItem className="flex items-center gap-2 cursor-pointer" onClick={() => handleShareChat(chat.id)}>
                                            <Share2 className="w-4 h-4" /> Share
                                        </ContextMenuItem>
                                        <ContextMenuItem className="flex items-center gap-2 cursor-pointer text-red-400 focus:text-red-400" onClick={() => handleDeleteChat(chat.id)}>
                                            <Trash2 className="w-4 h-4" /> Delete
                                        </ContextMenuItem>
                                    </ContextMenuContent>
                                </ContextMenu>
                            ))}
                        </div>
                    </ScrollArea>
                )}
            </div>

            {/* Rename Dialog UI */}
            <Dialog open={renameDialogOpen} onOpenChange={setRenameDialogOpen}>
                <DialogContent className="bg-[#1a1a1a] border-white/10 text-white">
                    <DialogHeader>
                        <DialogTitle>Rename Chat</DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        <Input
                            value={renameTitle}
                            onChange={(e) => setRenameTitle(e.target.value)}
                            className="bg-white/5 border-white/10 text-white focus:border-blue-500"
                            placeholder="Enter new title..."
                            onKeyDown={(e) => e.key === 'Enter' && handleRenameChat()}
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setRenameDialogOpen(false)}>Cancel</Button>
                        <Button className="bg-blue-600 hover:bg-blue-700" onClick={handleRenameChat}>Save</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Profile Section */}
            <div className="p-4 mt-auto border-t border-white/5 bg-black/20">
                <Button variant="ghost" className="w-full justify-start text-white/60 hover:text-white hover:bg-white/5 rounded-xl p-2 h-auto" onClick={() => user ? navigate('/profile') : navigate('/auth')}>
                    <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold">
                        {user?.email?.charAt(0).toUpperCase() || <User className="w-5 h-5" />}
                    </div>
                    <div className="ml-3 flex flex-col items-start overflow-hidden">
                        <span className="text-xs font-bold text-white truncate w-full">{user?.email?.split('@')[0] || 'Guest User'}</span>
                        <span className="text-[9px] text-white/30 uppercase tracking-tighter">System Operator</span>
                    </div>
                </Button>
            </div>
        </div>
    );
};

export default Sidebar;
