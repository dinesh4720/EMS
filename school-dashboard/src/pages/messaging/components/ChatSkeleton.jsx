import { Skeleton } from "../../../components/ui";

function ConversationRowSkeleton() {
  return (
    <div className="flex items-center gap-3 p-3">
      <Skeleton variant="circle" className="h-10 w-10" />
      <div className="flex-1 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <Skeleton variant="text" className="h-3 w-2/3" />
          <Skeleton variant="text" className="h-3 w-10" />
        </div>
        <Skeleton variant="text" className="h-3 w-4/5" />
      </div>
    </div>
  );
}

export default function ChatSkeleton() {
  return (
    <div className="chat-shell" aria-busy="true" aria-live="polite">
      <aside className="chat-shell__sidebar">
        <div className="chat-sidebar__head">
          <Skeleton variant="rect" className="h-10 w-full" />
          <Skeleton variant="text" className="h-3 w-24" />
        </div>
        <div className="p-2 space-y-1">
          {Array.from({ length: 6 }).map((_, i) => (
            <ConversationRowSkeleton key={`chat-conv-skeleton-${i}`} />
          ))}
        </div>
      </aside>
      <div className="chat-shell__main">
        <div className="px-5 py-3 border-b border-[var(--color-border)] flex items-center gap-3">
          <Skeleton variant="circle" className="h-10 w-10" />
          <div className="space-y-2">
            <Skeleton variant="text" className="h-3 w-32" />
            <Skeleton variant="text" className="h-3 w-20" />
          </div>
        </div>
        <div className="flex-1 p-4 space-y-3">
          <Skeleton variant="rect" className="h-12 w-1/2" />
          <Skeleton variant="rect" className="h-16 w-2/3 ml-auto" />
          <Skeleton variant="rect" className="h-10 w-2/5" />
          <Skeleton variant="rect" className="h-14 w-1/2 ml-auto" />
        </div>
        <div className="p-4 border-t border-[var(--color-border)]">
          <Skeleton variant="rect" className="h-11 w-full" />
        </div>
      </div>
    </div>
  );
}
