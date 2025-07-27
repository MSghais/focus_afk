import { useNotesStore } from "../../../store/notes";
import { Note, NoteSource } from "../../../types";
    import SourceCard from "./SourceCard";
import { useUIStore } from "../../../store/uiStore";

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

    const handleGenerateSummaryAudio = () => {
        showToast({
            message: 'Generating summary audio',
            description: 'Please wait while we generate the summary audio',
            type: 'info',
            duration: 10000
        });
    }
    return (
        <div>
            <h1>Studio Notebook</h1>


            <div>
                <div>
                    <p>Summary audio</p>

                    <button className="bg-primary text-primary-foreground px-4 py-2 rounded-md" onClick={handleGenerateSummaryAudio} disabled={!note.id}    >
                        Generate summary audio
                    </button>
                </div>

                <div className="flex flex-col gap-2 mt-4 max-h-[500px] overflow-y-auto">

                    {note?.noteSources?.map((source: NoteSource) => (
                        <SourceCard
                            source={source}
                            className="w-full"
                        />
                    ))}

                </div>

            </div>
        </div>
    );
};  
