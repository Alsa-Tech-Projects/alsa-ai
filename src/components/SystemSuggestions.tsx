import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Folder, FileText, Monitor } from 'lucide-react';

interface SystemData {
  applications: string[];
  commonFolders: string[];
  recentFiles: string[];
}

interface SystemSuggestionsProps {
  systemData: SystemData | null;
  onSelect: (command: string) => void;
  searchQuery: string;
}

const SystemSuggestions = ({ systemData, onSelect, searchQuery }: SystemSuggestionsProps) => {
  const [filteredSuggestions, setFilteredSuggestions] = useState<{
    apps: string[];
    folders: string[];
    files: string[];
  }>({ apps: [], folders: [], files: [] });

  useEffect(() => {
    if (!systemData || !searchQuery) {
      setFilteredSuggestions({ apps: [], folders: [], files: [] });
      return;
    }

    const query = searchQuery.toLowerCase();
    
    setFilteredSuggestions({
      apps: systemData.applications.filter(app => 
        app.toLowerCase().includes(query)
      ).slice(0, 5),
      folders: systemData.commonFolders.filter(folder => 
        folder.toLowerCase().includes(query)
      ).slice(0, 5),
      files: systemData.recentFiles.filter(file => 
        file.toLowerCase().includes(query)
      ).slice(0, 5),
    });
  }, [systemData, searchQuery]);

  const totalSuggestions = 
    filteredSuggestions.apps.length + 
    filteredSuggestions.folders.length + 
    filteredSuggestions.files.length;

  if (totalSuggestions === 0) return null;

  return (
    <Card className="absolute bottom-full mb-2 w-full max-w-2xl bg-secondary/95 backdrop-blur-sm border-primary/20 shadow-lg z-50">
      <ScrollArea className="max-h-64">
        <div className="p-4 space-y-3">
          {filteredSuggestions.apps.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Monitor className="w-4 h-4 text-primary" />
                <span className="text-sm font-semibold text-foreground">Applications</span>
              </div>
              <div className="space-y-1">
                {filteredSuggestions.apps.map((app, idx) => (
                  <button
                    key={`app-${idx}`}
                    onClick={() => onSelect(`open ${app}`)}
                    className="w-full text-left px-3 py-2 rounded hover:bg-primary/10 transition-colors"
                  >
                    <span className="text-sm text-foreground">{app}</span>
                    <Badge variant="outline" className="ml-2 text-xs">
                      open {app}
                    </Badge>
                  </button>
                ))}
              </div>
            </div>
          )}

          {filteredSuggestions.folders.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Folder className="w-4 h-4 text-primary" />
                <span className="text-sm font-semibold text-foreground">Folders</span>
              </div>
              <div className="space-y-1">
                {filteredSuggestions.folders.map((folder, idx) => (
                  <button
                    key={`folder-${idx}`}
                    onClick={() => onSelect(`open explorer ${folder}`)}
                    className="w-full text-left px-3 py-2 rounded hover:bg-primary/10 transition-colors"
                  >
                    <span className="text-sm text-foreground truncate block">{folder}</span>
                    <Badge variant="outline" className="ml-2 text-xs">
                      open folder
                    </Badge>
                  </button>
                ))}
              </div>
            </div>
          )}

          {filteredSuggestions.files.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <FileText className="w-4 h-4 text-primary" />
                <span className="text-sm font-semibold text-foreground">Recent Files</span>
              </div>
              <div className="space-y-1">
                {filteredSuggestions.files.map((file, idx) => (
                  <button
                    key={`file-${idx}`}
                    onClick={() => onSelect(`open ${file}`)}
                    className="w-full text-left px-3 py-2 rounded hover:bg-primary/10 transition-colors"
                  >
                    <span className="text-sm text-foreground truncate block">{file}</span>
                    <Badge variant="outline" className="ml-2 text-xs">
                      open file
                    </Badge>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
    </Card>
  );
};

export default SystemSuggestions;
