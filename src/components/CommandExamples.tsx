import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Globe, 
  Music, 
  Chrome, 
  FileText, 
  Calculator, 
  Terminal,
  FolderOpen,
  Monitor
} from 'lucide-react';

const CommandExamples = () => {
  const commands = [
    {
      category: "Web Apps",
      icon: Globe,
      examples: [
        { command: "open youtube", description: "Opens YouTube" },
        { command: "play song on youtube", description: "Search and play on YouTube" },
        { command: "open spotify", description: "Opens Spotify" },
        { command: "search google for AI", description: "Google search" },
        { command: "open gmail", description: "Opens Gmail" },
        { command: "open maps", description: "Opens Google Maps" },
      ]
    },
    {
      category: "PC Applications",
      icon: Monitor,
      examples: [
        { command: "open chrome", description: "Launch Chrome browser" },
        { command: "open notepad", description: "Launch Notepad" },
        { command: "open calculator", description: "Launch Calculator" },
        { command: "open vs code", description: "Launch VS Code" },
        { command: "open file explorer", description: "Launch File Explorer" },
        { command: "open control panel", description: "Open Control Panel" },
        { command: "open task manager", description: "Open Task Manager" },
      ]
    },
    {
      category: "File Operations",
      icon: FileText,
      examples: [
        { command: "create file test.txt", description: "Create a new file" },
        { command: "create folder MyFolder", description: "Create a new folder" },
        { command: "write hello to file.txt", description: "Write text to file" },
      ]
    },
    {
      category: "System Commands",
      icon: Terminal,
      examples: [
        { command: "open cmd", description: "Open Command Prompt" },
        { command: "open command prompt", description: "Open Command Prompt" },
      ]
    },
    {
      category: "Memory",
      icon: FolderOpen,
      examples: [
        { command: "remember my name is John", description: "Save personal info" },
        { command: "my favorite color is blue", description: "Save preferences" },
        { command: "what is my name", description: "Recall saved info" },
      ]
    }
  ];

  return (
    <Card className="bg-card/80 backdrop-blur border-primary/20">
      <CardHeader>
        <CardTitle>Command Examples</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {commands.map((category) => (
          <div key={category.category} className="space-y-3">
            <div className="flex items-center gap-2">
              <category.icon className="w-5 h-5 text-primary" />
              <h3 className="font-semibold text-lg">{category.category}</h3>
            </div>
            <div className="grid gap-2">
              {category.examples.map((example, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-3 p-3 bg-secondary/50 rounded-lg hover:bg-secondary/70 transition-colors"
                >
                  <div className="flex-1">
                    <code className="text-sm text-primary font-mono">
                      "{example.command}"
                    </code>
                    <p className="text-xs text-muted-foreground mt-1">
                      {example.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
        
        <div className="pt-4 border-t border-primary/20">
          <Badge variant="outline" className="border-primary/20">
            <Chrome className="w-3 h-3 mr-1" />
            PC Bridge Required for System Commands
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
};

export default CommandExamples;
