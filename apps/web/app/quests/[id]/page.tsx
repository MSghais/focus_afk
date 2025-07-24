import TimeLoading from "../../../components/small/loading/time-loading";
import QuestPageDetailComponent from "../../../components/modules/quests/QuestPageDetailComponent";

import { Metadata } from "next";
export const metadata: Metadata = {
    title: 'Quest Detail',
    description: 'Quest Detail Page',
}

export default async function QuestDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    if (!id) {
        return <div>No ID provided
            <TimeLoading />
        </div>;
    }

    return (
        <div>
            {id && <QuestPageDetailComponent id={id as string}  actionLabel="Complete Quest" />}

        </div>
    )
}       