import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Upload, User as UserIcon, LogOut, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Profile {
  id: string;
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
}

// pure code logic
const Profile = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/auth');
        return;
      }
      setUser(user);

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setProfile(data);
        setDisplayName(data.display_name || '');
        setBio(data.bio || '');
        setAvatarUrl(data.avatar_url || '');
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  // --- 1. Gallery Upload Logic ---
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
  try {
    if (!event.target.files || event.target.files.length === 0) return;
    const file = event.target.files[0];

    // --- STEP 1: Instant Local Preview (Yaha magic hai) ---
    const localUrl = URL.createObjectURL(file);
    setAvatarUrl(localUrl); // Upload hone se pehle hi image dikh jayegi!

    setUploading(true);
    
    // --- STEP 2: Supabase Upload ---
    const fileExt = file.name.split('.').pop();
    const filePath = `${user.id}-${Math.random()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);

    // Final URL set kar rahe hain jo DB mein jayega
    setAvatarUrl(publicUrl);
    
    toast({ 
      title: "IMAGE_LINKED", 
      description: "Your Image Was Successfully Upload",
    });

  } catch (error: any) {
    toast({ title: "Upload failed", description: error.message, variant: "destructive" });
  } finally {
    setUploading(false);
  }
};

  // --- 2. Logout Logic ---
  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({ title: "Logged Out", description: "See you in the future, agent." });
    navigate('/auth');
  };

  const saveProfile = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const profileData = {
        user_id: user.id,
        display_name: displayName,
        avatar_url: avatarUrl,
        bio: bio
      };

      const { error } = profile 
        ? await supabase.from('profiles').update(profileData).eq('id', profile.id)
        : await supabase.from('profiles').insert([profileData]);

      if (error) throw error;
      toast({ title: "System Updated", description: "Your neural profile is synchronized." });
      loadProfile();
    } catch (error: any) {
      toast({ title: "Sync Error", description: error.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-cyan-500 animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#020202] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900/20 via-black to-black text-white p-6">
      <div className="container max-w-2xl mx-auto">
        
        <div className="flex justify-between items-center mb-8">
          <Button variant="ghost" onClick={() => navigate('/')} className="hover:bg-cyan-500/10 text-cyan-400">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back
          </Button>
          <Button onClick={handleLogout} variant="destructive" className="bg-red-900/20 border border-red-500/50 hover:bg-red-600">
            <LogOut className="w-4 h-4 mr-2" /> LOGOUT
          </Button>
        </div>

        <Card className="bg-black/40 border-cyan-500/30 backdrop-blur-xl shadow-[0_0_20px_rgba(6,182,212,0.15)]">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold tracking-widest text-cyan-400">Alsa Ai User Profile</CardTitle>
            <CardDescription className="text-cyan-700">Your Profiles Picture Or About Yourself</CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-8">
            {/* Profile Picture Upload Section */}
            <div className="flex flex-col items-center gap-4">
              <div 
                className="relative group w-32 h-32 rounded-full cursor-pointer overflow-hidden border-2 border-dashed border-cyan-500/50 hover:border-cyan-400 transition-all"
                onClick={() => fileInputRef.current?.click()}
              >
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover group-hover:opacity-50 transition-opacity" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-cyan-500/5">
                    <UserIcon className="w-12 h-12 text-cyan-500/50" />
                  </div>
                )}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/60 transition-all">
                  <Upload className="w-6 h-6 text-cyan-400" />
                </div>
                {uploading && <div className="absolute inset-0 flex items-center justify-center bg-black/80"><Loader2 className="animate-spin text-cyan-400" /></div>}
              </div>
              <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*" className="hidden" />
              <p className="text-xs text-cyan-600 uppercase tracking-tighter">Tap To Upload or Re-upload Image</p>
            </div>

            <div className="grid gap-6">
              <div className="space-y-2">
                <Label className="text-cyan-500 text-xs uppercase tracking-widest">Your email (This was not changed)</Label>
                <Input
                  value={user?.email || ''}
                  disabled
                  className="bg-cyan-950/20 border-cyan-900 text-white placeholder-white/70"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-cyan-500 text-xs uppercase tracking-widest">Display User Name</Label>
                <Input 
                  placeholder="Enter Alias..." 
                  value={displayName} 
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="bg-black/50 border-cyan-500/30 focus:border-cyan-400 transition-colors text-white placeholder-white/70"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-cyan-500 text-xs uppercase tracking-widest">Bio (Something About Yourself)</Label>
                <Textarea 
                  placeholder="System credentials, skills, or status..." 
                  value={bio} 
                  onChange={(e) => setBio(e.target.value)}
                  className="bg-black/50 border-cyan-500/30 focus:border-cyan-400 min-h-[100px] text-white placeholder-white/70"
                />
              </div>
            </div>

            <Button 
              onClick={saveProfile} 
              disabled={saving} 
              className="w-full bg-cyan-600 hover:bg-cyan-500 text-black font-bold tracking-widest shadow-[0_0_15px_rgba(6,182,212,0.4)] transition-all"
            >
              {saving ? 'SYNCHRONIZING...' : 'UPDATE SYSTEM'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Profile;
