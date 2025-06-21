import React from 'react';

export default function SkeletonLoader() {
  return (
    <div className="animate-pulse space-y-2">
      <div className="h-4 bg-gray-600 rounded w-3/4"></div>
      <div className="h-4 bg-gray-500 rounded w-2/3"></div>
      <div className="h-4 bg-gray-700 rounded w-1/2"></div>
    </div>
  );
}
