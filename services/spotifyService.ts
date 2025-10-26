import type { SpotifyAPIResponse } from '../types';
import { dummySongData, dummyPlaylistData } from '../data/dummyData';

/**
 * This service is responsible for fetching song or playlist data.
 * In a real application, this function would make a network request (e.g., using fetch)
 * to a backend server that communicates with the Spotify API.
 * For this demo, it simulates that request using a delay and dummy data.
 */

/**
 * Fetches Spotify data based on the provided URL.
 * @param url The Spotify URL for a track or a playlist.
 * @returns A Promise that resolves with the fetched Spotify data.
 * @throws An error if the URL is not a valid Spotify track or playlist URL.
 */
export const fetchSpotifyData = (url: string): Promise<SpotifyAPIResponse> => {
    // A Promise is used to handle asynchronous operations, just like a real API call.
    return new Promise((resolve, reject) => {
        // setTimeout simulates the time it would take to get a response from a server.
        setTimeout(() => {
            if (url.includes('open.spotify.com/track')) {
                console.log('Simulating API fetch for a single track...');
                // If the URL is for a track, resolve the promise with dummy song data.
                resolve(dummySongData);
            } else if (url.includes('open.spotify.com/playlist')) {
                console.log('Simulating API fetch for a playlist...');
                // If the URL is for a playlist, resolve with dummy playlist data.
                resolve(dummyPlaylistData);
            } else {
                // If the URL is invalid, reject the promise with an error.
                reject(new Error('Invalid Spotify URL. Please provide a valid track or playlist link.'));
            }
        }, 1500); // 1.5-second delay to simulate network latency.
    });
};
