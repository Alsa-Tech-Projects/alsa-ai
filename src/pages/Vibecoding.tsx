import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useSubscription } from "@/hooks/useSubscription";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Sheet, SheetContent, SheetTrigger,
} from "@/components/ui/sheet";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Send, Paperclip, Code2, Eye, Plus, Database, Github,
  Crown, Loader2, Sparkles, Download, X, ArrowLeft, MessageSquare, Menu, MoreVertical, Home,
} from "lucide-react";

interface VibeMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

interface VibeProject {
  id: string;
  name: string;
  files: Record<string, string>;
  supabase_url: string | null;
  supabase_anon_key: string | null;
  github_repo: string | null;
}

type MobileTab = "chat" | "preview" | "code";

export default function Vibecoding() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const sub = useSubscription();
  const isMobile = useIsMobile();
  const [user, setUser] = useState<any>(null);

  const [projects, setProjects] = useState<VibeProject[]>([]);
  const [activeProject, setActiveProject] = useState<VibeProject | null>(null);
  const [messages, setMessages] = useState<VibeMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [progressSteps, setProgressSteps] = useState<string[]>([]);
  const [creditsLeft, setCreditsLeft] = useState<number>(5);

  const [view, setView] = useState<"preview" | "code">("preview");
  const [previewHtml, setPreviewHtml] = useState<string>("");
  const [activeFile, setActiveFile] = useState<string>("");
  const [mobileTab, setMobileTab] = useState<MobileTab>("chat");
  const [projectDrawer, setProjectDrawer] = useState(false);

  const [attachments, setAttachments] = useState<{ name: string; text: string }[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  const [supabaseDlg, setSupabaseDlg] = useState(false);
  const [supabaseUrl, setSupabaseUrl] = useState("");
  const [supabaseKey, setSupabaseKey] = useState("");

  const [githubDlg, setGithubDlg] = useState(false);
  const [ghToken, setGhToken] = useState("");
  const [ghRepo, setGhRepo] = useState("");
  const [ghPrivate, setGhPrivate] = useState(false);
  const [pushing, setPushing] = useState(false);

  const isElite = sub.isElite || sub.isTeam;

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session?.user) { navigate("/auth"); return; }
      setUser(session.user);
    });
  }, [navigate]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("vibecoding_projects")
        .select("*")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false });
      if (data) setProjects(data as any);
    })();
    loadCredits();
  }, [user]);

  const loadCredits = async () => {
    if (!user) return;
    const today = new Date().toISOString().split("T")[0];
    const { data } = await supabase
      .from("vibecoding_credits")
      .select("credits_used")
      .eq("user_id", user.id)
      .eq("credit_date", today)
      .maybeSingle();
    setCreditsLeft(Math.max(0, 5 - (data?.credits_used ?? 0)));
  };

  const openProject = async (p: VibeProject) => {
    setActiveProject(p);
    setSupabaseUrl(p.supabase_url || "");
    setSupabaseKey(p.supabase_anon_key || "");
    const files = p.files || {};
    const firstFile = Object.keys(files).filter(f => f !== "__preview__.html")[0] || "";
    setActiveFile(firstFile);
    setPreviewHtml(files["__preview__.html"] || "");
    const { data } = await supabase
      .from("vibecoding_messages")
      .select("*")
      .eq("project_id", p.id)
      .order("created_at");
    setMessages((data as any) || []);
    setProjectDrawer(false);
  };

  const newProject = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("vibecoding_projects")
      .insert({ user_id: user.id, name: "New Vibe Project" })
      .select()
      .single();
    if (error) return toast({ title: "Failed to create project", variant: "destructive" });
    setProjects(prev => [data as any, ...prev]);
    openProject(data as any);
  };

  const handleAttach = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const out: { name: string; text: string }[] = [];
    for (const f of files.slice(0, 5)) {
      const text = await f.text().catch(() => "");
      out.push({ name: f.name, text: text.slice(0, 8000) });
    }
    setAttachments(prev => [...prev, ...out]);
    if (fileRef.current) fileRef.current.value = "";
  };

  const send = async () => {
    if (!input.trim() || !user) return;
    if (!isElite) {
      toast({ title: "Elite members only", description: "Please upgrade from the Pricing page.", variant: "destructive" });
      return;
    }
    if (creditsLeft <= 0) {
      toast({ title: "Daily 5 credits used", description: "Credits will refresh tomorrow.", variant: "destructive" });
      return;
    }

    let project = activeProject;
    if (!project) {
      const { data } = await supabase
        .from("vibecoding_projects")
        .insert({ user_id: user.id, name: "New Vibe Project" })
        .select().single();
      project = data as any;
      if (project) {
        setProjects(prev => [project!, ...prev]);
        setActiveProject(project);
      }
    }
    if (!project) return;

    const userMsg = input.trim();
    const userAttach = attachments;
    setInput("");
    setAttachments([]);
    setLoading(true);
    setProgressSteps([]);

    const tempUser: VibeMessage = {
      id: crypto.randomUUID(), role: "user", content: userMsg, created_at: new Date().toISOString(),
    };
    setMessages(prev => [...prev, tempUser]);
    await supabase.from("vibecoding_messages").insert({
      project_id: project.id, role: "user", content: userMsg,
      attachments: userAttach.map(a => ({ name: a.name })),
    });

    // Simulated step-by-step progress so user sees what's happening
    const steps = [
      "🧠 Analyzing your prompt...",
      "📁 Planning file structure (index.html, .env, src/, public/, supabase/)...",
      "🎨 Designing the UI with Tailwind...",
      "⚙️ Wiring up logic and components...",
      "✨ Building live preview...",
    ];
    let stepIdx = 0;
    setProgressSteps([steps[0]]);
    const stepTimer = setInterval(() => {
      stepIdx++;
      if (stepIdx < steps.length) {
        setProgressSteps((prev) => [...prev, steps[stepIdx]]);
      }
    }, 1800);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/vibe-coder`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          projectId: project.id,
          prompt: userMsg,
          history: messages.slice(-6).map(m => ({ role: m.role, content: m.content })),
          supabaseUrl: project.supabase_url,
          supabaseAnonKey: project.supabase_anon_key,
          attachments: userAttach,
        }),
      });
      const body = await resp.json();
      if (!resp.ok) throw new Error(body.error || "Generation failed");

      const explanation = body.explanation || "Done!";
      const newFiles = body.files || {};
      const previewHtmlOut = body.preview_html || "";

      const prevPreview = (project.files || {})["__preview__.html"] || "";
      const finalPreview = previewHtmlOut || prevPreview;
      const merged = { ...(project.files || {}), ...newFiles, "__preview__.html": finalPreview };
      await supabase.from("vibecoding_projects").update({
        files: merged,
        name: body.project_name || project.name,
      }).eq("id", project.id);

      const updated: VibeProject = { ...project, files: merged, name: body.project_name || project.name };
      setActiveProject(updated);
      setProjects(prev => prev.map(p => p.id === updated.id ? updated : p));
      setPreviewHtml(finalPreview);
      setActiveFile(Object.keys(newFiles)[0] || activeFile);

      const aiMsg: VibeMessage = {
        id: crypto.randomUUID(), role: "assistant", content: explanation, created_at: new Date().toISOString(),
      };
      setMessages(prev => [...prev, aiMsg]);
      await supabase.from("vibecoding_messages").insert({
        project_id: project.id, role: "assistant", content: explanation,
      });
      loadCredits();
      // On mobile, jump to preview after generation
      if (isMobile && previewHtmlOut) setMobileTab("preview");
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      clearInterval(stepTimer);
      setProgressSteps([]);
      setLoading(false);
    }
  };

  const saveSupabase = async () => {
    if (!activeProject) return;
    await supabase.from("vibecoding_projects").update({
      supabase_url: supabaseUrl, supabase_anon_key: supabaseKey,
    }).eq("id", activeProject.id);
    setActiveProject({ ...activeProject, supabase_url: supabaseUrl, supabase_anon_key: supabaseKey });
    setSupabaseDlg(false);
    toast({ title: "Supabase connected!" });
  };

  const pushGithub = async () => {
    if (!activeProject || !ghToken || !ghRepo) return;
    setPushing(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/vibe-github-push`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          projectId: activeProject.id, repoName: ghRepo, token: ghToken, isPrivate: ghPrivate,
        }),
      });
      const body = await resp.json();
      if (!resp.ok) throw new Error(body.error);
      toast({ title: "Pushed to GitHub!", description: body.url });
      setGithubDlg(false);
      setGhToken("");
    } catch (e: any) {
      toast({ title: "GitHub push failed", description: e.message, variant: "destructive" });
    } finally {
      setPushing(false);
    }
  };

  const downloadZip = () => {
    if (!activeProject) return;
    const files = activeProject.files || {};
    const blob = new Blob([JSON.stringify(files, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${activeProject.name || "vibe-project"}.json`;
    a.click();
  };

  const fileList = activeProject ? Object.keys(activeProject.files || {}).filter(f => f !== "__preview__.html") : [];

  /* ----------------------- UI sections ----------------------- */

  const ProjectsList = (
    <div className="flex flex-col h-full">
      <div className="p-3">
        <Button onClick={newProject} className="w-full bg-purple-600 hover:bg-purple-700">
          <Plus className="w-4 h-4 mr-1" /> New Project
        </Button>
      </div>
      <ScrollArea className="flex-1">
        <div className="px-2 space-y-1 pb-3">
          {projects.map(p => (
            <button key={p.id} onClick={() => openProject(p)}
              className={`w-full text-left px-3 py-2 rounded-lg text-xs truncate ${
                activeProject?.id === p.id ? "bg-purple-600/20 text-white border border-purple-500/30" : "text-white/60 hover:bg-white/5"
              }`}>
              {p.name}
            </button>
          ))}
          {projects.length === 0 && (
            <p className="text-xs text-white/30 p-3">No projects yet. Tap New Project to start.</p>
          )}
        </div>
      </ScrollArea>
    </div>
  );

  const ChatPanel = (
    <div className="flex flex-col h-full bg-black/20">
      <ScrollArea className="flex-1 p-3 sm:p-4">
        <div className="space-y-3">
          {messages.length === 0 && !loading && (
            <div className="text-center py-10 text-white/40 text-sm">
              <Sparkles className="w-8 h-8 mx-auto mb-2 text-purple-400" />
              <p>What do you want to build?</p>
              <p className="text-xs mt-1">"Cafe website with menu and contact form"</p>
            </div>
          )}
          {messages.map(m => (
            <div key={m.id} className={`p-3 rounded-xl text-sm leading-relaxed ${
              m.role === "user" ? "bg-purple-600/20 border border-purple-500/20 ml-4 sm:ml-6" : "bg-white/5 border border-white/10 mr-4 sm:mr-6"
            }`}>
              <div className="text-[10px] uppercase tracking-wider text-white/40 mb-1">
                {m.role === "user" ? "You" : "Vibe Coder"}
              </div>
              <div className="whitespace-pre-wrap">{m.content}</div>
            </div>
          ))}
          {loading && (
            <div className="bg-white/5 border border-white/10 mr-4 sm:mr-6 p-3 rounded-xl text-sm text-white/80 space-y-1.5">
              <div className="flex items-center gap-2 text-purple-300 font-medium">
                <Loader2 className="w-4 h-4 animate-spin" /> Vibe Coder is working...
              </div>
              {progressSteps.map((s, i) => (
                <div key={i} className="text-xs text-white/70 pl-1 animate-fade-in">
                  {s}
                </div>
              ))}
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="border-t border-white/10 p-3 space-y-2">
        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {attachments.map((a, i) => (
              <Badge key={i} variant="outline" className="text-[10px] border-white/20">
                {a.name}
                <X className="w-3 h-3 ml-1 cursor-pointer" onClick={() => setAttachments(prev => prev.filter((_, j) => j !== i))} />
              </Badge>
            ))}
          </div>
        )}
        <Textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); send(); }
          }}
          placeholder={isElite ? "Describe your app..." : "Upgrade to Elite to use Vibe Coding"}
          className="min-h-[90px] bg-black/40 border-white/10 resize-none text-sm"
          disabled={!isElite || loading}
        />
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => fileRef.current?.click()} className="border-white/10 bg-white/5" disabled={!isElite}>
            <Paperclip className="w-4 h-4" />
          </Button>
          <input ref={fileRef} type="file" multiple hidden onChange={handleAttach} />
          <Button size="sm" onClick={send} disabled={loading || !input.trim() || !isElite} className="ml-auto bg-purple-600 hover:bg-purple-700">
            <Send className="w-4 h-4 mr-1" /> Send
          </Button>
        </div>
      </div>
    </div>
  );

  const PreviewPanel = (
    <div className="flex flex-col h-full bg-black/10 min-w-0">
      <div className="h-10 border-b border-white/10 flex items-center px-3 gap-2 bg-black/30 overflow-x-auto">
        <Button size="sm" variant={view === "preview" ? "default" : "ghost"} onClick={() => setView("preview")} className="h-7 text-xs flex-shrink-0">
          <Eye className="w-3.5 h-3.5 mr-1" /> Preview
        </Button>
        <Button size="sm" variant={view === "code" ? "default" : "ghost"} onClick={() => setView("code")} className="h-7 text-xs flex-shrink-0">
          <Code2 className="w-3.5 h-3.5 mr-1" /> Code
        </Button>
        {view === "code" && fileList.length > 0 && (
          <select value={activeFile} onChange={e => setActiveFile(e.target.value)} className="ml-2 bg-black/50 border border-white/10 text-xs rounded px-2 py-1 max-w-[60%]">
            {fileList.map(f => <option key={f} value={f}>{f}</option>)}
          </select>
        )}
      </div>
      <div className="flex-1 min-h-0">
        {view === "preview" ? (
          previewHtml ? (
            <iframe
              title="preview"
              srcDoc={previewHtml}
              sandbox="allow-scripts allow-forms allow-same-origin"
              className="w-full h-full bg-white"
            />
          ) : (
            <div className="h-full flex items-center justify-center text-white/40 text-sm p-4 text-center">
              Preview will appear here — generate something first.
            </div>
          )
        ) : (
          <ScrollArea className="h-full">
            <pre className="p-4 text-xs text-green-300 whitespace-pre-wrap font-mono break-all">
              {activeProject?.files?.[activeFile] || "// Select a file"}
            </pre>
          </ScrollArea>
        )}
      </div>
    </div>
  );

  return (
    <div className="h-screen w-full bg-[#0a0a0a] text-white flex flex-col overflow-hidden">
      {/* Top bar */}
      <header className="h-14 border-b border-white/10 flex items-center px-2 sm:px-4 gap-2 sm:gap-3 bg-black/40 backdrop-blur">
        {isMobile ? (
          <Sheet open={projectDrawer} onOpenChange={setProjectDrawer}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="text-white/70 h-9 w-9">
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 bg-[#0a0a0a] border-white/10 p-0 text-white">
              <div className="h-14 border-b border-white/10 flex items-center px-4 font-semibold">Projects</div>
              <div className="h-[calc(100%-3.5rem)]">{ProjectsList}</div>
            </SheetContent>
          </Sheet>
        ) : (
          <Button variant="ghost" size="sm" onClick={() => navigate("/Chat")} className="text-white/70">
            <ArrowLeft className="w-4 h-4 mr-1" /> Back
          </Button>
        )}

        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="text-sm font-bold truncate">Alsa Vibe Coders</div>
            <div className="text-[10px] text-white/40 hidden sm:block">Build full apps with prompts</div>
          </div>
        </div>

        <div className="ml-auto flex items-center gap-1 sm:gap-2">
          <Badge className="bg-purple-600/20 text-purple-300 border border-purple-500/30 text-[10px] sm:text-xs px-1.5 sm:px-2.5">
            <Crown className="w-3 h-3 mr-1" />
            <span className="hidden sm:inline">{isElite ? `${creditsLeft}/5 credits today` : "Elite Only"}</span>
            <span className="sm:hidden">{isElite ? `${creditsLeft}/5` : "Elite"}</span>
          </Badge>
          {activeProject && !isMobile && (
            <>
              <Button size="sm" variant="outline" onClick={() => setSupabaseDlg(true)} className="border-white/10 bg-white/5">
                <Database className="w-3.5 h-3.5 mr-1" />
                {activeProject.supabase_url ? "Supabase ✓" : "Supabase"}
              </Button>
              <Button size="sm" variant="outline" onClick={() => setGithubDlg(true)} className="border-white/10 bg-white/5">
                <Github className="w-3.5 h-3.5 mr-1" /> GitHub
              </Button>
              <Button size="sm" variant="outline" onClick={downloadZip} className="border-white/10 bg-white/5">
                <Download className="w-3.5 h-3.5 mr-1" /> Export
              </Button>
            </>
          )}
          {activeProject && isMobile && (
            <>
              <Button size="icon" variant="outline" onClick={() => setSupabaseDlg(true)} className="border-white/10 bg-white/5 h-8 w-8">
                <Database className="w-3.5 h-3.5" />
              </Button>
              <Button size="icon" variant="outline" onClick={() => setGithubDlg(true)} className="border-white/10 bg-white/5 h-8 w-8">
                <Github className="w-3.5 h-3.5" />
              </Button>
            </>
          )}

          {/* 3-dot menu — always visible, includes Back to Alsa AI */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="icon" variant="ghost" className="text-white/70 h-8 w-8">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-[#1a1a1a] border-white/10 text-white">
              <DropdownMenuItem onClick={() => navigate("/Chat")} className="cursor-pointer">
                <Home className="w-4 h-4 mr-2" /> Back to Alsa AI
              </DropdownMenuItem>
              {activeProject && (
                <>
                  <DropdownMenuSeparator className="bg-white/10" />
                  <DropdownMenuItem onClick={() => setSupabaseDlg(true)} className="cursor-pointer">
                    <Database className="w-4 h-4 mr-2" /> Connect Supabase
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setGithubDlg(true)} className="cursor-pointer">
                    <Github className="w-4 h-4 mr-2" /> Push to GitHub
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={downloadZip} className="cursor-pointer">
                    <Download className="w-4 h-4 mr-2" /> Export Project
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Body */}
      {isMobile ? (
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 min-h-0">
            {mobileTab === "chat" && ChatPanel}
            {(mobileTab === "preview" || mobileTab === "code") && (
              <div className="h-full">
                {/* reuse PreviewPanel; sync view with mobileTab */}
                {(() => { if (mobileTab === "code" && view !== "code") setView("code"); if (mobileTab === "preview" && view !== "preview") setView("preview"); return null; })()}
                {PreviewPanel}
              </div>
            )}
          </div>
          {/* Bottom tab bar */}
          <nav className="h-14 border-t border-white/10 bg-black/40 grid grid-cols-3">
            <button onClick={() => setMobileTab("chat")} className={`flex flex-col items-center justify-center text-[11px] gap-0.5 ${mobileTab === "chat" ? "text-purple-300" : "text-white/50"}`}>
              <MessageSquare className="w-4 h-4" /> Chat
            </button>
            <button onClick={() => { setMobileTab("preview"); setView("preview"); }} className={`flex flex-col items-center justify-center text-[11px] gap-0.5 ${mobileTab === "preview" ? "text-purple-300" : "text-white/50"}`}>
              <Eye className="w-4 h-4" /> Preview
            </button>
            <button onClick={() => { setMobileTab("code"); setView("code"); }} className={`flex flex-col items-center justify-center text-[11px] gap-0.5 ${mobileTab === "code" ? "text-purple-300" : "text-white/50"}`}>
              <Code2 className="w-4 h-4" /> Code
            </button>
          </nav>
        </div>
      ) : (
        <div className="flex-1 flex min-h-0">
          <aside className="w-56 border-r border-white/10 bg-black/30">{ProjectsList}</aside>
          <section className="w-[380px] border-r border-white/10">{ChatPanel}</section>
          <main className="flex-1 min-w-0">{PreviewPanel}</main>
        </div>
      )}

      {/* Supabase dialog */}
      <Dialog open={supabaseDlg} onOpenChange={setSupabaseDlg}>
        <DialogContent className="bg-[#1a1a1a] border-white/10 text-white max-w-[95vw] sm:max-w-md">
          <DialogHeader><DialogTitle>Connect your Supabase</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Input placeholder="https://xxx.supabase.co" value={supabaseUrl} onChange={e => setSupabaseUrl(e.target.value)} className="bg-black/40 border-white/10" />
            <Input placeholder="anon public key" value={supabaseKey} onChange={e => setSupabaseKey(e.target.value)} className="bg-black/40 border-white/10" />
            <p className="text-xs text-white/40">These keys will be used inside the generated app.</p>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setSupabaseDlg(false)}>Cancel</Button>
            <Button onClick={saveSupabase} className="bg-purple-600">Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* GitHub dialog */}
      <Dialog open={githubDlg} onOpenChange={setGithubDlg}>
        <DialogContent className="bg-[#1a1a1a] border-white/10 text-white max-w-[95vw] sm:max-w-md">
          <DialogHeader><DialogTitle>Push to GitHub</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <p className="text-xs text-white/60 mb-1">Personal Access Token (Classic, scope: repo)</p>
              <Input type="password" placeholder="ghp_..." value={ghToken} onChange={e => setGhToken(e.target.value)} className="bg-black/40 border-white/10" />
              <a href="https://github.com/settings/tokens/new?scopes=repo&description=Alsa%20Vibe%20Coders" target="_blank" className="text-[11px] text-purple-300 underline">
                Create a token here →
              </a>
            </div>
            <Input placeholder="repo-name" value={ghRepo} onChange={e => setGhRepo(e.target.value)} className="bg-black/40 border-white/10" />
            <label className="flex items-center gap-2 text-xs text-white/70">
              <input type="checkbox" checked={ghPrivate} onChange={e => setGhPrivate(e.target.checked)} /> Private repo
            </label>
            {isMobile && (
              <Button variant="outline" onClick={downloadZip} className="w-full border-white/10 bg-white/5">
                <Download className="w-4 h-4 mr-1" /> Export project
              </Button>
            )}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setGithubDlg(false)}>Cancel</Button>
            <Button onClick={pushGithub} disabled={pushing || !ghToken || !ghRepo} className="bg-purple-600">
              {pushing ? <Loader2 className="w-4 h-4 animate-spin" /> : "Push to GitHub"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
