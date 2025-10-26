import type { SpotifyAPIResponse, SpotifySong } from '../types';

/**
 * This service centralizes all communication with the backend API.
 * It handles fetching metadata from Spotify via our server and initiating downloads.
 */

// The base URL for the backend API.
const API_DOMAIN = 'http://localhost:3000';

/**
 * Extracts the ID from a Spotify track or playlist URL.
 * @param url The full Spotify URL.
 * @returns The extracted ID, or null if the URL is invalid.
 */
const extractIdFromUrl = (url: string): string | null => {
    try {
        const path = new URL(url).pathname; // e.g., /track/12345 or /playlist/67890
        const parts = path.split('/');
        // The ID is expected to be the third part of the path (e.g., ['', 'track', '12345'])
        if ((parts[1] === 'track' || parts[1] === 'playlist') && parts[2]) {
            return parts[2].split('?')[0]; // Also remove query params like ?si=...
        }
    } catch (error) {
        // This will catch errors from `new URL()` if the input string is not a valid URL.
        console.error("Invalid URL provided to extractor:", error);
        return null;
    }
    return null;
};

/**
 * Fetches Spotify data from the backend API based on the provided URL.
 * @param url The Spotify URL for a track or a playlist.
 * @returns A Promise that resolves with the fetched Spotify data.
 * @throws An error if the URL is invalid or the API call fails.
 */
export const fetchSpotifyData = async (url: string): Promise<SpotifyAPIResponse> => {
    const id = extractIdFromUrl(url);
    if (!id) {
        throw new Error('Invalid Spotify URL. Could not extract ID from the provided link.');
    }

    let endpoint = '';
    if (url.includes('/track/')) {
        endpoint = `/api/song/${id}`;
    } else if (url.includes('/playlist/')) {
        endpoint = `/api/playlist/${id}`;
    } else {
        throw new Error('Invalid Spotify URL. Please provide a valid track or playlist link.');
    }

    const fullUrl = `${API_DOMAIN}${endpoint}`;
    console.log(`Fetching data from endpoint: ${fullUrl}`);
    const response = await fetch(fullUrl);

    if (!response.ok) {
        const errorBody = await response.text();
        console.error('API Error Response:', errorBody);
        throw new Error(`Failed to fetch data. Server responded with status: ${response.status}`);
    }

    // The backend should return data in the SpotifyAPIResponse format.
    return response.json();
};

/**
 * The structure of the request body for the download endpoint.
 */
interface DownloadRequestBody {
    tracks: {
        name: string;
        artist: string;
    }[];
}

/**
 * Initiates a download for a single song by calling the backend API.
 * @param song The song object to download.
 * @returns A Promise that resolves with an object containing the download link.
 */
export const initiateSingleSongDownload = async (song: SpotifySong): Promise<{ link: string }> => {
    console.log(`Requesting download for single song: ${song.name}`);
    
    const requestBody: DownloadRequestBody = {
        tracks: [
            {
                name: song.name,
                // Use the first artist as the primary artist for simplicity.
                artist: song.artists[0]?.name || 'Unknown Artist'
            }
        ]
    };

    const response = await fetch(`${API_DOMAIN}/api/download`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
        const errorBody = await response.text();
        console.error('API Error Response:', errorBody);
        throw new Error(`Download request failed. Server responded with status: ${response.status}`);
    }

    return response.json();
};

/**
 * Initiates the download process for a playlist of songs by calling the backend API.
 * This function sends all selected tracks at once and waits for a single response
 * with a link to the bundled download (e.g., a ZIP file).
 * @param songsToDownload An array of song objects to be "downloaded".
 * @returns A Promise that resolves with an object containing the final download link.
 */
export const initiatePlaylistDownload = async (songsToDownload: SpotifySong[]): Promise<{ link:string }> => {
    console.log(`Requesting download for ${songsToDownload.length} selected songs.`);

    const requestBody: DownloadRequestBody = {
        tracks: songsToDownload.map(song => ({
            name: song.name,
            artist: song.artists[0]?.name || 'Unknown Artist'
        }))
    };
    
    // Note: This request could take a long time on the server, especially for large playlists.
    // The server needs to be configured to handle long-running requests without timing out.
    // A more advanced solution for production might involve websockets or a polling mechanism
    // to check the status of the download job, but for this implementation, we use a single,
    // long-lived HTTP request as it's simpler to implement on the frontend.
    const response = await fetch(`${API_DOMAIN}/api/download`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
    });

     if (!response.ok) {
        const errorBody = await response.text();
        console.error('API Error Response:', errorBody);
        throw new Error(`Download request failed. Server responded with status: ${response.status}`);
    }

    return response.json();
};