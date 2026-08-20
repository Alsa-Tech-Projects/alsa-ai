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

      // --- Instant Local Preview ---
      const localUrl = URL.createObjectURL(file);
      setAvatarUrl(localUrl);

      setUploading(true);
      
      // --- Supabase Upload ---
      const fileExt = file.name.split('.').pop();
      const filePath = `${user.id}-${Math.random()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: signed } = await supabase.storage
        .from('avatars')
        .createSignedUrl(filePath, 60 * 60 * 24 * 365 * 10);
      const publicUrl = signed?.signedUrl || '';

      setAvatarUrl(publicUrl);
      
      toast({ 
        title: "Profile Picture Updated", 
        description: "Your image has been uploaded successfully.",
      });

    } catch (error: any) {
      toast({ title: "Upload Failed", description: error.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  // --- 2. Logout Logic ---
  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({ title: "Logged Out", description: "You have been successfully logged out." });
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
      toast({ title: "Profile Saved", description: "Your details have been updated successfully." });
      loadProfile();
    } catch (error: any) {
      toast({ title: "Error Saving Profile", description: error.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-[#0b0f17] flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-[#2563eb] animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0b0f17] text-[#e2e8f0] p-4 sm:p-6">
      <div className="container max-w-2xl mx-auto">
        
        {/* Header Actions */}
        <div className="flex justify-between items-center mb-6 sm:mb-8">
          <Button variant="ghost" onClick={() => navigate('/')} className="hover:bg-[#131b2e] text-slate-300 px-2 sm:px-4">
            <ArrowLeft className="w-4 h-4 mr-1 sm:mr-2" /> <span className="hidden sm:inline">Back</span>
          </Button>
          <Button onClick={handleLogout} variant="destructive" className="bg-red-500/10 border border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white transition-colors">
            <LogOut className="w-4 h-4 mr-1 sm:mr-2" /> <span className="text-sm">Logout</span>
          </Button>
        </div>

        {/* Profile Card */}
        <Card className="bg-[#131b2e] border-[#1e293b] shadow-lg">
          <CardHeader className="text-center pb-4 sm:pb-6">
            <CardTitle className="text-xl sm:text-2xl font-bold text-white">Profile Settings</CardTitle>
            <CardDescription className="text-slate-400 text-sm">Update your photo and personal details</CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6 sm:space-y-8">
            
            {/* Profile Picture Upload Section */}
            <div className="flex flex-col items-center gap-3">
              <div 
                className="relative group w-28 h-28 sm:w-32 sm:h-32 rounded-full cursor-pointer overflow-hidden border-2 border-dashed border-slate-600 hover:border-[#2563eb] transition-all bg-[#0b0f17]"
                onClick={() => fileInputRef.current?.click()}
              >
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover group-hover:opacity-40 transition-opacity" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <UserIcon className="w-10 h-10 sm:w-12 sm:h-12 text-slate-500" />
                  </div>
                )}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/50 transition-all">
                  <Upload className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                {uploading && <div className="absolute inset-0 flex items-center justify-center bg-[#131b2e]/80"><Loader2 className="animate-spin text-[#2563eb]" /></div>}
              </div>
              <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*" className="hidden" />
              <p className="text-xs text-slate-400">Tap to upload a new photo</p>
            </div>

            {/* Form Fields */}
            <div className="grid gap-4 sm:gap-6">
              <div className="space-y-1.5">
                <Label className="text-slate-300 text-xs sm:text-sm">Email Address (Cannot be changed)</Label>
                <Input
                  value={user?.email || ''}
                  disabled
                  className="bg-[#0b0f17] border-[#1e293b] text-slate-400 cursor-not-allowed opacity-70"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-slate-300 text-xs sm:text-sm">Full Name</Label>
                <Input 
                  placeholder="Enter your name" 
                  value={displayName} 
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="bg-[#0b0f17] border-[#1e293b] focus:border-[#2563eb] text-white placeholder-slate-500 transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-slate-300 text-xs sm:text-sm">About Me (Bio)</Label>
                <Textarea 
                  placeholder="Tell us a little about yourself..." 
                  value={bio} 
                  onChange={(e) => setBio(e.target.value)}
                  className="bg-[#0b0f17] border-[#1e293b] focus:border-[#2563eb] min-h-[100px] text-white placeholder-slate-500 transition-colors resize-y"
                />
              </div>
            </div>

            <Button 
              onClick={saveProfile} 
              disabled={saving || uploading} 
              className="w-full bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-medium shadow-md transition-all py-2 sm:py-2.5"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...
                </>
              ) : 'Save Changes'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Profile;
