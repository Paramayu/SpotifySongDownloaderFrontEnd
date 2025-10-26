import React, { useState, useCallback } from 'react';
// Import custom types to ensure data consistency throughout the app.
import type { SpotifyAPIResponse, SpotifySong } from './types';
// Import service functions that handle external API calls.
import { fetchSpotifyData, initiatePlaylistDownload } from './services/apiService';

// Import UI components.
import { UrlInputForm } from './components/UrlInputForm';
import { PlaylistDisplay } from './components/PlaylistDisplay';
import { SongCard } from './components/SongCard';
import { Loader } from './components/Loader';
import { SingleDownloadView } from './components/SingleDownloadView';

// Define the possible views (screens) the user can see.
type View = 'search' | 'results' | 'single_download';

/**
 * The main application component. It manages the overall state and renders different views
 * based on user actions.
 */
const App: React.FC = () => {
    // STATE MANAGEMENT //

    // Holds the data fetched from the Spotify API (either a single song or a playlist).
    const [spotifyData, setSpotifyData] = useState<SpotifyAPIResponse | null>(null);
    // Tracks whether the app is currently fetching data from the API.
    const [isLoading, setIsLoading] = useState<boolean>(false);
    // Stores any error messages to display to the user.
    const [error, setError] = useState<string | null>(null);
    // Determines which view is currently visible to the user.
    const [view, setView] = useState<View>('search');
    // Stores the specific song selected for a single download.
    const [songForDownload, setSongForDownload] = useState<SpotifySong | null>(null);

    // State specifically for playlist downloads.
    // Tracks whether a playlist download is currently in progress.
    const [isDownloadingPlaylist, setIsDownloadingPlaylist] = useState<boolean>(false);
    // Stores the final download link for the playlist ZIP file.
    const [playlistDownloadLink, setPlaylistDownloadLink] = useState<string | null>(null);
    // A set of song IDs that the user has selected for download. Using a Set is efficient for checking if a song is selected.
    const [selectedSongs, setSelectedSongs] = useState<Set<string>>(new Set());

    /**
     * Resets all state variables to their initial values. This is used before starting a new search
     * to clear out data from the previous one.
     */
    const resetAllState = () => {
        setError(null);
        setSpotifyData(null);
        setSongForDownload(null);
        setIsDownloadingPlaylist(false);
        setPlaylistDownloadLink(null);
        setSelectedSongs(new Set());
    };

    /**
     * Handles the search action when the user submits a Spotify URL.
     * `useCallback` is a React Hook that memoizes the function, preventing it from being recreated
     * on every render, which can improve performance.
     */
    const handleSearch = useCallback(async (url: string) => {
        if (!url) {
            setError('Please enter a Spotify URL.');
            return;
        }
        setIsLoading(true);
        resetAllState(); // Clear previous results.

        try {
            // Using the new apiService function to fetch data from the backend.
            const data = await fetchSpotifyData(url);
            if (data.playlist) {
                // If a playlist is loaded, select all songs by default for user convenience.
                const allSongIds = new Set(data.playlist.tracks.map(t => t.id));
                setSelectedSongs(allSongIds);
            }
            setSpotifyData(data);
            setView('results'); // Switch to the results view.
        } catch (err) {
            // Handle any errors that occur during the API fetch.
            setError(err instanceof Error ? err.message : 'An unknown error occurred.');
            setSpotifyData(null);
            setView('search'); // Go back to the search view on error.
        } finally {
            // This block runs whether the try block succeeded or failed.
            setIsLoading(false); // Stop the loading indicator.
        }
    }, []);

    /**
     * Sets the selected song and switches to the single download view.
     * @param song The song object to be downloaded.
     */
    const handleDownloadSong = (song: SpotifySong) => {
        console.log(`Initiating download for song ID: ${song.id}`);
        setSongForDownload(song);
        setView('single_download');
    };

    /**
     * Initiates the download process for all selected songs in a playlist.
     */
    const handleDownloadSelected = async () => {
        if (!spotifyData?.playlist || selectedSongs.size === 0) return;
        
        setIsDownloadingPlaylist(true);
        setPlaylistDownloadLink(null);
        setError(null);

        try {
            // Filter the full track list to get only the songs the user has selected.
            const songsToDownload = spotifyData.playlist.tracks.filter(track => selectedSongs.has(track.id));
            
            // Call the API service to start the download process. This is now a single, long-running request.
            const data = await initiatePlaylistDownload(songsToDownload);
            
            // Once complete, set the final download link.
            setPlaylistDownloadLink(data.link);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'The download failed. Please try again.');
        } finally {
            setIsDownloadingPlaylist(false);
        }
    };

    /**
     * Toggles the selection state of a single song.
     * @param songId The ID of the song to select or deselect.
     */
    const handleSongSelectionToggle = (songId: string) => {
        setSelectedSongs(prev => {
            const newSelection = new Set(prev);
            if (newSelection.has(songId)) {
                newSelection.delete(songId); // If already selected, deselect it.
            } else {
                newSelection.add(songId); // If not selected, select it.
            }
            return newSelection;
        });
    };

    /**
     * Toggles the selection of all songs in the playlist.
     */
    const handleSelectAllToggle = () => {
        if (spotifyData?.playlist) {
            if (selectedSongs.size === spotifyData.playlist.tracks.length) {
                // If all songs are already selected, deselect all.
                setSelectedSongs(new Set());
            } else {
                // Otherwise, select all songs.
                const allSongIds = new Set(spotifyData.playlist.tracks.map(t => t.id));
                setSelectedSongs(allSongIds);
            }
        }
    };

    /**
     * Determines which content to render based on the current state (e.g., loading, error, view).
     * This acts like a simple router for the app's content area.
     */
    const renderContent = () => {
        if (isLoading) {
            return <Loader />;
        }

        if (error) {
            return <p className="text-red-400 text-center mt-8 text-lg">{error}</p>;
        }

        if (view === 'single_download' && songForDownload) {
            return (
                <SingleDownloadView
                    song={songForDownload}
                    onComplete={() => setView('results')} // Go back to results when done.
                />
            );
        }

        if (view === 'results' && spotifyData?.song) {
            return (
                <div className="mt-12 flex justify-center">
                    <SongCard song={spotifyData.song} onDownload={handleDownloadSong} isLarge={true} />
                </div>
            );
        }

        if (view === 'results' && spotifyData?.playlist) {
            return (
                <div className="mt-8">
                    <PlaylistDisplay
                        playlist={spotifyData.playlist}
                        onDownloadSong={handleDownloadSong}
                        onDownloadSelected={handleDownloadSelected}
                        isDownloading={isDownloadingPlaylist}
                        downloadLink={playlistDownloadLink}
                        selectedSongs={selectedSongs}
                        onSongSelect={handleSongSelectionToggle}
                        onSelectAll={handleSelectAllToggle}
                    />
                </div>
            );
        }
        
        // Default view when the app first loads or after a search is cleared.
        return (
             <div className="text-center mt-16 text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-16 w-16 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 6l12-3" />
                </svg>
                <h2 className="mt-4 text-2xl font-semibold text-gray-200">Echoes await your command</h2>
                <p className="mt-2 text-md">Enter a Spotify song or playlist URL above to get started.</p>
            </div>
        );
    };

    // The main JSX structure of the app.
    return (
        <div className="min-h-screen bg-[#0A0A10] text-white font-sans">
            {/* This div creates a decorative background effect. */}
            <div 
              className="absolute top-0 left-0 w-full h-full" 
              style={{
                backgroundImage: 'radial-gradient(circle at 20% 20%, rgba(167, 139, 250, 0.1) 0%, transparent 40%), radial-gradient(circle at 80% 70%, rgba(34, 211, 238, 0.1) 0%, transparent 40%)'
              }}
            ></div>
            <main className="container mx-auto px-4 py-8 md:py-12 relative z-10">
                <header className="text-center mb-8">
                    <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400">
                        EchoSnag
                    </h1>
                    <p className="mt-2 text-lg text-gray-400">
                        Snag the echoes you love.
                    </p>
                </header>

                <UrlInputForm onSubmit={handleSearch} isLoading={isLoading} />
                
                {/* Render the main content area based on the current state. */}
                {renderContent()}

            </main>
        </div>
    );
};

export default App;
