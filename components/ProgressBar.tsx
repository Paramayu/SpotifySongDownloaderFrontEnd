import React from 'react';

/**
 * Props for the ProgressBar component.
 */
interface ProgressBarProps {
    /** The current status of the download to determine which style of bar to show. */
    status: 'downloading' | 'done';
}

/**
 * A component that displays a progress bar. It shows an indeterminate
 * animation for 'downloading' and a solid green bar for 'done'.
 */
export const ProgressBar: React.FC<ProgressBarProps> = ({ status }) => {
    // If the status is 'downloading', show the animated, indeterminate progress bar.
    if (status === 'downloading') {
        return (
            // This div uses custom CSS defined in index.html to create the animated effect.
            <div className="indeterminate-progress-bar"></div>
        );
    }

    // If the status is 'done', show a full, green progress bar.
    if (status === 'done') {
        return (
             <div className="w-full bg-green-500 rounded-full h-2.5"></div>
        );
    }

    // If the status is neither, render nothing.
    return null;
};
