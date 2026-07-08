import { User as UserIcon } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";

export interface AttachmentMeta {
  name: string;
  type: string;
  preview?: string; // data URL for image thumbnail
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  imageUrl?: string | null;
  isStreaming?: boolean;
  attachments?: AttachmentMeta[];
}

export const MessageBubble = ({ message }: { message: ChatMessage }) => {
  const isUser = message.role === "user";

  // Disable image download (right-click, drag, save) and code copy
  const noSaveProps = {
    onContextMenu: (e: React.MouseEvent) => e.preventDefault(),
    onDragStart: (e: React.DragEvent) => e.preventDefault(),
    draggable: false,
  };

  return (
    <div className={cn("flex gap-3 px-4 py-4 animate-fade-in-up", isUser ? "justify-end" : "justify-start")}>
      {!isUser && (
        <div className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center flex-shrink-0 shadow-glow">
          <img src="/Alsa-Ai-Logo.png" alt="Alsa AI" className="w-full h-full object-cover" />
        </div>
      )}

      <div className={cn("max-w-[85%] md:max-w-[75%] flex flex-col gap-2", isUser && "items-end")}>
        {message.imageUrl && (
          <img
            src={message.imageUrl}
            alt="message attachment"
            {...noSaveProps}
            className="rounded-2xl max-h-80 object-cover border border-border select-none pointer-events-auto"
            style={{ WebkitUserSelect: "none", userSelect: "none", WebkitTouchCallout: "none" }}
          />
        )}
        {message.attachments && message.attachments.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {message.attachments.map((a, i) =>
              a.preview ? (
                <img key={i} src={a.preview} alt={a.name} {...noSaveProps}
                  className="h-24 w-24 object-cover rounded-xl border border-border" />
              ) : (
                <div key={i} className="flex items-center gap-2 bg-surface-elevated border border-border rounded-xl px-3 py-2 text-xs">
                  <span>📎</span>
                  <span className="max-w-[160px] truncate">{a.name}</span>
                </div>
              )
            )}
          </div>
        )}
        {message.content && (
          <div
            className={cn(
              "px-4 py-3 rounded-3xl text-[15px] leading-relaxed",
              isUser
                ? "bg-surface-elevated text-foreground rounded-br-md"
                : "bg-transparent text-foreground",
            )}
          >
            {isUser ? (
              <p className="whitespace-pre-wrap">{message.content}</p>
            ) : (
              <div
                className="prose-mira"
                onCopy={(e) => e.preventDefault()}
                onContextMenu={(e) => e.preventDefault()}
                style={{ WebkitUserSelect: "none", userSelect: "none" }}
              >
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    code({ children, ...props }: any) {
                      return (
                        <code
                          {...props}
                          onCopy={(e) => e.preventDefault()}
                          style={{ WebkitUserSelect: "none", userSelect: "none" }}
                        >
                          {children}
                        </code>
                      );
                    },
                    pre({ children, ...props }: any) {
                      return (
                        <pre
                          {...props}
                          onCopy={(e) => e.preventDefault()}
                          onContextMenu={(e) => e.preventDefault()}
                          style={{ WebkitUserSelect: "none", userSelect: "none" }}
                        >
                          {children}
                        </pre>
                      );
                    },
                  }}
                >
                  {message.content}
                </ReactMarkdown>
                {message.isStreaming && (
                  <span className="inline-block w-2 h-4 bg-primary ml-1 align-middle animate-pulse" />
                )}
              </div>
            )}
          </div>
        )}
        {!message.content && message.isStreaming && (
          <div className="flex gap-1.5 px-4 py-3">
            <span className="typing-dot" />
            <span className="typing-dot" />
            <span className="typing-dot" />
          </div>
        )}
      </div>

      {isUser && (
        <div className="w-8 h-8 rounded-full bg-surface-elevated flex items-center justify-center flex-shrink-0">
          <UserIcon className="w-4 h-4 text-muted-foreground" />
        </div>
      )}
    </div>
  );
};
