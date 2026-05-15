export default function SchoolBuilding3D() {
  return (
    <div className="absolute inset-0 overflow-hidden bg-[linear-gradient(180deg,#ffffff_0%,#f8f8f8_50%,#f0f0f0_100%)] dark:bg-[linear-gradient(180deg,#09090b_0%,#18181b_50%,#27272a_100%)]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(20,184,166,0.18),transparent_45%)] dark:bg-[radial-gradient(circle_at_top,rgba(45,212,191,0.14),transparent_40%)]" />
      <div className="absolute left-1/2 top-1/2 w-[420px] max-w-[78%] -translate-x-1/2 -translate-y-[42%]">
        <div className="relative mx-auto h-64 rounded-t-[3rem] border border-gray-200/80 bg-white/90 shadow-2xl dark:border-zinc-700/80 dark:bg-zinc-900/85">
          <div className="absolute inset-x-[18%] -top-8 h-16 rounded-t-[2rem] border border-gray-200/80 bg-white/95 dark:border-zinc-700/80 dark:bg-zinc-900/90" />
          <div className="absolute inset-x-[28%] -top-20 h-14 rounded-t-[1.5rem] border border-gray-200/80 bg-white/95 dark:border-zinc-700/80 dark:bg-zinc-900/90" />
          <div className="absolute inset-x-10 top-10 grid grid-cols-5 gap-3">
            {Array.from({ length: 15 }).map((_, index) => (
              <div
                key={index}
                className="h-7 rounded-md border border-teal-100 bg-teal-50/90 dark:border-teal-900 dark:bg-teal-950/60"
              />
            ))}
          </div>
          <div className="absolute bottom-0 left-1/2 h-20 w-28 -translate-x-1/2 rounded-t-3xl border-x border-t border-gray-300 bg-teal-600/90 dark:border-zinc-600 dark:bg-teal-700/80" />
          <div className="absolute inset-x-0 bottom-0 h-5 bg-surface-2" />
        </div>
        <div className="mx-auto h-6 w-[92%] rounded-b-3xl bg-gray-200/80 dark:bg-zinc-700/80" />
      </div>
      <div className="absolute bottom-8 lg:bottom-24 left-0 right-0 text-center pointer-events-none px-4 lg:px-8">
        <h2 className="text-lg lg:text-2xl font-bold text-fg mb-1 lg:mb-2">
          Building Excellence in Education
        </h2>
      </div>
    </div>
  );
}
