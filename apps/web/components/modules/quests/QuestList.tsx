import React from 'react';
import QuestItem, { QuestItemProps } from './QuestItem';
import styles from './QuestList.module.scss';

interface QuestListProps {
  quests: QuestItemProps[];
  onSelect?: (id: string) => void;
}

const QuestList: React.FC<QuestListProps> = ({ quests, onSelect }) => (
  <div className="flex flex-col gap-2">
    <h1 className="text-2xl font-bold">Quests</h1>
    <div className={styles.questList}>
      {quests.map((quest) => (
        <QuestItem key={quest.id} {...quest} onClick={() => onSelect?.(quest.id)} />
      ))}
    </div>
  </div>

);

export default QuestList; 