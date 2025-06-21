import React from 'react';

export default function SkeletonLoader() {
  return (
    <div className="animate-pulse space-y-2">
      <div className="h-4 bg-[#23243a] dark:bg-[#23243a] rounded w-3/4"></div>
      <div className="h-4 bg-[#181a2a] dark:bg-[#181a2a] rounded w-2/3"></div>
      <div className="h-4 :bg-[#2563eb] dark:bg-[#181a2a] rounded w-1/2"></div>
    </div>
  );
}
