import { useState, useRef } from 'react';
import { Upload, X, File, Image, Video, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface FileUploadProps {
  onFilesSelected: (files: FileInfo[]) => void;
  maxFiles?: number;
}

export interface FileInfo {
  name: string;
  type: string;
  size: number;
  preview?: string;
  data?: string; // base64
}

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB per file

export const FileUpload = ({ onFilesSelected, maxFiles = 10 }: FileUploadProps) => {
  const { toast } = useToast();
  const [selectedFiles, setSelectedFiles] = useState<FileInfo[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <Image className="w-4 h-4 text-blue-400" />;
    if (type.startsWith('video/')) return <Video className="w-4 h-4 text-purple-400" />;
    if (type.includes('pdf') || type.includes('document')) return <FileText className="w-4 h-4 text-red-400" />;
    return <File className="w-4 h-4 text-gray-400" />;
  };

  const processFiles = async (files: FileList) => {
    const validFiles: FileInfo[] = [];
    
    for (let i = 0; i < Math.min(files.length, maxFiles - selectedFiles.length); i++) {
      const file = files[i];
      
      if (file.size > MAX_FILE_SIZE) {
        toast({
          title: "File too large",
          description: `${file.name} exceeds 20MB limit`,
          variant: "destructive"
        });
        continue;
      }

      const fileInfo: FileInfo = {
        name: file.name,
        type: file.type,
        size: file.size,
      };

      // Generate preview for images
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        const preview = await new Promise<string>((resolve) => {
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.readAsDataURL(file);
        });
        fileInfo.preview = preview;
        fileInfo.data = preview;
      } else {
        // Read other files as base64
        const reader = new FileReader();
        const data = await new Promise<string>((resolve) => {
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.readAsDataURL(file);
        });
        fileInfo.data = data;
      }

      validFiles.push(fileInfo);
    }

    if (selectedFiles.length + validFiles.length > maxFiles) {
      toast({
        title: "Too many files",
        description: `Maximum ${maxFiles} files allowed`,
        variant: "destructive"
      });
    }

    const newFiles = [...selectedFiles, ...validFiles].slice(0, maxFiles);
    setSelectedFiles(newFiles);
    onFilesSelected(newFiles);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      processFiles(e.dataTransfer.files);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const removeFile = (index: number) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index);
    setSelectedFiles(newFiles);
    onFilesSelected(newFiles);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="space-y-2">
      {/* Upload Area */}
      <div
        className={`border-2 border-dashed rounded-xl p-4 transition-all cursor-pointer ${
          isDragging 
            ? 'border-blue-500 bg-blue-500/10' 
            : 'border-white/10 hover:border-white/20 bg-white/5'
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.json"
          className="hidden"
          onChange={(e) => e.target.files && processFiles(e.target.files)}
        />
        <div className="flex flex-col items-center gap-2 text-white/40">
          <Upload className="w-6 h-6" />
          <span className="text-xs">Drop files here or click to upload</span>
          <span className="text-[10px] text-white/20">Max {maxFiles} files, 20MB each</span>
        </div>
      </div>

      {/* Selected Files Preview */}
      {selectedFiles.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedFiles.map((file, index) => (
            <div
              key={index}
              className="flex items-center gap-2 bg-white/5 rounded-lg px-2 py-1.5 group"
            >
              {file.preview ? (
                <img src={file.preview} alt={file.name} className="w-6 h-6 rounded object-cover" />
              ) : (
                getFileIcon(file.type)
              )}
              <div className="flex flex-col">
                <span className="text-[10px] text-white/70 truncate max-w-[100px]">{file.name}</span>
                <span className="text-[8px] text-white/30">{formatFileSize(file.size)}</span>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeFile(index);
                }}
                className="opacity-0 group-hover:opacity-100 text-white/40 hover:text-white transition-opacity"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FileUpload;