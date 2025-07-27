import { NoteViewPageComponent } from "../../../components/modules/Notes/NoteViewPage";
import { useParams } from "next/navigation";

export default function NoteViewPage() {

    const params = useParams();
    const id = params.id as string;
    console.log('id', id);

    if (!id) {
        return <div>Note not found</div>;
    }
    return <NoteViewPageComponent noteId={id} />;
}   