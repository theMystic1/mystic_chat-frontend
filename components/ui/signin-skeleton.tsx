import * as React from "react";
import { Skeleton, TextSkeleton } from "./skeleton";

export const SigninSkeleton = () => {
  return (
    <div className="min-h-[calc(100vh-2rem)] w-full flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-5xl grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Card */}
        <div className="card">
          <Skeleton className="h-8 w-28" />
          <div className="mt-3">
            <TextSkeleton lines={2} />
          </div>

          <div className="mt-8 flex flex-col gap-3">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-12 w-full rounded-xl" />
            <Skeleton className="h-3 w-48" />
          </div>

          <div className="mt-8">
            <Skeleton className="h-12 w-full rounded-xl" />
          </div>
        </div>

        {/* Side card */}
        <div className="hidden xl:block surface p-6">
          <Skeleton className="h-7 w-48" />
          <div className="mt-3">
            <TextSkeleton lines={3} />
          </div>
          <div className="mt-8">
            <Skeleton className="h-72 w-full rounded-2xl" />
          </div>
        </div>
      </div>
    </div>
  );
};
