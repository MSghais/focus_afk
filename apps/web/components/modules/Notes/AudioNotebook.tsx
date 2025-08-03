"use client"

import { useNotesStore } from "../../../store/notes";
import { Note, NoteSource } from "../../../types";
import SourceCard from "./SourceCard";
import { useUIStore } from "../../../store/uiStore";
import { useRef, useState, useEffect } from "react";
import { ButtonSecondary } from "../../small/buttons";
import { logClickedEvent } from "../../../lib/analytics";
import { api } from "../../../lib/api";

import { ConversationAiAgent } from "../Conversation/ConversationAiAgent";

interface AudioNotebookProps {
    note: Note;
    notesSources: NoteSource[];
}

export default function AudioNotebook({
    note,
    notesSources
}: AudioNotebookProps) {
    const { notes, setNoteSources, selectedNote, setSelectedNote, selectedNoteSource, setSelectedNoteSource } = useNotesStore();

    const { showToast } = useUIStore();

    const [isConversationOpen, setIsConversationOpen] = useState(false);
    const [audioStream, setAudioStream] = useState<MediaStream | null>(null);
    const [audioData, setAudioData] = useState<Blob | null>(null);
    const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
    const [currentAudioUrl, setCurrentAudioUrl] = useState<string | null>(null);
    const [isAudioPlaying, setIsAudioPlaying] = useState(false);
    const [audioDuration, setAudioDuration] = useState<number>(0);
    const [audioProgress, setAudioProgress] = useState<number>(0);
    const [audioLoadError, setAudioLoadError] = useState<string | null>(null);
    const [hasAudioData, setHasAudioData] = useState<boolean>(false);

    const aiAudioRef = useRef<HTMLAudioElement>(null);
    const audioRef = useRef<HTMLAudioElement>(null);
    const userAudioRef = useRef<HTMLAudioElement>(null);

    // Utility function to check if audio input (microphone) is available and activated
    const checkAudioActivated = async (): Promise<boolean> => {
        try {
            // Try to get audio stream from the user's microphone
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            // If we get here, audio is activated (permission granted)
            // Stop all tracks to release the mic
            stream.getTracks().forEach(track => track.stop());
            return true;
        } catch (err) {
            // Permission denied or no audio device
            return false;
        }
    };

    // Utility function to check if the system volume is activated (not muted and > 0)
    // Note: Browsers do not provide direct access to system volume/mute state for privacy reasons.
    // We can only check if the AudioContext is not suspended (i.e., audio output is allowed).
    const checkVolumeActivated = async (): Promise<boolean> => {
        try {
            const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
            // If the context is running, volume is "activated" (not muted by browser policy)
            const isActive = audioCtx.state === "running";
            await audioCtx.close();
            return isActive;
        } catch (err) {
            // If we can't create an AudioContext, assume volume is not activated
            return false;
        }
    };

    const handleGenerateSummaryAudio = async () => {
        if (!note.id) {
            showToast({
                message: 'No note selected',
                type: 'error'
            });
            return;
        }

        if (!note.text || note.text.trim().length === 0) {
            showToast({
                message: 'Note has no content to summarize',
                type: 'error'
            });
            return;
        }

        console.log("handleGenerateSummaryAudio");
        logClickedEvent("studio_notebook_generate_summary_audio");

        setIsGeneratingAudio(true);
        setAudioLoadError(null);
        setHasAudioData(false);

        showToast({
            message: 'Generating audio summary',
            description: 'Please wait while we generate the summary audio',
            type: 'info',
            duration: 10000
        });

        try {
            // Call the backend API to generate audio summary
            console.log('Generating audio for note:', note.id);
            const audioBlob = await api.generateNoteAudioSummary(note.id);
            console.log('Audio blob received:', audioBlob);
            console.log('Audio blob size:', audioBlob.size);
            console.log('Audio blob type:', audioBlob.type);

            // Validate the audio blob
            if (!audioBlob || audioBlob.size === 0) {
                throw new Error('Received empty audio data');
            }

            // Clean up previous audio URL if it exists
            if (currentAudioUrl) {
                URL.revokeObjectURL(currentAudioUrl);
            }

            const audioUrl = URL.createObjectURL(audioBlob);
            console.log('Audio URL created:', audioUrl);

            // Set audio data immediately so the player shows up
            setAudioData(audioBlob);
            setHasAudioData(true);
            setCurrentAudioUrl(audioUrl);

            // Set the audio source and load it
            if (aiAudioRef.current) {
                console.log('Setting audio source:', audioUrl);

                // Reset audio element state
                aiAudioRef.current.pause();
                aiAudioRef.current.currentTime = 0;
                aiAudioRef.current.src = audioUrl;

                // Verify the src was set
                console.log('Audio src after setting:', aiAudioRef.current.src);

                // Load the audio
                aiAudioRef.current.load();

                // Add event listeners to track loading
                const audio = aiAudioRef.current;
                const handleLoadStart = () => console.log('Audio load started');
                const handleCanPlay = () => console.log('Audio can play');
                const handleLoadedData = () => console.log('Audio data loaded');
                const handleLoadedMetadata = () => console.log('Audio metadata loaded');

                audio.addEventListener('loadstart', handleLoadStart);
                audio.addEventListener('canplay', handleCanPlay);
                audio.addEventListener('loadeddata', handleLoadedData);
                audio.addEventListener('loadedmetadata', handleLoadedMetadata);

                // Try to play the audio after a short delay to ensure it's loaded
                setTimeout(async () => {
                    try {
                        console.log('Attempting to play audio, src:', audio.src);
                        console.log('Audio ready state:', audio.readyState);
                        if (aiAudioRef.current) {
                            await aiAudioRef.current.play();
                        }
                    } catch (playError) {
                        console.error('Error playing audio:', playError);
                        // Don't throw error here, just log it - user can still click play button
                    } finally {
                        // Clean up event listeners
                        audio.removeEventListener('loadstart', handleLoadStart);
                        audio.removeEventListener('canplay', handleCanPlay);
                        audio.removeEventListener('loadeddata', handleLoadedData);
                        audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
                    }
                }, 1000);
            }

            showToast({
                message: 'Audio summary generated successfully',
                type: 'success'
            });
        } catch (error) {
            console.error('Error generating audio summary:', error);
            setAudioLoadError(error instanceof Error ? error.message : 'Unknown error');
            showToast({
                message: 'Failed to generate audio summary',
                description: error instanceof Error ? error.message : 'Unknown error',
                type: 'error'
            });
        } finally {
            setIsGeneratingAudio(false);
        }
    }

    const handleInitAudioContext = async () => {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const audioContext = new AudioContext();
        const source = audioContext.createMediaStreamSource(stream);
        const processor = audioContext.createScriptProcessor(1024, 1, 1);
        source.connect(processor);
        processor.connect(audioContext.destination);

        return { audioContext, source, processor };
    }

    const handleAudioPlay = () => {
        setIsAudioPlaying(true);
        setAudioLoadError(null);
    };

    const handleAudioPause = () => {
        setIsAudioPlaying(false);
    };

    const handleAudioTimeUpdate = () => {
        if (aiAudioRef.current) {
            setAudioProgress(aiAudioRef.current.currentTime);
            setAudioDuration(aiAudioRef.current.duration);
        }
    };

    const handleAudioLoadedMetadata = () => {
        if (aiAudioRef.current) {
            console.log('Audio metadata loaded in handler - duration:', aiAudioRef.current.duration);
            setAudioDuration(aiAudioRef.current.duration);
            setAudioLoadError(null);
        }
    };

    const handleAudioError = (e: React.SyntheticEvent<HTMLAudioElement, Event>) => {
        console.error('Audio error in handler:', e);
        const target = e.target as HTMLAudioElement;
        console.error('Audio error details:', {
            error: target.error,
            networkState: target.networkState,
            readyState: target.readyState,
            src: target.src
        });
        setAudioLoadError('Failed to load audio file');
        setIsAudioPlaying(false);
    };

    const formatTime = (time: number) => {
        if (isNaN(time)) return '0:00';
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
        if (aiAudioRef.current && audioDuration > 0) {
            const rect = e.currentTarget.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const percentage = clickX / rect.width;
            const newTime = percentage * audioDuration;
            aiAudioRef.current.currentTime = newTime;
            setAudioProgress(newTime);
        }
    };

    const handlePlayPause = () => {
        if (aiAudioRef.current) {
            console.log('Play/Pause clicked. Current src:', aiAudioRef.current.src);
            console.log('Current audio URL state:', currentAudioUrl);

            if (isAudioPlaying) {
                aiAudioRef.current.pause();
            } else {
                // Ensure the audio element has the correct source
                if (currentAudioUrl && aiAudioRef.current.src !== currentAudioUrl) {
                    console.log('Fixing audio src from', aiAudioRef.current.src, 'to', currentAudioUrl);
                    aiAudioRef.current.src = currentAudioUrl;
                    aiAudioRef.current.load();
                }

                // Check if audio is ready to play
                if (aiAudioRef.current.readyState >= 2) { // HAVE_CURRENT_DATA or higher
                    aiAudioRef.current.play().catch(err => {
                        console.error('Error playing audio:', err);
                        setAudioLoadError('Failed to play audio');
                        showToast({
                            message: 'Error playing audio',
                            type: 'error'
                        });
                    });
                } else {
                    // Audio not ready, try to load it first
                    console.log('Audio not ready, loading first. Ready state:', aiAudioRef.current.readyState);
                    aiAudioRef.current.load();
                    aiAudioRef.current.play().catch(err => {
                        console.error('Error playing audio after load:', err);
                        setAudioLoadError('Audio not ready to play');
                        showToast({
                            message: 'Audio not ready to play',
                            type: 'error'
                        });
                    });
                }
            }
        }
    };

    const handleRetry = () => {
        setAudioLoadError(null);
        setHasAudioData(false);
        handleGenerateSummaryAudio();
    };

    // Configure audio element when URL changes
    useEffect(() => {
        if (currentAudioUrl && aiAudioRef.current) {
            console.log('useEffect: Setting audio src to:', currentAudioUrl);
            aiAudioRef.current.src = currentAudioUrl;
            aiAudioRef.current.load();
        }
    }, [currentAudioUrl]);

    // Cleanup audio URL on unmount
    useEffect(() => {
        return () => {
            if (currentAudioUrl) {
                URL.revokeObjectURL(currentAudioUrl);
            }
        };
    }, [currentAudioUrl]);

    return (
        <div className="rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                    </svg>
                </div>
                <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Audio Studio</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Generate audio summaries of your notes</p>
                </div>
            </div>

            {/* Content Stats */}
            {/* <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                            <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-xs  dark:text-gray-400">Note Length</p>
                            <p className="text-sm font-medium ">
                                {note.text ? note.text.length : 0} chars
                            </p>
                        </div>
                    </div>
                </div>
                <div className=" rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                            <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-xs ">Sources</p>
                            <p className="text-sm font-medium ">
                                {note.noteSources ? note.noteSources.length : 0} items
                            </p>
                        </div>
                    </div>
                </div>
            </div> */}

            {/* Generate Button */}
            <div className="mb-6">
                <ButtonSecondary
                    className={`w-full py-4 px-6 rounded-xl font-medium transition-all duration-300 transform hover:scale-105 ${isGeneratingAudio
                            ? 'bg-gray-400 cursor-not-allowed'
                            : 'bg-blue-600 hover:bg-blue-700 shadow-lg hover:shadow-xl'
                        }`}
                    onClick={handleGenerateSummaryAudio}
                    disabled={!note.id || isGeneratingAudio}
                >
                    <div className="flex items-center justify-center gap-3">
                        {isGeneratingAudio ? (
                            <>
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                <span>Generating Audio Summary...</span>
                            </>
                        ) : (
                            <>
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                                </svg>
                                <span>Generate Audio Summary</span>
                            </>
                        )}
                    </div>
                </ButtonSecondary>
            </div>

            {/* Audio Player */}
            {hasAudioData && (
                <div className="rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                            </svg>
                        </div>
                        <div>
                            <h4 className="text-sm font-medium text-gray-900 dark:text-white">Audio Summary</h4>
                            <p className="text-xs text-gray-500 dark:text-gray-400">AI-generated summary of your note</p>
                        </div>
                    </div>

                    {/* Error Display */}
                    {audioLoadError && (
                        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <svg className="w-4 h-4 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <span className="text-sm text-red-700 dark:text-red-300">{audioLoadError}</span>
                                </div>
                                <button
                                    onClick={handleRetry}
                                    className="text-sm text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200 underline"
                                >
                                    Retry
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Custom Audio Player */}
                    <div className="space-y-4">
                        {/* Loading State */}
                        {isGeneratingAudio && (
                            <div className="flex items-center justify-center py-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                                    <span className="text-sm text-gray-600 dark:text-gray-400">Loading audio...</span>
                                </div>
                            </div>
                        )}

                        {/* Progress Bar */}
                        <div
                            className="w-full h-2 rounded-full cursor-pointer overflow-hidden bg-gray-200 dark:bg-gray-700"
                            onClick={handleSeek}
                        >
                            <div
                                className="h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-full transition-all duration-300"
                                style={{ width: `${audioDuration > 0 ? (audioProgress / audioDuration) * 100 : 0}%` }}
                            />
                        </div>

                        {/* Controls */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={handlePlayPause}
                                    disabled={isGeneratingAudio}
                                    className={`w-10 h-10 rounded-full flex items-center justify-center text-white transition-all duration-200 shadow-lg ${isGeneratingAudio
                                            ? 'bg-gray-400 cursor-not-allowed'
                                            : 'bg-blue-600 hover:bg-blue-700'
                                        }`}
                                >
                                    {isGeneratingAudio ? (
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    ) : isAudioPlaying ? (
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    ) : (
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v18l15-9-15-9z" />
                                        </svg>
                                    )}
                                </button>
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                                {formatTime(audioProgress)} / {formatTime(audioDuration)}
                            </div>
                            <button
                                onClick={() => {
                                    if (aiAudioRef.current) {
                                        console.log('Audio element state:', {
                                            src: aiAudioRef.current.src,
                                            readyState: aiAudioRef.current.readyState,
                                            networkState: aiAudioRef.current.networkState,
                                            duration: aiAudioRef.current.duration,
                                            currentTime: aiAudioRef.current.currentTime,
                                            paused: aiAudioRef.current.paused,
                                            ended: aiAudioRef.current.ended
                                        });
                                    }
                                }}
                                className="text-xs text-gray-400 hover:text-gray-600 underline"
                            >
                                Debug
                            </button>
                        </div>
                    </div>

                    {/* Hidden audio element for actual playback */}
                    <audio
                        ref={aiAudioRef}
                        onPlay={handleAudioPlay}
                        onPause={handleAudioPause}
                        onTimeUpdate={handleAudioTimeUpdate}
                        onLoadedMetadata={handleAudioLoadedMetadata}
                        onError={handleAudioError}
                        className="hidden"
                    />
                </div>
            )}



            <button onClick={() => setIsConversationOpen(!isConversationOpen)}>Open Conversation</button>

            {isConversationOpen && <ConversationAiAgent />}
            {/* Info Section */}
            {/* <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="flex items-start gap-3">
                    <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                    </div>
                    <div>
                        <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100">How it works</h4>
                        <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                            Our AI analyzes your note content and all associated sources to create a concise audio summary. 
                            The summary focuses on key insights and actionable takeaways, perfect for quick consumption.
                        </p>
                    </div>
                </div>
            </div> */}
        </div>
    );
};  
