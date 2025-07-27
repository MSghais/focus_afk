import { useState, useEffect } from "react";
import api from "../../../lib/api";
import { Note } from "../../../types";
import NotebookView from "./NotebookView";
import { useRouter } from "next/router";

interface NoteViewPageProps {
    noteId: string;
}

export function NoteViewPageComponent({ noteId }: NoteViewPageProps) {

    const router = useRouter();
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