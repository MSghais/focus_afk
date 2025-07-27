"use client"

import { useNotesStore } from "../../../store/notes";
import { Note, NoteSource } from "../../../types";
import SourceCard from "./SourceCard";
import { useUIStore } from "../../../store/uiStore";
import { useRef, useState } from "react";
import { ButtonSecondary } from "../../small/buttons";
import { logClickedEvent } from "../../../lib/analytics";

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

    // Example usage: check on mount or before starting audio
    // useEffect(() => {
    //     checkAudioActivated().then(isActive => {
    //         if (!isActive) {
    //             showToast({
    //                 message: 'Microphone access is not enabled.',
    //                 type: 'error'
    //             });
    //         }
    //     });
    // }, []);


    const handleGenerateSummaryAudio = async () => {
        // const result = await handleInitAudioContext();
        console.log("handleGenerateSummaryAudio");
        logClickedEvent("studio_notebook_generate_summary_audio");
        showToast({
            message: 'Coming soon',
            description: 'Please wait while we generate the summary audio',
            type: 'info',
            duration: 10000
        });
        // const isSystemVolumeActivated = await checkVolumeActivated();
        // const isAudioActivated = await checkAudioActivated();
        // console.log("isSystemVolumeActivated", isSystemVolumeActivated);
        // console.log("isAudioActivated", isAudioActivated);
        // if (result) {
        //     const audioContext = result.audioContext;
        //     const source = result.source;
        //     const processor = result.processor;
        //     source.connect(processor);
        //     processor.connect(audioContext.destination);
        // }

        // showToast({
        //     message: 'Generating summary audio',
        //     description: 'Please wait while we generate the summary audio',
        //     type: 'info',
        //     duration: 10000
        // });
    }



    const handleInitAudioContext = async () => {

        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const audioContext = new AudioContext();
        const source = audioContext.createMediaStreamSource(stream);
        const processor = audioContext.createScriptProcessor(1024, 1, 1);
        source.connect(processor);
        processor.connect(audioContext.destination);

        return { audioContext, source, processor };

        // showToast({
        //     message: 'Generating summary audio',
        //     description: 'Please wait while we generate the summary audio',
        //     type: 'info',
        //     duration: 10000
        // });
    }
    return (


        <div
        >
            {/* <h1>Studio Notebook</h1> */}

            <div>
                <p>Summary of your note</p>

                <ButtonSecondary className="bg-[#000] text-primary-foreground px-4 py-2 rounded-md" onClick={handleGenerateSummaryAudio} disabled={!note.id}    >
                    Generate summary audio
                </ButtonSecondary>
            </div>

            {/* <div>
                <p>User audio</p>
                <audio ref={userAudioRef} controls />
            </div> */}

            <div>
                <p>AI audio</p>

                
                <audio ref={aiAudioRef} controls />
            </div>

            <div className="flex flex-col gap-2 mt-4 max-h-[500px] overflow-y-auto py-4">

                {note?.noteSources?.map((source: NoteSource) => (
                    <SourceCard
                        source={source}
                        className="w-full"
                    />
                ))}

            </div>



        </div>
    );
};  
