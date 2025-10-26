import React, { useState, useCallback, useRef, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
// Import custom types to ensure data consistency throughout the app.
import type { SpotifyAPIResponse, SpotifySong, DownloadStatus } from './types';
// Import service functions that handle external API calls.
import { fetchSpotifyData, initiatePlaylistDownload, API_DOMAIN } from './services/apiService';

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

    const [spotifyData, setSpotifyData] = useState<SpotifyAPIResponse | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [view, setView] = useState<View>('search');
    const [songForDownload, setSongForDownload] = useState<SpotifySong | null>(null);
    const [isDownloadingPlaylist, setIsDownloadingPlaylist] = useState<boolean>(false);
    const [playlistDownloadLink, setPlaylistDownloadLink] = useState<string | null>(null);
    const [selectedSongs, setSelectedSongs] = useState<Set<string>>(new Set());

    // New state for real-time download progress and socket connection.
    const [downloadProgress, setDownloadProgress] = useState<Map<string, DownloadStatus>>(new Map());
    const socketRef = useRef<Socket | null>(null);
    const songsInQueueRef = useRef<SpotifySong[]>([]);


    const resetAllState = () => {
        setError(null);
        setSpotifyData(null);
        setSongForDownload(null);
        setIsDownloadingPlaylist(false);
        setPlaylistDownloadLink(null);
        setSelectedSongs(new Set());
        setDownloadProgress(new Map());
        if (socketRef.current) {
            socketRef.current.disconnect();
            socketRef.current = null;
        }
        songsInQueueRef.current = [];
    };

    const handleSearch = useCallback(async (url: string) => {
        if (!url) {
            setError('Please enter a Spotify URL.');
            return;
        }
        setIsLoading(true);
        resetAllState();

        try {
            const data = await fetchSpotifyData(url);
            if (data.playlist) {
                const allSongIds = new Set(data.playlist.tracks.map(t => t.id));
                setSelectedSongs(allSongIds);
            }
            setSpotifyData(data);
            setView('results');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred.');
            setSpotifyData(null);
            setView('search');
        } finally {
            setIsLoading(false);
        }
    }, []);

    const handleDownloadSong = (song: SpotifySong) => {
        console.log(`Initiating download for song ID: ${song.id}`);
        setSongForDownload(song);
        setView('single_download');
    };

    const handleDownloadSelected = async () => {
        if (!spotifyData?.playlist || selectedSongs.size === 0 || isDownloadingPlaylist) return;

        setIsDownloadingPlaylist(true);
        setPlaylistDownloadLink(null);
        setError(null);
        setDownloadProgress(new Map());

        const songsToDownload = spotifyData.playlist.tracks.filter(track => selectedSongs.has(track.id));
        songsInQueueRef.current = songsToDownload;

        const socket = io(API_DOMAIN);
        socketRef.current = socket;

        socket.on('connect', () => {
            console.log('Socket connected with ID:', socket.id);
            initiatePlaylistDownload(songsToDownload, socket.id)
                .then(data => {
                    setPlaylistDownloadLink(data.link);
                })
                .catch(err => {
                    setError(err instanceof Error ? err.message : 'The download failed. Please try again.');
                    setIsDownloadingPlaylist(false);
                });
        });

        socket.on('downloadSequenceStarted', () => {
            console.log('Backend has started the download sequence.');
            if (songsInQueueRef.current.length > 0) {
                setDownloadProgress(prev => {
                    const newProgress = new Map(prev);
                    newProgress.set(songsInQueueRef.current[0].id, 'downloading');
                    return newProgress;
                });
            }
        });

        socket.on('progress', (data: { totalDownloaded: number }) => {
            const { totalDownloaded } = data;
            const queue = songsInQueueRef.current;
            
            setDownloadProgress(prev => {
                const newProgress = new Map(prev);
                if (totalDownloaded > 0 && queue[totalDownloaded - 1]) {
                    newProgress.set(queue[totalDownloaded - 1].id, 'done');
                }
                if (totalDownloaded < queue.length && queue[totalDownloaded]) {
                    newProgress.set(queue[totalDownloaded].id, 'downloading');
                }
                return newProgress;
            });
        });

        socket.on('downloadSequenceCompleted', () => {
            console.log('Backend has completed the download sequence.');
            setIsDownloadingPlaylist(false);
            socket.disconnect();
            socketRef.current = null;
        });
        
        socket.on('disconnect', () => {
            console.log('Socket disconnected.');
        });
    };
    
    // Cleanup socket connection on component unmount
    useEffect(() => {
        return () => {
            if (socketRef.current) {
                socketRef.current.disconnect();
            }
        };
    }, []);


    const handleSongSelectionToggle = (songId: string) => {
        setSelectedSongs(prev => {
            const newSelection = new Set(prev);
            if (newSelection.has(songId)) {
                newSelection.delete(songId);
            } else {
                newSelection.add(songId);
            }
            return newSelection;
        });
    };

    const handleSelectAllToggle = () => {
        if (spotifyData?.playlist) {
            if (selectedSongs.size === spotifyData.playlist.tracks.length) {
                setSelectedSongs(new Set());
            } else {
                const allSongIds = new Set(spotifyData.playlist.tracks.map(t => t.id));
                setSelectedSongs(allSongIds);
            }
        }
    };

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
                    onComplete={() => setView('results')}
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
                        downloadProgress={downloadProgress}
                    />
                </div>
            );
        }
        
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

    return (
        <div className="min-h-screen bg-[#0A0A10] text-white font-sans">
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
                
                {renderContent()}

            </main>
        </div>
    );
};

export default App;