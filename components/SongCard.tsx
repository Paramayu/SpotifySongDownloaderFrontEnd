import React from 'react';
import type { SpotifySong, DownloadStatus } from '../types';
import { ProgressBar } from './ProgressBar';

/**
 * Props for the SongCard component.
 */
interface SongCardProps {
    /** The song data object to display. */
    song: SpotifySong;
    /** Function to call when the download button is clicked. */
    onDownload: (song: SpotifySong) => void;
    /** If true, renders a larger, more detailed version of the card. Defaults to false. */
    isLarge?: boolean;
    /** If true, a checkbox is shown for selection. */
    isSelectable?: boolean;
    /** If true, the checkbox is marked as checked. */
    isSelected?: boolean;
    /** Function to call when the checkbox is toggled. */
    onSelect?: (songId: string) => void;
    /** The current download status of the song, if applicable. */
    downloadStatus?: DownloadStatus;
}

/**
 * Formats a duration from milliseconds into a "minutes:seconds" string.
 * @param ms The duration in milliseconds.
 * @returns A formatted string, e.g., "3:45".
 */
const formatDuration = (ms: number): string => {
    const minutes = Math.floor(ms / 60000);
    const seconds = ((ms % 60000) / 1000).toFixed(0);
    // Add a leading zero to seconds if it's less than 10.
    return `${minutes}:${parseInt(seconds) < 10 ? '0' : ''}${seconds}`;
};

/**
 * A simple SVG icon for the download button.
 */
const DownloadIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
);

/**
 * A component to display information about a single song. It has different styles
 * for a large "featured" view and a smaller list item view.
 */
export const SongCard: React.FC<SongCardProps> = ({ song, onDownload, isLarge = false, isSelectable, isSelected, onSelect, downloadStatus }) => {
    // Find the best image URL to use, preferring one that is at least 300px wide.
    const imageUrl = song.img.find(i => i.width >= 300)?.url || song.img[0]?.url;

    // Conditionally set CSS classes based on the `isLarge` prop to change the layout.
    const cardClasses = isLarge
        ? "w-full max-w-sm md:max-w-md flex-col text-center items-center" // Styles for large card
        : "w-full flex-row items-center"; // Styles for small card (in a list)
    
    const imageClasses = isLarge
        ? "w-48 h-48 md:w-64 md:h-64 mb-4"
        : "w-24 h-24 md:w-28 md:h-28";

    return (
        <div className={`flex ${cardClasses} bg-gray-900/50 backdrop-blur-sm border rounded-lg p-4 shadow-lg transition-all duration-300 hover:border-gray-700 ${isSelected ? 'border-purple-500' : 'border-gray-800/80'}`}>
            {/* Show a checkbox only if the card is selectable and not the large version. */}
            {isSelectable && !isLarge && (
                <div className="flex-shrink-0 pr-4">
                    <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => onSelect?.(song.id)}
                        className="h-6 w-6 rounded bg-gray-700 border-gray-600 text-purple-500 focus:ring-purple-600 focus:ring-2 cursor-pointer"
                        aria-label={`Select ${song.name}`}
                        disabled={!!downloadStatus} // Disable checkbox during download
                    />
                </div>
            )}
            
            <img src={imageUrl} alt={song.name} className={`${imageClasses} object-cover rounded-md flex-shrink-0 shadow-md`} />

            <div className={`flex flex-col justify-between ${isLarge ? 'items-center' : 'ml-4'} flex-grow`}>
                <div>
                    <a href={song.url} target="_blank" rel="noopener noreferrer" className={`font-bold ${isLarge ? 'text-2xl' : 'text-lg'} text-white hover:text-cyan-400 transition-colors duration-200 line-clamp-2`}>
                        {song.name}
                    </a>
                    {/* Display the list of artists, separated by commas. */}
                    <div className={`text-gray-400 text-sm mt-1 ${isLarge ? 'justify-center' : ''} flex flex-wrap`}>
                        {song.artists.map((artist, index) => (
                            <React.Fragment key={artist.url}>
                                <a href={artist.url} target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors duration-200">
                                    {artist.name}
                                </a>
                                {index < song.artists.length - 1 && <span className="mx-1">,</span>}
                            </React.Fragment>
                        ))}
                    </div>
                </div>

                <div className={`flex items-center mt-3 w-full ${isLarge ? 'justify-center' : 'justify-between'}`}>
                    <span className="text-gray-500 text-sm">{formatDuration(song.duration_ms)}</span>
                    {!downloadStatus ? (
                        <button onClick={() => onDownload(song)} className={`flex items-center justify-center bg-gray-700 hover:bg-purple-600 text-white font-semibold py-2 px-4 rounded-full transition-all duration-300 ease-in-out text-sm ${isLarge ? 'ml-4' : ''}`}>
                            <DownloadIcon />
                            Download
                        </button>
                    ) : (
                         <div className="w-1/2 ml-4">
                             <ProgressBar status={downloadStatus} />
                         </div>
                    )}
                </div>
            </div>
        </div>
    );
};