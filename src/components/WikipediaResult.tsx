import { ExternalLink, ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface WikipediaResultProps {
  result: {
    title: string;
    extract: string;
    url: string;
    thumbnail?: string;
  };
  onClose: () => void;
}

const WikipediaResult = ({ result, onClose }: WikipediaResultProps) => {
  return (
    <div className="fixed bottom-20 right-4 z-50 max-w-md bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
            <span className="text-sm font-bold">📖</span>
          </div>
          <span className="font-semibold text-sm">Wikipedia</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="text-white/70 hover:text-white hover:bg-white/10 h-6 w-6 p-0"
        >
          ✕
        </Button>
      </div>

      {/* Content */}
      <div className="p-4 max-h-96 overflow-y-auto">
        {/* Title and Thumbnail */}
        <div className="flex items-start gap-3 mb-4">
          {result.thumbnail && (
            <img
              src={result.thumbnail}
              alt={result.title}
              className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
            />
          )}
          <div className="flex-1">
            <h3 className="font-bold text-lg text-gray-900 mb-2 leading-tight">
              {result.title}
            </h3>
            <a
              href={result.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              Read full article
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        {/* Extract */}
        <div className="text-gray-700 text-sm leading-relaxed max-h-60 overflow-y-auto">
          {result.extract.split(/\.\s+/).filter(s => s.trim()).map((sentence, index) => (
            <p key={index} className="mb-2 last:mb-0">
              {sentence.trim().match(/^\d+\./) ? sentence.trim() : `${index + 1}. ${sentence.trim()}`}
              {index < result.extract.split(/\.\s+/).filter(s => s.trim()).length - 1 ? '.' : ''}
            </p>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 py-3 bg-gray-50 border-t border-gray-100">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>Source: Wikipedia</span>
          <span>AI-powered search</span>
        </div>
      </div>
    </div>
  );
};

export default WikipediaResult;