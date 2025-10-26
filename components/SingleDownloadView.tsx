import React, { useState, useEffect } from 'react';
import type { SpotifySong } from '../types';
import { initiateSingleSongDownload } from '../services/apiService';

/**
 * Props for the SingleDownloadView component.
 */
interface SingleDownloadViewProps {
    /** The song object to be downloaded. */
    song: SpotifySong;
    /** A function to call to go back to the previous view. */
    onComplete: () => void;
}

/**
 * A view dedicated to showing the download progress for a single song.
 * It handles the download process internally when the component is mounted.
 */
export const SingleDownloadView: React.FC<SingleDownloadViewProps> = ({ song, onComplete }) => {
    // State to track if the download is being prepared.
    const [isPreparing, setIsPreparing] = useState(true);
    // State to store the final download link once it's ready.
    const [downloadLink, setDownloadLink] = useState<string | null>(null);
    // State to store any errors that occur during the download process.
    const [error, setError] = useState<string | null>(null);
    
    const imageUrl = song.img.find(i => i.width >= 300)?.url || song.img[0]?.url;

    // The 'useEffect' hook runs side effects in function components.
    // This effect runs once when the component is first rendered (or if the song prop changes).
    useEffect(() => {
        const prepareDownload = async () => {
            setError(null);
            try {
                // Call the API service to start the download process. It now takes the full song object.
                const data = await initiateSingleSongDownload(song);
                // Once the link is retrieved, update the state.
                setDownloadLink(data.link);
            } catch (err) {
                // If the fetch call fails, store the error message.
                setError(err instanceof Error ? err.message : 'Download failed.');
            } finally {
                // Mark preparation as complete, whether it succeeded or failed.
                setIsPreparing(false);
            }
        };

        prepareDownload();
    }, [song]); // The dependency array ensures this effect runs if the song object changes.
    
    // Derived booleans for easier conditional rendering.
    const isComplete = !isPreparing && downloadLink;
    const hasError = !isPreparing && error;

    return (
        <div className="mt-12 flex flex-col items-center text-center max-w-2xl mx-auto">
            <div className="w-full bg-gray-900/60 backdrop-blur-sm border border-gray-800 rounded-lg p-8 shadow-2xl">
                <img src={imageUrl} alt={song.name} className="w-40 h-40 object-cover rounded-lg mx-auto shadow-lg mb-6" />
                <h2 className="text-2xl font-bold text-white mb-1">{song.name}</h2>
                <p className="text-gray-400 mb-6">{song.artists.map(a => a.name).join(', ')}</p>

                {/* Progress Bar Section */}
                <div className="w-full h-4 mb-4 flex items-center justify-center">
                    {isComplete ? (
                        // Show a solid green bar when complete.
                        <div className="w-full bg-green-500 rounded-full h-2.5"></div>
                    ) : hasError ? (
                        // Show a solid red bar on error.
                        <div className="w-full bg-red-500 rounded-full h-2.5"></div>
                    ) : (
                        // Show the indeterminate progress bar while preparing.
                        <div className="indeterminate-progress-bar"></div>
                    )}
                </div>

                {/* Status Text */}
                <p className="text-lg text-gray-300 mb-6">
                    {isComplete && 'Download Ready!'}
                    {isPreparing && 'Please wait, snagging your echo...'}
                    {hasError && <span className="text-red-400">{error}</span>}
                </p>

                {/* Action Buttons */}
                <div className="flex flex-col items-center">
                    {isComplete ? (
                        // If complete, show a link to the download.
                        <a 
                            href={downloadLink!}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-block text-lg bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-bold py-3 px-8 rounded-full transition-all duration-300 ease-in-out transform hover:scale-105 shadow-lg"
                        >
                            Go to Download
                        </a>
                    ) : (
                        // If preparing or has error, show a disabled button with appropriate text.
                        <button disabled className="text-lg bg-gray-700 text-white font-bold py-3 px-8 rounded-full cursor-not-allowed opacity-50">
                            {hasError ? 'Failed' : 'Preparing...'}
                        </button>
                    )}

                    <button 
                        onClick={onComplete}
                        className="mt-4 text-sm text-gray-500 hover:text-gray-300 transition-colors"
                    >
                        Back to results
                    </button>
                </div>
            </div>
        </div>
    );
};
