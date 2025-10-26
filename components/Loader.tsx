import React from 'react';

/**
 * A simple, reusable loading spinner component to indicate that
 * an operation (like an API call) is in progress.
 */
export const Loader: React.FC = () => (
    <div className="flex justify-center items-center py-16">
        <div className="w-12 h-12 border-4 border-t-4 border-gray-700 border-t-purple-500 rounded-full animate-spin"></div>
    </div>
);
