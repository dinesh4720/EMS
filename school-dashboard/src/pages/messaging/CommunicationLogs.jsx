import { Clock, Inbox } from "lucide-react";

export default function CommunicationLogs() {
  return (
    <div className="animate-in fade-in duration-300">
      <div className="rounded-2xl border border-gray-100 bg-white p-8 shadow-sm dark:border-zinc-800/80 dark:bg-zinc-900">
        <div className="mx-auto flex max-w-2xl flex-col items-center text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-300">
            <Inbox size={26} />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Communication history is not available yet
          </h2>
          <p className="mt-3 text-sm leading-6 text-gray-600 dark:text-zinc-300">
            This screen previously showed placeholder SMS and email entries. It has been
            hidden until real parent communication history is connected to the backend.
          </p>
          <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-xs font-medium text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300">
            <Clock size={14} />
            Awaiting real SMS, WhatsApp, and email audit data
          </div>
        </div>
      </div>
    </div>
  );
}
