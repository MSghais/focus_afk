export default function QuestDetailPage({ params }: { params: { id: string } }) {

    const { id } = params;


    return (
        <div>
            <h1>Quest Detail Page</h1>
            <p>Quest ID: {params.id}</p>


        </div>
    )
}       