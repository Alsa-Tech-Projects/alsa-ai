import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";

interface Props {
  open: boolean;
  setOpen: (v: boolean) => void;
  userId?: string | null;
  initialName?: string;
  initialStep?: number;
  initialOAuthProvider?: string | null;
  onFinish?: () => void;
}

const inputStyle =
  "bg-white/5 border-white/10 text-white placeholder:text-white/40 focus:ring-2 focus:ring-blue-500";

const SignupWizard = ({
  open,
  setOpen,
  userId: propUserId,
  initialName = "",
  initialStep = 1,
  initialOAuthProvider = null,
  onFinish,
}: Props) => {
  const { toast } = useToast();

  const [step, setStep] = useState(initialStep);
  const [name, setName] = useState(initialName);
  const [bio, setBio] = useState("");
  const [foundFrom, setFoundFrom] = useState("");
  const [purpose, setPurpose] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>("");
  const [avatarDataUrl, setAvatarDataUrl] = useState<string>("");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [pendingOAuthProvider, setPendingOAuthProvider] = useState<string | null>(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [localUserId, setLocalUserId] = useState<string | null>(propUserId ?? null);

  useEffect(() => {
    setName(initialName);
    setStep(initialStep);
    setLocalUserId(propUserId ?? null);
  }, [initialName, initialStep, propUserId]);

  useEffect(() => {
    if (!open) {
      setStep(1);
      setBio("");
      setFoundFrom("");
      setPurpose("");
      setAvatarFile(null);
      setAvatarPreview("");
      setAvatarDataUrl("");
      setUploading(false);
      setPendingOAuthProvider(null);
      setEmail("");
      setPassword("");
    }
  }, [open]);

  useEffect(() => {
    if (initialOAuthProvider) {
      setPendingOAuthProvider(initialOAuthProvider);
      setStep(2);
    }
  }, [initialOAuthProvider]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));

    const reader = new FileReader();
    reader.onload = () => {
      setAvatarDataUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleGoogleSignup = async () => {
    // Start the guided flow first, then we'll perform OAuth after user finishes the wizard
    setPendingOAuthProvider("google");
    setStep(2);
  };

  const handleSignUpStep = async () => {
    if (!name.trim()) {
      toast({ title: "Name required", variant: "destructive" });
      return;
    }
    if (!email) {
      toast({ title: "Email required", variant: "destructive" });
      return;
    }
    if (password.length < 6) {
      toast({ title: "Password must be 6+ chars", variant: "destructive" });
      return;
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth`,
          data: { full_name: name },
        },
      });

      if (error) throw error;

      if (data.user) {
        setLocalUserId(data.user.id);
        setStep(2);
      }
    } catch (err: any) {
      toast({ title: "Signup failed", description: err.message, variant: "destructive" });
    }
  };

  const handleSave = async () => {
    const uid = localUserId || propUserId;
    if (!uid) return;

    setSaving(true);
    try {
      const payload: any = {
        user_id: uid,
        display_name: name,
        bio,
        found_from: foundFrom,
        purpose,
      };

      // If user is trying to sign up with OAuth, save pre-oauth profile to localStorage
      if (pendingOAuthProvider) {
        const pre = {
          display_name: name,
          bio,
          found_from: foundFrom,
          purpose,
          avatarDataUrl, // may be empty
        };
        try {
          localStorage.setItem('pre_oauth_profile', JSON.stringify(pre));
          toast({ title: "Profile saved locally", description: "You will be redirected to complete sign-in." });

          // Start OAuth flow
          const { error } = await supabase.auth.signInWithOAuth({
            provider: pendingOAuthProvider as any,
            options: {
              redirectTo: `${window.location.origin}/auth?source=${pendingOAuthProvider}`,
            },
          });

          if (error) throw error;
        } catch (err: any) {
          toast({ title: "Redirect failed", description: err.message, variant: "destructive" });
        }

        setOpen(false);
        return;
      }

      if (avatarFile) {
        try {
          setUploading(true);
          const fileExt = avatarFile.name.split('.').pop();
          const filePath = `${uid}-${Date.now()}.${fileExt}`;

          const { error: uploadError } = await supabase.storage
            .from('avatars')
            .upload(filePath, avatarFile);

          if (uploadError) throw uploadError;

          const { data: { publicUrl } } = supabase.storage
            .from('avatars')
            .getPublicUrl(filePath);

          payload.avatar_url = publicUrl;
        } catch (uploadErr: any) {
          toast({ title: "Avatar upload failed", description: uploadErr.message, variant: "destructive" });
        } finally {
          setUploading(false);
        }
      }

      const { error } = await supabase.from("profiles").upsert(payload);
      if (error) throw error;

      toast({ title: "Profile saved" });
      setOpen(false);
      onFinish?.();
    } catch (err: any) {
      toast({ title: "Save failed", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const stepContent = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-4">

            <div>
              <Label>Full Name</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your full name"
                className={inputStyle}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <Label>Gender</Label>
                <Select>
                  <SelectTrigger className={inputStyle}>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#112240] border-white/10 text-white">
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Age</Label>
                <Input type="number" placeholder="18" className={inputStyle} />
              </div>
            </div>

            <div>
              <Label>Email</Label>
              <Input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className={inputStyle + " w-full"}
              />
            </div>

            <div>
              <Label>Password</Label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••"
                className={inputStyle}
              />
            </div>

            <Button
              onClick={handleSignUpStep}
              className="w-full bg-blue-600 hover:bg-blue-700 transition-all duration-300 hover:scale-[1.02]"
            >
              Create Account →
            </Button>

            <div className="text-center mt-2">
              <Button onClick={handleGoogleSignup} variant="ghost" className="w-full bg-white/5 border border-white/10 hover:bg-white/10 transition-all gap-2">
                <svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path fill="#4285F4" d="M21.35 11.1H12v2.8h5.35C16.9 16.05 14.7 18 12 18c-3.3 0-6-2.7-6-6s2.7-6 6-6c1.6 0 3 .6 4.05 1.6l2.2-2.2C17.3 3.7 14.8 2.5 12 2.5 6.8 2.5 2.5 6.8 2.5 12s4.3 9.5 9.5 9.5c5 0 9-3.6 9-8.5 0-.6-.1-1.2-.65-2z"/>
                </svg>
                <span>Sign up with Google</span>
              </Button>
              
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <Label>Short Bio</Label>
            <Textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell us about yourself"
              className={inputStyle}
            />

            <Label>Profile Picture</Label>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full overflow-hidden bg-white/5 border border-white/10 flex items-center justify-center">
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="text-white/50 text-xs text-center">No Image</div>
                )}
              </div>
              <Input type="file" accept="image/*" onChange={handleFileChange} className={inputStyle + " max-w-xs"} />
            </div>

            <Button
              onClick={() => setStep(3)}
              className="w-full bg-blue-600 hover:bg-blue-700 hover:scale-[1.02]"
            >
              Continue →
            </Button>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <Label>Where did you find us?</Label>

            <Select value={foundFrom} onValueChange={setFoundFrom}>
              <SelectTrigger className={inputStyle}>
                <SelectValue placeholder="Select source" />
              </SelectTrigger>
              <SelectContent className="bg-[#112240] border-white/10 text-white">
                <SelectItem value="linkedin">LinkedIn</SelectItem>
                <SelectItem value="instagram">Instagram</SelectItem>
                <SelectItem value="twitter">Twitter</SelectItem>
                <SelectItem value="other">Other Social Media</SelectItem>
              </SelectContent>
            </Select>

            <Button
              onClick={() => setStep(4)}
              className="w-full bg-blue-600 hover:bg-blue-700 hover:scale-[1.02]"
            >
              Continue →
            </Button>
          </div>
        );

      case 4:
        return (
          <div className="space-y-4">
            <Label>Purpose</Label>

            <Select value={purpose} onValueChange={setPurpose}>
              <SelectTrigger className={inputStyle}>
                <SelectValue placeholder="Select purpose" />
              </SelectTrigger>
              <SelectContent className="bg-[#112240] border-white/10 text-white">
                <SelectItem value="personal">Personal Use</SelectItem>
                <SelectItem value="student">Student</SelectItem>
                <SelectItem value="organization">Organization</SelectItem>
                <SelectItem value="employee">Employee</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>

            <Button
              onClick={handleSave}
              disabled={saving}
              className="w-full bg-green-600 hover:bg-green-700 hover:scale-[1.02]"
            >
              {saving ? "Saving..." : pendingOAuthProvider ? "Save & Continue to Google →" : "Finish Setup "}
            </Button>
          </div>
        );
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        className="bg-[#112240] border-white/10 text-white fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 max-w-md w-full shadow-2xl rounded-2xl before:absolute before:inset-0 before:rounded-2xl before:bg-gradient-to-r before:from-blue-500/20 before:to-purple-500/20 before:blur-xl before:-z-10"
      >
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-center">
            Welcome To ALSA AI 
          </DialogTitle>
        </DialogHeader>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.35 }}
          >
            {stepContent()}
          </motion.div>
        </AnimatePresence>

        <DialogFooter>
          <div className="text-center w-full text-sm text-white/60">
            Step {step} of 4
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SignupWizard;
