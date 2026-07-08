import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { sendCommand } from "@/utils/pcBridge";

type DocType = "application" | "assignment" | "letter";

function getOutputPath(type: DocType): string {
  const raw = localStorage.getItem("alsa_output_paths");
  if (!raw) return "";
  try {
    const parsed = JSON.parse(raw);
    return parsed?.[type] ?? "";
  } catch {
    return "";
  }
}

function toSafeFileName(name: string) {
  return name.replace(/[\\/:*?"<>|]/g, "-").trim();
}

function buildTemplate(type: DocType, params: {
  fromName: string;
  toName: string;
  subject: string;
  body: string;
  date: string;
}) {
  const header = `${params.fromName}\nDate: ${params.date}`.trim();
  const toBlock = params.toName ? `\n\nTo,\n${params.toName}` : "";
  const subject = params.subject ? `\n\nSubject: ${params.subject}` : "";

  if (type === "assignment") {
    return `${header}${toBlock}${subject}\n\n${params.body}\n\nRegards,\n${params.fromName}`.trim();
  }

  if (type === "application") {
    return `${header}${toBlock}${subject}\n\nRespected Sir/Madam,\n\n${params.body}\n\nThank you.\n\nSincerely,\n${params.fromName}`.trim();
  }

  // letter
  return `${header}${toBlock}${subject}\n\nDear ${params.toName || "Sir/Madam"},\n\n${params.body}\n\nWarm regards,\n${params.fromName}`.trim();
}

export default function DocumentGenerator() {
  const { toast } = useToast();
  const [type, setType] = useState<DocType>("application");
  const [fromName, setFromName] = useState("Mohd Eisa");
  const [toName, setToName] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("Please write your content here...");
  const [fileName, setFileName] = useState("document");
  const [saving, setSaving] = useState(false);

  const date = useMemo(() => new Date().toLocaleDateString(), []);

  const preview = useMemo(
    () =>
      buildTemplate(type, {
        fromName,
        toName,
        subject,
        body,
        date,
      }),
    [type, fromName, toName, subject, body, date]
  );

  const handleSave = async () => {
    const baseDir = getOutputPath(type);

    if (!baseDir) {
      toast({
        title: "Set an output path first",
        description: `Go to Settings → Output Paths and set the ${type} path.`,
        variant: "destructive",
      });
      return;
    }

    const safeName = toSafeFileName(fileName || "document");
    const fullPath = `${baseDir}\\${safeName}.txt`;

    setSaving(true);
    try {
      // PC Bridge supports: write_file:{path}|{content}
      const result = await sendCommand(`write_file:${fullPath}|${preview}`);

      toast({
        title: result.success ? "Saved" : "Failed",
        description: result.message || (result.success ? `Saved to ${fullPath}` : "Could not save"),
        variant: result.success ? "default" : "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white/5 rounded-xl p-3 border border-white/5 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-[9px] font-bold uppercase tracking-widest text-white/40">
          Documents
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-[10px] text-white/50">Type</Label>
          <Select value={type} onValueChange={(v) => setType(v as DocType)}>
            <SelectTrigger className="h-8 bg-white/5 border-white/10 text-white text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="application">Application</SelectItem>
              <SelectItem value="assignment">Assignment</SelectItem>
              <SelectItem value="letter">Letter</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label className="text-[10px] text-white/50">File name</Label>
          <Input
            value={fileName}
            onChange={(e) => setFileName(e.target.value)}
            className="h-8 bg-white/5 border-white/10 text-white text-xs"
            placeholder="my-document"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-[10px] text-white/50">From</Label>
          <Input
            value={fromName}
            onChange={(e) => setFromName(e.target.value)}
            className="h-8 bg-white/5 border-white/10 text-white text-xs"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-[10px] text-white/50">To</Label>
          <Input
            value={toName}
            onChange={(e) => setToName(e.target.value)}
            className="h-8 bg-white/5 border-white/10 text-white text-xs"
            placeholder="Principal / Teacher / Company"
          />
        </div>
      </div>

      <div className="space-y-1">
        <Label className="text-[10px] text-white/50">Subject</Label>
        <Input
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          className="h-8 bg-white/5 border-white/10 text-white text-xs"
          placeholder="Leave Application / Assignment Submission"
        />
      </div>

      <div className="space-y-1">
        <Label className="text-[10px] text-white/50">Body</Label>
        <Textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          className="min-h-24 bg-white/5 border-white/10 text-white text-xs"
        />
      </div>

      <div className="space-y-2">
        <Button
          onClick={handleSave}
          disabled={saving}
          className="w-full h-9 text-xs"
        >
          {saving ? "Saving..." : "Save to PC"}
        </Button>
        <details className="text-[10px] text-white/40">
          <summary className="cursor-pointer">Preview</summary>
          <pre className="mt-2 whitespace-pre-wrap break-words bg-black/30 border border-white/10 rounded-lg p-2 max-h-40 overflow-auto">
{preview}
          </pre>
        </details>
      </div>
    </div>
  );
}
