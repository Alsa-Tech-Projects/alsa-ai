import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area'; // Check if you have this component
import { Trash2, Plus } from 'lucide-react';
import { getMemory, addMemory, deleteMemory, type Memory } from '@/utils/memoryManager';

const MemoryManager = () => {
  const [memories, setMemories] = useState<Memory>({});
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');

  useEffect(() => {
    setMemories(getMemory());
  }, []);

  const handleAddMemory = () => {
    if (newKey.trim() && newValue.trim()) {
      addMemory(newKey.trim(), newValue.trim());
      setMemories(getMemory());
      setNewKey('');
      setNewValue('');
    }
  };

  const handleDeleteMemory = (key: string) => {
    deleteMemory(key);
    setMemories(getMemory());
  };

  return (
    <Card className="bg-secondary/20 border-primary/20 backdrop-blur-md">
      <CardHeader>
        <CardTitle className="text-primary text-sm tracking-widest uppercase">Memory Bank</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        
        {/* --- SCROLLABLE AREA START --- */}
        <ScrollArea className="h-[300px] pr-4"> 
          {/* h-[300px] matlab 300px ke baad slider aa jayega */}
          <div className="space-y-2">
            {Object.entries(memories).length > 0 ? (
              Object.entries(memories).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10 group hover:border-blue-500/50 transition-all">
                  <div className="flex-1 min-w-0 mr-2">
                    <p className="text-blue-400 text-xs font-mono uppercase tracking-tighter">
                      {key.replace(/_/g, ' ')}
                    </p>
                    <p className="text-white text-sm truncate">{value}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteMemory(key)}
                    className="opacity-0 group-hover:opacity-100 text-destructive hover:bg-destructive/10 transition-opacity"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))
            ) : (
              <div className="text-center py-10 text-white/20 text-sm italic">
                No neural data stored...
              </div>
            )}
          </div>
        </ScrollArea>
        {/* --- SCROLLABLE AREA END --- */}

        <div className="pt-4 border-t border-white/10">
          <div className="grid grid-cols-2 gap-2 mb-2">
            <Input
              placeholder="Key"
              value={newKey}
              onChange={(e) => setNewKey(e.target.value)}
              className="bg-black/40 border-white/10 focus:border-blue-500/50"
            />
            <Input
              placeholder="Value"
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
              className="bg-black/40 border-white/10 focus:border-blue-500/50"
            />
          </div>
          <Button
            onClick={handleAddMemory}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white shadow-[0_0_15px_rgba(37,99,235,0.4)]"
          >
            <Plus className="w-4 h-4 mr-2" />
            Store Memory
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default MemoryManager;
