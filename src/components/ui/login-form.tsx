import * as React from "react";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";

type FormValues = {
  name: string;
  username: string;
  gender: string;
  profile: File | null;
  bio?: string;
};

interface LoginFormProps {
  onSubmit?: (values: FormValues) => void | Promise<void>;
  defaultValues?: Partial<FormValues>;
}

export default function LoginForm({ onSubmit, defaultValues }: LoginFormProps) {
  const form = useForm<FormValues>({
    defaultValues: {
      name: "",
      username: "",
      gender: "prefer_not_say",
      profile: null,
      bio: "",
      ...defaultValues,
    },
  });

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const watchProfile = form.watch("profile");

  useEffect(() => {
    if (watchProfile) {
      const url = URL.createObjectURL(watchProfile as File);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    }

    setPreviewUrl(null);
  }, [watchProfile]);

  async function handleSubmit(data: FormValues) {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({ title: "Not signed in", description: "Please sign in to save your profile", variant: "destructive" });
        setSaving(false);
        return;
      }

      let profileUrl: string | null = null;

      if (data.profile) {
        setUploading(true);
        const file = data.profile as File;
        const fileExt = file.name.split('.').pop();
        const filePath = `${user.id}-${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file);
        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath);
        profileUrl = publicUrl ?? null;
        setUploading(false);
      }

      const profileData = {
        user_id: user.id,
        display_name: data.name,
        avatar_url: profileUrl,
        bio: data.bio,
      };

      const { error: upsertError } = await supabase.from('profiles').upsert(profileData, { onConflict: 'user_id' });
      if (upsertError) throw upsertError;

      // Log profile update event
      await supabase.from('login_events').insert({
        user_id: user.id,
        username: data.username ?? user.email ?? null,
        name: data.name ?? null,
        gender: data.gender ?? null,
        profile_url: profileUrl ?? null,
        bio: data.bio ?? null,
        event_type: 'profile_update',
      });

      toast({ title: "Saved", description: "Profile saved successfully" });
      onSubmit?.(data);

      // If previewUrl was a local blob URL, keep preview showing the uploaded public URL
      if (profileUrl) setPreviewUrl(profileUrl);
    } catch (err: any) {
      console.error(err);
      toast({ title: "Save failed", description: err.message ?? 'Unknown error', variant: 'destructive' });
    } finally {
      setUploading(false);
      setSaving(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          rules={{ required: "Name is required" }}
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-white text-sm tracking-widest">Name</FormLabel>
              <FormControl>
                <Input
                  placeholder="Full name"
                  className="bg-black/50 border-cyan-400 text-white placeholder:text-white/60 focus:border-cyan-400 transition-colors"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="username"
          rules={{ required: "Username is required", minLength: { value: 3, message: "Minimum 3 characters" } }}
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-white text-sm tracking-widest">Username</FormLabel>
              <FormControl>
                <Input
                  placeholder="username"
                  className="bg-black/50 border-cyan-400 text-white placeholder:text-white/60 focus:border-cyan-400 transition-colors"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="gender"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-white text-sm tracking-widest">Gender</FormLabel>
              <FormControl>
                <Select defaultValue={String(field.value)} onValueChange={field.onChange}>
                  <SelectTrigger className="bg-black/50 border-cyan-400 text-white">
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="non_binary">Non-binary</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                    <SelectItem value="prefer_not_say">Prefer not to say</SelectItem>
                  </SelectContent>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="profile"
          rules={{ required: "Profile image is required" }}
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-white text-sm tracking-widest">Profile</FormLabel>
              <FormControl>
                <div className="flex items-center gap-3">
                  <label className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-white text-cyan-700 cursor-pointer hover:bg-white/95">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files && e.target.files[0] ? e.target.files[0] : null;
                        field.onChange(file);
                      }}
                    />
                    <span className="text-sm font-medium">Choose file</span>
                  </label>
                  <div className="text-sm text-white/70">{field.value ? (field.value as File).name : "No file chosen"}</div>
                </div>
              </FormControl>
              <FormDescription className="text-white/70">Upload a profile image (JPG / PNG). This is required.</FormDescription>
              <FormMessage />

              {previewUrl ? (
                <div className="mt-2 flex items-center gap-3">
                  <img src={previewUrl} alt="preview" className="h-14 w-14 rounded-md object-cover border border-white/20 ring-1 ring-cyan-400/20" />
                  <div className="text-sm text-white/80">Preview of the selected image</div>
                </div>
              ) : null}
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="bio"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-white text-sm tracking-widest">Bio</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Short bio (optional)"
                  className="bg-black/50 border-cyan-400 text-white placeholder:text-white/60 min-h-[100px] focus:border-cyan-400 transition-colors"
                  {...field}
                />
              </FormControl>
              <FormDescription className="text-white/70">Tell others a bit about yourself (optional).</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="mt-4">
          <Button type="submit" disabled={saving} className="w-full bg-white text-cyan-700 hover:bg-white/95 border border-cyan-200 font-bold tracking-widest">
            {saving ? 'SAVING...' : 'Save'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
