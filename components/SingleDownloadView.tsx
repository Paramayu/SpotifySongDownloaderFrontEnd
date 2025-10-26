import React, { useState, useEffect, useRef } from 'react';
import type { SpotifySong } from '../types';
import { initiateSingleSongDownload, API_DOMAIN } from '../services/apiService';
import { io, Socket } from 'socket.io-client';

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
    const [status, setStatus] = useState<'preparing' | 'downloading' | 'done' | 'error'>('preparing');
    const [downloadLink, setDownloadLink] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const socketRef = useRef<Socket | null>(null);
    
    const imageUrl = song.img.find(i => i.width >= 300)?.url || song.img[0]?.url;

    useEffect(() => {
        const socket = io(API_DOMAIN);
        socketRef.current = socket;

        socket.on('connect', () => {
            console.log('Socket connected for single download:', socket.id);
            initiateSingleSongDownload(song, socket.id)
                .then(data => {
                    setDownloadLink(data.link);
                })
                .catch(err => {
                    setError(err instanceof Error ? err.message : 'Download failed.');
                    setStatus('error');
                });
        });

        socket.on('downloadSequenceStarted', () => {
            setStatus('downloading');
        });

        socket.on('progress', (data: { totalDownloaded: number }) => {
            if (data.totalDownloaded === 1) {
                setStatus('done');
            }
        });

        socket.on('downloadSequenceCompleted', () => {
             socket.disconnect();
        });

        // Cleanup function
        return () => {
            if (socketRef.current) {
                socketRef.current.disconnect();
            }
        };
    }, [song]);
    
    const isPreparing = status === 'preparing';
    const isDownloading = status === 'downloading';
    const isComplete = status === 'done' && !!downloadLink;
    const hasError = status === 'error';

    return (
        <div className="mt-12 flex flex-col items-center text-center max-w-2xl mx-auto">
            <div className="w-full bg-gray-900/60 backdrop-blur-sm border border-gray-800 rounded-lg p-8 shadow-2xl">
                <img src={imageUrl} alt={song.name} className="w-40 h-40 object-cover rounded-lg mx-auto shadow-lg mb-6" />
                <h2 className="text-2xl font-bold text-white mb-1">{song.name}</h2>
                <p className="text-gray-400 mb-6">{song.artists.map(a => a.name).join(', ')}</p>

                {/* Progress Bar Section */}
                <div className="w-full h-4 mb-4 flex items-center justify-center">
                    {isComplete ? (
                        <div className="w-full bg-green-500 rounded-full h-2.5"></div>
                    ) : hasError ? (
                        <div className="w-full bg-red-500 rounded-full h-2.5"></div>
                    ) : (
                        <div className="indeterminate-progress-bar"></div>
                    )}
                </div>

                {/* Status Text */}
                <p className="text-lg text-gray-300 mb-6">
                    {isComplete && 'Download Ready!'}
                    {(isPreparing || isDownloading) && 'Please wait, snagging your echo...'}
                    {hasError && <span className="text-red-400">{error}</span>}
                </p>

                {/* Action Buttons */}
                <div className="flex flex-col items-center">
                    {isComplete ? (
                        <div className="text-center">
                            <a 
                                href={downloadLink!}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-block text-lg bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-bold py-3 px-8 rounded-full transition-all duration-300 ease-in-out transform hover:scale-105 shadow-lg"
                            >
                                Go to Download
                            </a>
                            <p className="text-xs text-gray-500 mt-2">Link is valid for 1 hour.</p>
                        </div>
                    ) : (
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