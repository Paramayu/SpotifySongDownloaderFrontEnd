import React, { useState } from 'react';
import type { SpotifyPlaylist, SpotifySong } from '../types';
import { SongCard } from './SongCard';

/**
 * Props for the PlaylistDisplay component.
 */
interface PlaylistDisplayProps {
    /** The playlist data object to display. */
    playlist: SpotifyPlaylist;
    /** Function to call when a single song's download button is clicked. */
    onDownloadSong: (song: SpotifySong) => void;
    /** Function to call when the "Download Selected" button is clicked. */
    onDownloadSelected: () => void;
    /** A boolean indicating if the playlist download is currently in progress. */
    isDownloading: boolean;
    /** The final download link for the playlist ZIP file, if available. */
    downloadLink: string | null;
    /** A Set of song IDs that are currently selected by the user. */
    selectedSongs: Set<string>;
    /** Function to call when a song's checkbox is toggled. */
    onSongSelect: (songId: string) => void;
    /** Function to call when the "Select All" checkbox is toggled. */
    onSelectAll: () => void;
}

// Constant to control how many songs are shown per "page".
const SONGS_PER_PAGE = 20;

// SVG icon components for buttons.
const DownloadAllIcon: React.FC = () => (
     <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
);
const LinkIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
    </svg>
);

/**
 * A component that displays the details of a playlist and a list of its tracks.
 */
export const PlaylistDisplay: React.FC<PlaylistDisplayProps> = ({ playlist, onDownloadSong, onDownloadSelected, isDownloading, downloadLink, selectedSongs, onSongSelect, onSelectAll }) => {
    const imageUrl = playlist.images.find(i => i.width >= 300)?.url || playlist.images[0]?.url;
    
    // State to manage how many songs are currently visible, for "Load More" functionality.
    const [visibleCount, setVisibleCount] = useState(SONGS_PER_PAGE);

    // Derived state: check if all tracks in the playlist are selected.
    const allSelected = playlist.tracks.length > 0 && selectedSongs.size === playlist.tracks.length;

    /**
     * Increases the number of visible songs when the "Load More" button is clicked.
     */
    const handleLoadMore = () => {
        setVisibleCount(prevCount => prevCount + SONGS_PER_PAGE);
    };

    // Create a slice of the tracks array to only render the visible songs.
    const tracksToShow = playlist.tracks.slice(0, visibleCount);
    
    return (
        <div className="space-y-8">
            {/* Playlist Header Section */}
            <div className="flex flex-col sm:flex-row items-center bg-gray-900/40 p-6 rounded-xl border border-gray-800">
                <img src={imageUrl} alt={playlist.name} className="w-40 h-40 object-cover rounded-lg shadow-2xl mb-4 sm:mb-0 sm:mr-6 flex-shrink-0" />
                <div>
                    <p className="text-sm text-purple-300 uppercase tracking-wider font-semibold">Playlist</p>
                    <a href={playlist.url} target="_blank" rel="noopener noreferrer" className="text-3xl md:text-5xl font-bold text-white hover:underline">
                        {playlist.name}
                    </a>
                    <p className="mt-2 text-gray-400">
                        By <a href={playlist.owner.url} target="_blank" rel="noopener noreferrer" className="font-semibold text-gray-300 hover:underline">{playlist.owner.display_name}</a>
                        <span className="mx-2">&bull;</span>
                        {playlist.tracks.length} songs
                    </p>
                </div>
            </div>
            
            {/* Select All Checkbox */}
            <div className="flex justify-end items-center mb-4 pr-1">
                <label htmlFor="select-all" className="flex items-center cursor-pointer text-gray-400 hover:text-white transition-colors">
                    <input
                        type="checkbox"
                        id="select-all"
                        className="h-6 w-6 rounded bg-gray-700 border-gray-600 text-purple-500 focus:ring-purple-600 focus:ring-2 mr-3"
                        checked={allSelected}
                        onChange={onSelectAll}
                    />
                    <span className="font-semibold">Select All</span>
                </label>
            </div>

            {/* Grid of Song Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {tracksToShow.map((track) => (
                    <SongCard 
                        key={track.id} 
                        song={track} 
                        onDownload={onDownloadSong}
                        // Individual download progress is no longer tracked for playlist downloads.
                        isSelectable={true}
                        isSelected={selectedSongs.has(track.id)}
                        onSelect={onSongSelect}
                     />
                ))}
            </div>
            
            {/* "Load More" button, only shown if there are more songs to display. */}
            {visibleCount < playlist.tracks.length && (
                <div className="flex justify-center">
                    <button 
                        onClick={handleLoadMore} 
                        className="text-lg bg-gray-800 hover:bg-gray-700 border border-gray-700 text-white font-bold py-3 px-8 rounded-full transition-all duration-300 ease-in-out transform hover:scale-105"
                    >
                        Load More
                    </button>
                </div>
            )}
            
            {/* Main action button at the bottom: either "Download" or "Go to Downloads". */}
            <div className="flex justify-center mt-8">
                 {!downloadLink ? (
                    // If no download link is available, show the "Download Selected" button.
                    <button 
                        onClick={onDownloadSelected} 
                        disabled={isDownloading || selectedSongs.size === 0}
                        className="flex items-center justify-center text-lg bg-gradient-to-r from-purple-500 to-cyan-500 hover:from-purple-600 hover:to-cyan-600 text-white font-bold py-3 px-8 rounded-full transition-all duration-300 ease-in-out transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <DownloadAllIcon/>
                        {/* The button text changes based on whether a download is in progress. */}
                        {isDownloading ? `Downloading (${selectedSongs.size})...` : `Download Selected (${selectedSongs.size})`}
                    </button>
                 ) : (
                    // If a download link is available, show a link to it.
                    <a 
                        href={downloadLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center text-lg bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-bold py-3 px-8 rounded-full transition-all duration-300 ease-in-out transform hover:scale-105 shadow-lg"
                    >
                        <LinkIcon />
                        Go to Downloads
                    </a>
                 )}
            </div>
        </div>
    );
};
