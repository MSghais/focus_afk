"use client"

import { useNotesStore } from "../../../store/notes";
import { Note, NoteSource } from "../../../types";
import SourceCard from "./SourceCard";
import { useUIStore } from "../../../store/uiStore";
import { useRef, useState, useEffect } from "react";
import { ButtonSecondary } from "../../small/buttons";
import { logClickedEvent } from "../../../lib/analytics";
import { api } from "../../../lib/api";

interface StudioNotebookProps {
    note: Note;
    notesSources: NoteSource[];
}

export default function StudioNotebook({
    note,
    notesSources
}: StudioNotebookProps) {
    const { notes, setNoteSources, selectedNote, setSelectedNote, selectedNoteSource, setSelectedNoteSource } = useNotesStore();

    const { showToast } = useUIStore();

    const [audioStream, setAudioStream] = useState<MediaStream | null>(null);
    const [audioData, setAudioData] = useState<Blob | null>(null);
    const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
    const [currentAudioUrl, setCurrentAudioUrl] = useState<string | null>(null);

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

        console.log("handleGenerateSummaryAudio", note);

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
        showToast({
            message: 'Generating audio summary',
            description: 'Please wait while we generate the summary audio',
            type: 'info',
            duration: 10000
        });

        try {
            // Call the backend API to generate audio summary
            const audioBlob = await api.generateNoteAudioSummary(note.id);
            const audioUrl = URL.createObjectURL(audioBlob);
            
            // Clean up previous audio URL if it exists
            if (currentAudioUrl) {
                URL.revokeObjectURL(currentAudioUrl);
            }
            
            setCurrentAudioUrl(audioUrl);
            
            // Set the audio source and play it
            if (aiAudioRef.current) {
                aiAudioRef.current.src = audioUrl;
                aiAudioRef.current.load();
                aiAudioRef.current.play().catch(err => {
                    console.error('Error playing audio:', err);
                    showToast({
                        message: 'Error playing audio',
                        type: 'error'
                    });
                });
            }

            showToast({
                message: 'Audio summary generated successfully',
                type: 'success'
            });
        } catch (error) {
            console.error('Error generating audio summary:', error);
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

    // Cleanup audio URL on unmount
    useEffect(() => {
        return () => {
            if (currentAudioUrl) {
                URL.revokeObjectURL(currentAudioUrl);
            }
        };
    }, [currentAudioUrl]);

    return (
        <div className="flex flex-col gap-2 py-2 mt-4 max-h-[500px] overflow-y-auto py-4">
            <div>
                <p className="text-sm font-medium mb-2">Audio Summary</p>
                <p className="text-xs text-gray-600 mb-3">
                    Generate a short audio summary of your note and its sources
                </p>

                <ButtonSecondary 
                    className="bg-[#000] text-primary-foreground px-4 py-2 rounded-md hover:bg-gray-800 transition-colors" 
                    onClick={handleGenerateSummaryAudio} 
                    disabled={!note.id || isGeneratingAudio}
                >
                    {isGeneratingAudio ? '🎵 Generating audio...' : '🎵 Generate summary audio'}
                </ButtonSecondary>
            </div>

            <div className="mt-4">
                <p className="text-sm font-medium mb-2">Audio Player</p>
                <audio 
                    ref={aiAudioRef} 
                    controls 
                    className="w-full"
                    preload="none"
                />
            </div>
        </div>
    );
};  
