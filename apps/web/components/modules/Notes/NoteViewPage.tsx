"use client"
import { useState, useEffect } from "react";
import api from "../../../lib/api";
import { Note } from "../../../types";
import NotebookView from "./NotebookView";
import { useRouter } from "next/router";
import { useParams } from "next/navigation";

interface NoteViewPageProps {
    noteIdProp?: string;
}

export function NoteViewPageComponent({ noteIdProp }: NoteViewPageProps) {
    const params = useParams();
    const id = params.id as string;

    if (!id && !noteIdProp) {
        return <div>Note not found</div>;
    }
    const router = useRouter();
    const noteId = noteIdProp || id;
    const [note, setNote] = useState<Note | null>(null);
    useEffect(() => {
        const fetchNote = async () => {
            const response = await api.getNote(noteId);
            if (response.success && response.data) {
                setNote(response.data);
            }
        }
        fetchNote();
    }, [noteId]);

    const onUpdate = (note: Partial<Note>) => {
        setNote(prev => ({ ...prev, ...note } as Note));
    }
    const onBack = () => {
        router.push('/notes');
    }

    const onEdit = (note: Note) => {
        router.push(`/notes/${note.id}`);
    }
    const onDelete = (noteId: string) => {
        router.push('/notes');
    }

    return (
        <div>

            {note && <NotebookView note={note} onUpdate={onUpdate} onBack={onBack} onEdit={onEdit} onDelete={onDelete} />}
        </div>
    );
}