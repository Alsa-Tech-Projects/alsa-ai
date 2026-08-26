// Add 3.6 flash Gemini Model
import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { KeyRound, Sparkles, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Google Gemini models (Gemini 3.6 Flash as default)
export const GEMINI_MODELS: { value: string; label: string }[] = [
  { value: 'gemini-3.6-flash', label: 'Gemini 3.6 Flash (Most Powerful & Latest Model)' },
  { value: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro' },
  { value: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash' },
  { value: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash' },
  { value: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro' },
];

const LS_KEY = 'alsa_user_api_key';
const LS_MODEL = 'alsa_user_model';
const LS_SEEN = 'alsa_byok_onboarded';

const ApiKeyOnboarding = () => {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState('gemini-3.6-flash');

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!mounted || !session) return;
      const hasKey = localStorage.getItem(LS_KEY);
      const seen = localStorage.getItem(LS_SEEN);
      if (!hasKey && !seen) setOpen(true);
    })();
    return () => { mounted = false; };
  }, []);

  const save = () => {
    if (!apiKey.trim() || apiKey.trim().length < 20) {
      toast({ title: 'Invalid Key', description: 'Please enter a valid Google AI API key', variant: 'destructive' });
      return;
    }
    localStorage.setItem(LS_KEY, apiKey.trim());
    localStorage.setItem(LS_MODEL, model);
    localStorage.setItem(LS_SEEN, '1');
    toast({ title: '✅ Key Saved', description: 'Your personal API key will now be used.' });
    setOpen(false);
  };

  const skip = () => {
    localStorage.setItem(LS_SEEN, '1');
    setOpen(false);
    toast({ title: 'Skipped', description: 'You can add it later from Settings.' });
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) skip(); }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" /> Welcome to Alsa AI!
          </DialogTitle>
          <DialogDescription>
            Add your own Google AI API key — this keeps your chats completely private and unlimited (without using our quota).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="byok-key" className="flex items-center gap-2">
              <KeyRound className="w-4 h-4" /> Google AI API Key
            </Label>
            <Input
              id="byok-key"
              type="password"
              placeholder="AIza..."
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="mt-2 font-mono"
              autoComplete="off"
            />
            <a
              href="https://aistudio.google.com/api-key"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-primary flex items-center gap-1 mt-2 hover:underline"
            >
              Get your free key here <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <div>
            <Label htmlFor="byok-model">Gemini Model</Label>
            <Select value={model} onValueChange={setModel}>
              <SelectTrigger id="byok-model" className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {GEMINI_MODELS.map(m => (
                  <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter className="gap-2 flex-col sm:flex-row">
          <Button variant="ghost" onClick={skip}>Skip for now</Button>
          <Button onClick={save}>Save & Continue</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ApiKeyOnboarding;
