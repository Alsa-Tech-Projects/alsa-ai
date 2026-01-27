import { Button } from '@/components/ui/button';
import { Youtube, Music2, Cloud, Search, Mail, Map, Chrome, Terminal, FolderOpen, Calculator } from 'lucide-react';

interface QuickActionsProps {
  onAction: (action: string) => void;
}

const QuickActions = ({ onAction }: QuickActionsProps) => {
  const webActions = [
    { icon: Youtube, label: 'YouTube', action: 'open youtube' },
    { icon: Music2, label: 'Spotify', action: 'open spotify' },
    { icon: Search, label: 'Google', action: 'open google' },
    { icon: Mail, label: 'Gmail', action: 'open gmail' },
    { icon: Map, label: 'Maps', action: 'open maps' },
    { icon: Cloud, label: 'Weather', action: 'what is the weather' },
  ];

  const pcActions = [
    { icon: Chrome, label: 'Browser', action: 'open chrome' },
    { icon: Terminal, label: 'CMD', action: 'open cmd' },
    { icon: FolderOpen, label: 'Explorer', action: 'open explorer' },
    { icon: Calculator, label: 'Calculator', action: 'open calculator' },
  ];

  return (
    <div className="w-full max-w-3xl space-y-4">
      <div>
        <p className="text-xs text-muted-foreground mb-2 text-center">Web Controls</p>
        <div className="flex flex-wrap gap-2 justify-center">
          {webActions.map((item) => {
            const Icon = item.icon;
            return (
              <Button
                key={item.action}
                variant="outline"
                size="sm"
                className="gap-2 bg-secondary/50 hover:bg-secondary border-primary/20"
                onClick={() => onAction(item.action)}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </Button>
            );
          })}
        </div>
      </div>

      <div>
        <p className="text-xs text-muted-foreground mb-2 text-center">PC Controls (Requires Bridge)</p>
        <div className="flex flex-wrap gap-2 justify-center">
          {pcActions.map((item) => {
            const Icon = item.icon;
            return (
              <Button
                key={item.action}
                variant="outline"
                size="sm"
                className="gap-2 bg-secondary/50 hover:bg-secondary border-accent/20"
                onClick={() => onAction(item.action)}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </Button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default QuickActions;
