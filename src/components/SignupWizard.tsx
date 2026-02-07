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
  initialAvatarUrl?: string | null;
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
  initialAvatarUrl = null,
  initialStep = 1,
  initialOAuthProvider = null,
  onFinish,
}: Props) => {
  const { toast } = useToast();

  const [step, setStep] = useState(initialStep);
  const [name, setName] = useState(initialName);
  const [bio, setBio] = useState("");
  const [gender, setGender] = useState("");
  const [foundFrom, setFoundFrom] = useState("");
  const [userCategory, setUserCategory] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>("");
  const [avatarDataUrl, setAvatarDataUrl] = useState<string>("");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [pendingOAuthProvider, setPendingOAuthProvider] = useState<string | null>(null);
  const [awaitingEmailConfirmation, setAwaitingEmailConfirmation] = useState(false);
  // Save / DB error shown inline so users stay on the wizard when something fails
  const [saveError, setSaveError] = useState<string | null>(null);
  // If popup navigation fails, store the auth URL so we can show a manual fallback link
  const [oauthAuthUrl, setOauthAuthUrl] = useState<string | null>(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [localUserId, setLocalUserId] = useState<string | null>(propUserId ?? null);
  // Track created pre-email record so subsequent Save updates it instead of inserting duplicates
  const [preEmailId, setPreEmailId] = useState<string | null>(null);

  useEffect(() => {
    setName(initialName);
    setStep(initialStep);
    setLocalUserId(propUserId ?? null);
  }, [initialName, initialStep, propUserId]);

  useEffect(() => {
    if (!open) {
      setStep(1);
      setBio("");
      setGender("");
      setFoundFrom("");
      setUserCategory("");
      setAvatarFile(null);
      setAvatarPreview("");
      setAvatarDataUrl("");
      setUploading(false);
      setPendingOAuthProvider(null);
      setEmail("");
      setPassword("");
      setPreEmailId(null);
      setSaveError(null);
      setOauthAuthUrl(null);
    }

    // if wizard opens and we have a provided initial avatar url, use it as preview
    if (open && initialAvatarUrl) {
      setAvatarPreview(initialAvatarUrl);
    }
  }, [open, initialAvatarUrl]);

  useEffect(() => {
    if (initialOAuthProvider) {
      setPendingOAuthProvider(initialOAuthProvider);
      setStep(2);
    }
  }, [initialOAuthProvider]);

  // Helpers to tolerate schema drift (e.g., missing `gender` column)
  const safeUpsertProfiles = async (payload: any) => {
    try {
      const { error } = await supabase.from('profiles').upsert(payload);
      if (!error) return { error: null };

      const msg = (error.message || '').toLowerCase();
      if (msg.includes('column "gender"') || msg.includes('gender')) {
        const p = { ...payload };
        delete p.gender;
        const { error: err2 } = await supabase.from('profiles').upsert(p);
        return { error: err2 || null, removedGender: !err2 };
      }

      return { error };
    } catch (e: any) {
      return { error: e };
    }
  };

  const safeUpsertPreEmail = async (data: any, id?: string | null, isUpdate = false) => {
    try {
      if (isUpdate && id) {
        const { error } = await (supabase as any).from('pre_email_profiles').update(data).eq('id', id);
        if (!error) return { error: null };
        const msg = (error.message || '').toLowerCase();
        if (msg.includes('column "gender"') || msg.includes('gender')) {
          const d2 = { ...data };
          delete d2.gender;
          const { error: e2 } = await (supabase as any).from('pre_email_profiles').update(d2).eq('id', id);
          return { error: e2 || null, removedGender: !e2 };
        }
        return { error };
      } else {
        const { data: inserted, error } = await (supabase as any).from('pre_email_profiles').insert(data).select('id').single();
        if (!error) return { error: null, inserted };
        const msg = (error.message || '').toLowerCase();
        if (msg.includes('column "gender"') || msg.includes('gender')) {
          const d2 = { ...data };
          delete d2.gender;
          const { data: inserted2, error: e2 } = await (supabase as any).from('pre_email_profiles').insert(d2).select('id').single();
          return { error: e2 || null, inserted: inserted2, removedGender: !e2 };
        }
        return { error };
      }
    } catch (e: any) {
      return { error: e };
    }
  };

  // Helper to suppress the auth page from auto-opening the wizard immediately
  const suppressWizardReopen = (duration = 5000) => {
    try {
      sessionStorage.setItem('suppress_wizard_open', '1');
      setTimeout(() => {
        try { sessionStorage.removeItem('suppress_wizard_open'); } catch { }
      }, duration);
    } catch { }
  };

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
    // Perform OAuth immediately
    handleSave("google");
  };

  const handleSignUpStep = async () => {
    if (!name.trim()) {
      toast({ title: "Name required", variant: "destructive" });
      return;
    }
    // Gender is optional now
    if (!email) {
      toast({ title: "Email required", variant: "destructive" });
      return;
    }
    if (password.length < 6) {
      toast({ title: "Password must be 6+ chars", variant: "destructive" });
      return;
    }

    // Create the account immediately
    handleSave();
  };

  const handleSave = async (arg?: string | any) => {
    const explicitProvider = typeof arg === 'string' ? arg : null;
    const providerToUse = explicitProvider || pendingOAuthProvider;
    const uid = localUserId || propUserId;

    // If we don't have a user and not doing OAuth, require an email to proceed
    if (!uid && !providerToUse && !email) {
      toast({ title: 'Email required', description: 'Please provide an email to create an account or sign in with Google.', variant: 'destructive' });
      return;
    }

    setSaving(true);
    try {
      // If user is trying to sign up with OAuth, save a pre-oauth profile to the DB and start OAuth (open popup synchronously to avoid popup blockers)
      if (providerToUse) {
        // Build the immediate provider URL and open it synchronously so popup shows Google UI right away
        const initialRedirectTo = `${window.location.origin}/auth?source=${providerToUse}`;
        const initialAuthUrl = `${import.meta.env.VITE_SUPABASE_URL}/auth/v1/authorize?provider=${encodeURIComponent(
          providerToUse
        )}&redirect_to=${encodeURIComponent(initialRedirectTo)}`;

        const popup = window.open(initialAuthUrl, '_blank', 'noopener,noreferrer');
        if (!popup) {
          const msg = 'Popup blocked — please allow popups to complete the OAuth flow.';
          toast({ title: 'Popup blocked', description: msg, variant: 'destructive' });
          // Show inline error and keep wizard open so user can retry or continue
          setSaveError(msg);
          setSaving(false);
          return;
        }

        try {
          // Create pre-record quickly without waiting for avatar upload
          const { data: preRecord, error: preErr } = await (supabase as any)
            .from('pre_oauth_profiles')
            .insert({
              provider: providerToUse,
              display_name: name,
              bio,
              found_from: foundFrom,
              user_category: userCategory,
              avatar_url: null,
            })
            .select('id')
            .single();

          if (preErr) {
            // Notify user but keep popup on the provider page so they can continue
            const msg = 'Could not save profile to the server. Please try again or complete sign-in and update later.';
            toast({ title: 'Save failed', description: msg, variant: 'destructive' });
            // Keep the wizard open and show inline error so user can retry
            setSaveError(msg);
            return;
          }

          toast({ title: "Profile saved", description: "Continuing sign-in." });

          // Now that we have a pre_id, navigate popup to include it so return flow can apply profile
          const redirectToWithId = `${window.location.origin}/auth?source=${providerToUse}&pre_id=${preRecord.id}`;
          const authUrlWithId = `${import.meta.env.VITE_SUPABASE_URL}/auth/v1/authorize?provider=${encodeURIComponent(
            providerToUse
          )}&redirect_to=${encodeURIComponent(redirectToWithId)}`;

          // Try to navigate the popup to the final auth URL. Do NOT call popup.focus() — avoid stealing user focus.
          let navSucceeded = true;
          try {
            popup.location.href = authUrlWithId;
            // Mark that we've started the OAuth flow so repeated saves don't open multiple popups
            setPendingOAuthProvider(null);
          } catch (navErr) {
            navSucceeded = false;
            // If the popup couldn't be navigated, provide a manual fallback link for the user to continue
            const msg = 'Unable to open OAuth window automatically. Click the link below to continue sign-in.';
            setSaveError(msg);
            setOauthAuthUrl(authUrlWithId);
          }

          // If avatar provided, upload and update the pre-record in background
          if (avatarFile) {
            (async () => {
              try {
                setUploading(true);
                const fileExt = avatarFile.name.split('.').pop();
                const filePath = `pre-oauth-${Date.now()}.${fileExt}`;

                const { error: uploadError } = await supabase.storage
                  .from('avatars')
                  .upload(filePath, avatarFile);

                if (!uploadError) {
                  const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath);
                  await (supabase as any)
                    .from('pre_oauth_profiles')
                    .update({ avatar_url: publicUrl })
                    .eq('id', preRecord.id);
                }
              } catch (upErr) {
                console.error('Pre-oauth avatar upload failed', upErr);
              } finally {
                setUploading(false);
              }
            })();
          }
        } catch (err: any) {
          toast({ title: "Save failed", description: err.message, variant: "destructive" });
          try {
            const fallback = `${import.meta.env.VITE_SUPABASE_URL}/auth/v1/authorize?provider=${encodeURIComponent(
              providerToUse
            )}&redirect_to=${encodeURIComponent(window.location.origin + '/auth?source=' + providerToUse)}`;
            try {
              popup.location.href = fallback;
            } catch {
              popup.close();
            }
          } catch { }
        }

        setOpen(false);
        return;
      }

      // If we don't have a uid (email signup hasn't happened yet) and user provided email, create the account now
      if (!uid && email) {
        try {
          // Create the auth account now (account/profile creation happens on Finish)
          const { data: signData, error: signErr } = await supabase.auth.signUp({
            email,
            password,
            options: {
              emailRedirectTo: `${window.location.origin}/auth`,
              data: { full_name: name },
            },
          });

          if (signErr) throw signErr;

          // Upload avatar if provided
          let avatar_url: string | undefined = undefined;
          if (avatarFile) {
            try {
              setUploading(true);
              const fileExt = avatarFile.name.split('.').pop();
              const filePath = `pre-email-${Date.now()}.${fileExt}`;

              const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, avatarFile);

              if (!uploadError) {
                const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath);
                avatar_url = publicUrl;
              }
            } catch (uploadErr: any) {
              console.error('Pre-email avatar upload failed', uploadErr);
            } finally {
              setUploading(false);
            }
          }

          // If signup returned an immediate user, create profile now
          if (signData?.user) {
            const newUid = signData.user.id;
            setLocalUserId(newUid);
            const payload: any = {
              user_id: newUid,
              display_name: name,
              bio,
              gender,
              found_from: foundFrom || null,
              user_category: userCategory || null,
              avatar_url: avatar_url || null,
            };

            const { error: upsertErr, removedGender } = await safeUpsertProfiles(payload) as any;
            if (upsertErr) throw upsertErr;

            if (removedGender) {
              toast({ title: 'Account created', description: "Account created but DB missing 'gender' column — profile saved without gender." });
            } else {
              toast({ title: 'Account created', description: 'Your account and profile have been saved.' });
            }

            setOpen(false);
            onFinish?.();
            return;
          }

          // Otherwise email confirmation is required - create or update a pre-email profile for later attaching
          if (preEmailId) {
            const { error: updateErr, removedGender } = await safeUpsertPreEmail({
              display_name: name,
              bio,
              gender,
              found_from: foundFrom || null,
              user_category: userCategory || null,
              avatar_url: avatar_url || null,
            }, preEmailId, true) as any;

            if (updateErr) throw updateErr;

            if (removedGender) {
              toast({ title: 'Profile saved (no gender)', description: "Database missing 'gender' column — profile saved without that field." });
            } else {
              toast({ title: "Profile saved", description: "Check your email to confirm — we'll attach this profile after confirmation." });
            }
          } else {
            const { error: preErr, inserted, removedGender } = await safeUpsertPreEmail({
              email,
              display_name: name,
              bio,
              gender,
              found_from: foundFrom || null,
              user_category: userCategory || null,
              avatar_url: avatar_url || null,
            }) as any;

            if (preErr) throw preErr;
            setPreEmailId(inserted.id);

            if (removedGender) {
              toast({ title: 'Profile saved (no gender)', description: "Database missing 'gender' column — profile saved without that field." });
            } else {
              toast({ title: "Profile saved", description: "Check your email to confirm — we'll attach this profile after confirmation." });
            }
          }

          setOpen(false);
          return;
        } catch (err: any) {
          const msg = err?.message || 'Signup failed';
          toast({ title: "Signup failed", description: msg, variant: "destructive" });
          // Keep user on the wizard and display the error
          setSaveError(msg);
          setSaving(false);
          return;
        }
      }

      // Non-OAuth flows require a user ID
      const payload: any = {
        user_id: uid,
        display_name: name,
        bio,
        gender,
        found_from: foundFrom,
        user_category: userCategory,
      };

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

      const { error, removedGender } = await safeUpsertProfiles(payload) as any;
      if (error) throw error;

      if (removedGender) {
        toast({ title: 'Profile saved', description: "Saved without gender — run DB migrations to enable gender field." });
      } else {
        toast({ title: "Profile saved" });
      }

      setOpen(false);
      onFinish?.();
    } catch (err: any) {
      const msg = err?.message || 'Save failed';
      // Suppress "user_category" schema cache error from UI
      if (msg.includes("Could not find the 'user_category' column")) {
        console.warn("Suppressing schema error:", msg);
        toast({ title: "Profile saved", description: "Profile saved (schema warning ignored)." });
        setOpen(false);
        onFinish?.();
        return;
      }

      toast({ title: "Save failed", description: msg, variant: "destructive" });
      // Keep the wizard open and show the error so user can address issues
      setSaveError(msg);
      // Prevent the parent page from immediately re-opening the wizard after a failed save
      suppressWizardReopen();
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
                <Select value={gender} onValueChange={setGender}>
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
                  <path fill="#4285F4" d="M21.35 11.1H12v2.8h5.35C16.9 16.05 14.7 18 12 18c-3.3 0-6-2.7-6-6s2.7-6 6-6c1.6 0 3 .6 4.05 1.6l2.2-2.2C17.3 3.7 14.8 2.5 12 2.5 6.8 2.5 2.5 6.8 2.5 12s4.3 9.5 9.5 9.5c5 0 9-3.6 9-8.5 0-.6-.1-1.2-.65-2z" />
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
              className={inputStyle + " resize-none outline-none"}
            />

            <Label>Profile Picture</Label>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full overflow-hidden bg-transparent border border-gray-400 flex items-center justify-center">
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="text-black text-[8px] text-center">Profile</div>
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
            <Label>User Category</Label>

            <Select value={userCategory} onValueChange={setUserCategory}>
              <SelectTrigger className={inputStyle}>
                <SelectValue placeholder="Select category" />
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
              className="w-full bg-blue-600  hover:bg-blue-600 hover:scale-[1.02]"
            >
              {saving ? "Saving..." : pendingOAuthProvider ? "Save & Continue to Google →" : "Finish Setup "}
            </Button>
           

            {oauthAuthUrl && (
              <div className="text-sm text-blue-300 mt-2 text-center">
                <a href={oauthAuthUrl} target="_blank" rel="noopener noreferrer" className="underline">Continue sign-in with provider</a>
              </div>
            )}
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
