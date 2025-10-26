import React, { useState } from 'react';

/**
 * Props for the UrlInputForm component.
 */
interface UrlInputFormProps {
    /** A function to be called when the form is submitted. It passes the URL string up to the parent component. */
    onSubmit: (url: string) => void;
    /** A boolean to indicate if the application is in a loading state, which disables the form. */
    isLoading: boolean;
}

/**
 * A reusable form component for entering a Spotify URL.
 */
export const UrlInputForm: React.FC<UrlInputFormProps> = ({ onSubmit, isLoading }) => {
    // 'useState' hook to manage the value of the input field.
    const [url, setUrl] = useState('');

    /**
     * Handles the form submission event.
     * @param e The form event object.
     */
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault(); // Prevents the default browser behavior of reloading the page on form submission.
        onSubmit(url); // Calls the parent component's submit handler with the current URL.
    };

    return (
        <form onSubmit={handleSubmit} className="max-w-2xl mx-auto">
            <div className="flex items-center bg-gray-900/50 border border-gray-700 rounded-full shadow-lg overflow-hidden p-2 backdrop-blur-sm">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-400 ml-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
                <input
                    type="text"
                    value={url}
                    // Updates the 'url' state every time the user types in the input field.
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://open.spotify.com/..."
                    className="w-full bg-transparent text-gray-200 placeholder-gray-500 focus:outline-none px-4 py-2"
                    disabled={isLoading}
                />
                <button
                    type="submit"
                    className="bg-gradient-to-r from-purple-500 to-cyan-500 hover:from-purple-600 hover:to-cyan-600 text-white font-bold py-2 px-6 rounded-full transition-all duration-300 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105"
                    disabled={isLoading}
                >
                    {/* The button text changes based on the 'isLoading' prop. */}
                    {isLoading ? 'Snagging...' : 'Snag'}
                </button>
            </div>
        </form>
    );
};
