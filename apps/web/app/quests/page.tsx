import QuestList from "../../components/modules/quests/QuestList";


export default function QuestPage() {
    return (
        <div>
            <h1>Quest Page</h1>
            <QuestList quests={[]} isEnabledRefreshButton={false} />
        </div>
    )
}       