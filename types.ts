// This file defines the shape of the data we expect from the Spotify API.
// Using TypeScript interfaces helps prevent bugs by ensuring we use the data correctly.

/**
 * Represents the possible states for a song's download progress.
 */
export type DownloadStatus = 'downloading' | 'done';

/**
 * Represents an image object from Spotify, typically for album art or artist photos.
 */
export interface SpotifyImage {
    url: string;      // The direct URL to the image.
    width: number;    // The width of the image in pixels.
    height: number;   // The height of the image in pixels.
}

/**
 * Represents a single artist on Spotify.
 */
export interface Artist {
    name: string; // The name of the artist.
    url: string;  // A link to the artist's page on Spotify.
}

/**
 * Represents a single song (track) on Spotify.
 */
export interface SpotifySong {
    name: string;         // The name of the song.
    duration_ms: number;  // The duration of the song in milliseconds.
    id: string;           // The unique Spotify ID for the song.
    url: string;          // A link to the song on Spotify.
    img: SpotifyImage[];  // An array of images for the song's album art, in different sizes.
    artists: Artist[];    // An array of artists who performed the song.
}

/**
 * Represents the owner of a Spotify playlist.
 */
export interface SpotifyPlaylistOwner {
    display_name: string; // The display name of the playlist owner.
    url: string;          // A link to the owner's profile on Spotify.
    id: string;           // The unique Spotify ID for the user.
}

/**
 * Represents a Spotify playlist.
 */
export interface SpotifyPlaylist {
    name: string;               // The name of the playlist.
    description: string;        // The playlist's description.
    images: SpotifyImage[];     // An array of images for the playlist cover art.
    id: string;                 // The unique Spotify ID for the playlist.
    url: string;                // A link to the playlist on Spotify.
    tracks: SpotifySong[];      // An array of all the songs contained in the playlist.
    owner: SpotifyPlaylistOwner; // An object containing information about the playlist's creator.
}

/**
 * Represents the overall structure of the response from our backend after fetching Spotify data.
 * It can contain either a single song OR a playlist, but not both at the same time.
 */
export interface SpotifyAPIResponse {
    song?: SpotifySong;         // Optional property for a single song.
    playlist?: SpotifyPlaylist; // Optional property for a playlist.
}