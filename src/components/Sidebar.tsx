import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Wifi, WifiOff, MessageSquare, BarChart3, Lightbulb, 
  Database, User as UserIcon, ChevronDown, ChevronRight, 
  Edit, Share2, Trash2, Settings, MoreVertical, Crown, Sparkles, Zap, UserCircle2, Code2, Smartphone
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import NotificationMenu from '@/components/NotificationMenu';
import { isAdminEmail } from '@/utils/adminConfig';
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
import { Badge } from '@/components/ui/badge';

interface SidebarProps {
    bridgeConnected: boolean;
    phoneBridgeConnected?: boolean;
    onNewChat: () => void;
    onOpenMemory: () => void;
    onToggleBridge?: () => void;
    onTogglePhoneBridge?: () => void;
    currentConversationId?: string | null;
}

const Sidebar = ({ bridgeConnected, phoneBridgeConnected = false, onNewChat, onOpenMemory, onToggleBridge, onTogglePhoneBridge, currentConversationId }: SidebarProps) => {
    const navigate = useNavigate();
    const { toast } = useToast();
    const [user, setUser] = useState<any>(null);
    const [recentChats, setRecentChats] = useState<any[]>([]);
    const [showRecent, setShowRecent] = useState(true);

    // --- LOGIC FROM SECOND CODE ---
    const [renameDialogOpen, setRenameDialogOpen] = useState(false);
    const [renameTitle, setRenameTitle] = useState('');
    const [renamingChatId, setRenamingChatId] = useState<string | null>(null);
    const [subscriptionTier, setSubscriptionTier] = useState<string>('free');
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

    useEffect(() => {
      const fetchProfile = async () => {
        if (!user) return;
        const { data } = await supabase
            .from('profiles')
            .select('avatar_url')
            .eq('user_id', user.id)
            .single();
        if (data) setAvatarUrl(data.avatar_url);
    };
    fetchProfile();
}, [user]);

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setUser(session?.user ?? null);
        });
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
        });
        return () => subscription.unsubscribe();
    }, []);

    // Load subscription tier
    useEffect(() => {
        const loadSubscription = async () => {
            if (!user) return;
            
            // Check if admin (unlimited elite)
            if (isAdminEmail(user.email)) {
                setSubscriptionTier('elite');
                return;
            }
            
            const { data } = await supabase
                .from('profiles')
                .select('subscription_tier, subscription_expires_at, trial_started_at')
                .eq('user_id', user.id)
                .single();
            
            if (data) {
                // Check if subscription is still valid
                if (data.subscription_expires_at) {
                    const expiresAt = new Date(data.subscription_expires_at);
                    if (expiresAt > new Date()) {
                        setSubscriptionTier(data.subscription_tier || 'free');
                        return;
                    }
                }
                // Check if in trial period (3 days)
                if (data.trial_started_at) {
                    const trialStart = new Date(data.trial_started_at);
                    const trialEnd = new Date(trialStart.getTime() + 3 * 24 * 60 * 60 * 1000);
                    if (trialEnd > new Date()) {
                        setSubscriptionTier('trial');
                        return;
                    }
                }
                setSubscriptionTier('free');
            }
        };
        loadSubscription();
    }, [user]);

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
        <div className="w-64 h-[100dvh] max-h-[100dvh] bg-[#1a1a1a]/95 border-r border-white/5 flex flex-col sticky top-0 z-40 backdrop-blur-xl overflow-hidden">

            {/* Bridge Status */}
            <div className="p-4 border-b border-white/5 shrink-0 space-y-2">
                {/* PC Bridge */}
                <button 
                    onClick={onToggleBridge}
                    className="w-full flex items-center justify-between bg-black/40 p-2.5 rounded-xl border border-white/5 hover:bg-white/5 transition-colors cursor-pointer"
                    title={bridgeConnected ? 'Click to disconnect PC Bridge' : 'Click to connect PC Bridge'}
                >
                    <div className="flex items-center gap-2">
                        {bridgeConnected ? <Wifi className="w-3.5 h-3.5 text-green-400 animate-pulse" /> : <WifiOff className="w-3.5 h-3.5 text-red-400" />}
                        <span className="text-[11px] font-bold uppercase tracking-widest text-white/70">PC Bridge</span>
                    </div>
                    <div className={`h-1.5 w-1.5 rounded-full ${bridgeConnected ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-red-500'}`} />
                </button>

                {/* Phone Bridge */}
                <button
                    onClick={onTogglePhoneBridge}
                    className="w-full flex items-center justify-between bg-black/40 p-2.5 rounded-xl border border-white/5 hover:bg-white/5 transition-colors cursor-pointer"
                    title={phoneBridgeConnected ? 'Phone Bridge connected' : 'Phone Bridge offline'}
                >
                    <div className="flex items-center gap-2">
                        <Smartphone className={`w-3.5 h-3.5 ${phoneBridgeConnected ? 'text-green-400 animate-pulse' : 'text-red-400'}`} />
                        <span className="text-[11px] font-bold uppercase tracking-widest text-white/70">Phone Bridge</span>
                    </div>
                    <div className={`h-1.5 w-1.5 rounded-full ${phoneBridgeConnected ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-red-500'}`} />
                </button>
            </div>

            {/* Actions */}
            <div className="p-3 space-y-2 shrink-0">
                <Button onClick={onNewChat} className="w-full bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 border border-blue-500/20 rounded-lg justify-start h-9">
                    <MessageSquare className="w-3.5 h-3.5 mr-2.5" />
                    <span className="font-semibold text-xs">New Intelligence</span>
                </Button>
            </div>

            {/* Nav */}
            <div className="px-3 space-y-1 shrink-0">
                {/* Notification Menu - Above Creative Hub */}
                <NotificationMenu />
                
                {[
                    { icon: BarChart3, label: 'Analytics', path: '/analytics' },
                    { icon: UserCircle2, label: 'Avatar Chat', path: '/avatar-chat' },
                    
                    { icon: Code2, label: 'Vibe Coding', path: '/vibecoding' },
                    { icon: Lightbulb, label: 'History', path: '/history' },
                    { icon: Sparkles, label: 'Updates History', path: '/update-history' },
                    { icon: Database, label: 'Memory', action: onOpenMemory },
                ].map((item, idx) => (
                    <Button key={idx} variant="ghost" className="w-full justify-start text-white/50 hover:text-white hover:bg-white/5 rounded-lg h-8 transition-all"
                        onClick={item.path ? () => navigate(item.path!) : item.action}>
                        <item.icon className="w-3.5 h-3.5 mr-2.5 opacity-70" />
                        <span className="text-xs font-medium">{item.label}</span>
                    </Button>
                ))}
            </div>

            {/* History Section with ContextMenu Logic */}
            <div className="flex-1 flex flex-col min-h-0 mt-4 overflow-hidden">
                <button className="flex items-center justify-between px-6 py-2 text-white/40 hover:text-white/80 transition-colors group" onClick={() => setShowRecent(!showRecent)}>
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Recently Chat</span>
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

            {/* Upgrade Prompt for Free Users */}
            {(subscriptionTier === 'free' || subscriptionTier === 'trial') && (
                <div className="px-3 mb-2 shrink-0">
                    <Button
                        onClick={() => navigate('/pricing')}
                        className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-90 text-white text-xs py-2 h-auto"
                    >
                        <Crown className="w-3.5 h-3.5 mr-2" />
                        {subscriptionTier === 'trial' ? 'Upgrade to Pro/Elite' : 'Unlock PC Bridge'}
                    </Button>
                </div>
            )}

            {/* Profile Section with Subscription Badge */}
<div className="p-3 shrink-0 border-t border-white/5 bg-black/20 space-y-3">
    {/* Subscription Badges - Showing based on tier */}
    <div className="flex justify-center">
        {subscriptionTier === 'elite' && (
            <Badge className="bg-gradient-to-r from-purple-600 to-pink-600 text-white border-0 px-3 py-1 flex items-center gap-1.5 shadow-lg shadow-purple-500/30">
                <Crown className="w-3.5 h-3.5" />
                <span className="font-bold text-xs">ELITE</span>
            </Badge>
        )}
        {subscriptionTier === 'pro' && (
            <Badge className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white border-0 px-3 py-1 flex items-center gap-1.5 shadow-lg shadow-blue-500/30">
                <Sparkles className="w-3.5 h-3.5" />
                <span className="font-bold text-xs">PRO</span>
            </Badge>
        )}
        {subscriptionTier === 'trial' && (
            <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 px-3 py-1 flex items-center gap-1.5 shadow-lg shadow-amber-500/30">
                <Zap className="w-3.5 h-3.5" />
                <span className="font-bold text-xs">TRIAL</span>
            </Badge>
        )}
        {subscriptionTier === 'free' && (
            <Badge variant="outline" className="border-white/20 text-white/60 px-3 py-1 flex items-center gap-1.5">
                <span className="font-medium text-xs">FREE</span>
            </Badge>
        )}
    </div>
    
    {/* User Identity Section */}
    <Button 
        variant="ghost" 
        className="w-full justify-start text-white/60 hover:text-white hover:bg-white/5 rounded-xl p-2 h-auto" 
        onClick={() => user ? navigate('/profile') : navigate('/auth')}
    >
        {/* Profile Avatar from Gallery */}
        <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold overflow-hidden border border-white/10 shadow-[0_0_10px_rgba(37,99,235,0.15)]">
            {avatarUrl ? (
                <img src={avatarUrl} alt="User" className="w-full h-full object-cover" />
            ) : (
                user?.email?.charAt(0).toUpperCase() || <UserIcon className="w-5 h-5" />
            )}
        </div>

        {/* User Info (Guest removed) */}
        <div className="ml-3 flex flex-col items-start overflow-hidden">
            <span className="text-xs font-bold text-white truncate w-full">
                {user?.email?.split('@')[0] || 'System Operator'}
            </span>
            <span className="text-[9px] text-white/30 uppercase tracking-tighter">
                {user ? 'Verified Profile' : 'Access Restricted'}
            </span>
        </div>
    </Button>
</div>

            
        </div>
    );
};

export default Sidebar;
