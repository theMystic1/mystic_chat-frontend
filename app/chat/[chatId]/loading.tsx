import * as React from "react";

const shimmer =
  "relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.4s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent";

const Skeleton = ({ className }: { className: string }) => {
  return (
    <div
      className={[
        "rounded-xl bg-elevated border border-white/5",
        shimmer,
        className,
      ].join(" ")}
    />
  );
};

const ChatPaneSkeleton = () => {
  return (
    <div className="h-full min-h-0 flex flex-col">
      {/* Header */}
      <div className="shrink-0 bg-surface border-b border-white/5 p-4">
        <div className="flex items-center gap-3">
          <div className="lg:hidden">
            <Skeleton className="h-9 w-16 rounded-lg" />
          </div>

          <Skeleton className="h-10 w-10 rounded-2xl" />

          <div className="min-w-0 flex-1">
            <Skeleton className="h-4 w-36" />
            <div className="mt-2">
              <Skeleton className="h-3 w-24" />
            </div>
          </div>

          <div className="hidden lg:flex items-center gap-2">
            <Skeleton className="h-9 w-20 rounded-lg" />
            <Skeleton className="h-9 w-20 rounded-lg" />
          </div>
        </div>
      </div>

      {/* Messages area */}
      <div className="relative min-h-0 flex-1 overflow-hidden">
        <div className="absolute inset-0 nebula-overlay opacity-20 pointer-events-none" />
        <div className="relative h-full no-scrollbar overflow-y-auto p-4 sm:p-6 pb-28">
          <div className="mx-auto max-w-3xl flex flex-col gap-3">
            <div className="mx-auto">
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>

            {/* Incoming */}
            <div className="flex justify-start">
              <div className="max-w-[78%]">
                <Skeleton className="h-10 w-64 rounded-2xl" />
                <div className="mt-2 flex justify-start">
                  <Skeleton className="h-3 w-12 rounded-md" />
                </div>
              </div>
            </div>

            {/* Outgoing */}
            <div className="flex justify-end">
              <div className="max-w-[78%]">
                <Skeleton className="h-12 w-72 rounded-2xl" />
                <div className="mt-2 flex justify-end">
                  <Skeleton className="h-3 w-12 rounded-md" />
                </div>
              </div>
            </div>

            {/* Incoming */}
            <div className="flex justify-start">
              <div className="max-w-[78%]">
                <Skeleton className="h-16 w-80 rounded-2xl" />
                <div className="mt-2 flex justify-start">
                  <Skeleton className="h-3 w-12 rounded-md" />
                </div>
              </div>
            </div>

            {/* Outgoing short */}
            <div className="flex justify-end">
              <div className="max-w-[78%]">
                <Skeleton className="h-10 w-40 rounded-2xl" />
                <div className="mt-2 flex justify-end">
                  <Skeleton className="h-3 w-12 rounded-md" />
                </div>
              </div>
            </div>

            {/* A few more random blocks */}
            <div className="flex justify-start">
              <div className="max-w-[78%]">
                <Skeleton className="h-12 w-56 rounded-2xl" />
              </div>
            </div>

            <div className="flex justify-end">
              <div className="max-w-[78%]">
                <Skeleton className="h-14 w-64 rounded-2xl" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Composer (pinned) */}
      <div className="sticky bottom-0 z-20 shrink-0 bg-surface border-t border-white/5 p-3 sm:p-4">
        <div className="mx-auto max-w-3xl flex items-end gap-2">
          <div className="flex-1">
            <Skeleton className="h-11 w-full rounded-2xl" />
            <div className="mt-2">
              <Skeleton className="h-3 w-44 rounded-md" />
            </div>
          </div>
          <Skeleton className="h-11 w-16 rounded-xl" />
        </div>
      </div>
    </div>
  );
};

export default ChatPaneSkeleton;
