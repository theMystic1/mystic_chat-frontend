import * as React from "react";

type SkeletonProps = {
  className?: string;
};

export const Skeleton = ({ className = "" }: SkeletonProps) => {
  return <div className={`skeleton rounded-xl ${className}`} />;
};

export const TextSkeleton = ({
  lines = 2,
  className = "",
}: {
  lines?: number;
  className?: string;
}) => {
  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={`h-3 ${i === lines - 1 ? "w-3/5" : "w-full"}`}
        />
      ))}
    </div>
  );
};
