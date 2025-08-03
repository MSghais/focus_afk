"use client"

import { useNotesStore } from "../../../store/notes";
import { Note, NoteSource } from "../../../types";
import SourceCard from "./SourceCard";
import { useUIStore } from "../../../store/uiStore";
import { useRef, useState, useEffect } from "react";
import { ButtonSecondary, ButtonSimple } from "../../small/buttons";
import { logClickedEvent } from "../../../lib/analytics";
import { api } from "../../../lib/api";
import AudioNotebook from "./AudioNotebook";

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


    const [activeTab, setActiveTab] = useState<"audio" | "video" | "conversation">("audio");
    
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
        <div className="rounded-xl p-1 shadow-lg">
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                    </svg>
                </div>
                <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Studio</h3>
                </div>
            </div>

            <div className="flex items-center gap-3 mb-6">
                <ButtonSimple
                className={activeTab === "audio" ? "bg-gray-200 dark:bg-gray-800" : ""}     
                onClick={() => setActiveTab("audio")}>Audio</ButtonSimple>
                <ButtonSimple
                className={activeTab === "video" ? "bg-gray-200 dark:bg-gray-800" : ""}
                onClick={() => setActiveTab("video")}>Video</ButtonSimple>
                <ButtonSimple
                className={activeTab === "conversation" ? "bg-gray-200 dark:bg-gray-800" : ""}
                onClick={() => setActiveTab("conversation")}>Conversation</ButtonSimple>
            </div>

            {activeTab === "audio" && (
                <AudioNotebook note={note} notesSources={notesSources} />
            )}

            {/* Info Section */}
            <div className="mt-6 p-4  rounded-lg border border-blue-200 dark:border-blue-800">
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
            </div>
        </div>
    );
};  
