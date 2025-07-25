'use client';
import React, { useEffect, useState } from 'react';
import QuestItem from './QuestItem';
import styles from './QuestList.module.scss';
import { useUIStore } from '../../../store/uiStore';
import { useAuthStore } from '../../../store/auth';
import { apiService } from '../../../lib/api';
import { Quest } from '../../../lib/gamification';
import { Icon } from '../../small/icons';

interface QuestListProps {
  quests: Quest[];
  isEnabledRefreshButton?: boolean;
  onSelect?: (id: string) => void;
}

const QuestList: React.FC<QuestListProps> = ({ quests, onSelect, isEnabledRefreshButton = false }) => {
  const { userConnected } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const loadQuests = async () => {

    try {
      if (!userConnected?.id) return;
      // console.log("loadQuests", userConnected.id);
      const res = await apiService.getQuests(userConnected.id)
      // console.log("res", res);
      if (
        Array.isArray((res as any).quests)
      ) {
        setQuestsState((res as any).quests);
      } else {
        setQuestsState([]);
        setError('Failed to load quests');
      }
      setLoading(false);
    } catch (error) {
      setError('Failed to load quests');
      showToast({ message: 'Failed to load quests', type: 'error' });
      setLoading(false);
    }
    finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setLoading(true);
    loadQuests();
  }, [userConnected?.id]);

  const { showToast } = useUIStore();
  const [questsState, setQuestsState] = useState<Quest[]>([]);

  useEffect(() => {
    setQuestsState(quests);
  }, [quests]);

  // console.log("questsState", questsState);
  return (

    <div className="flex flex-col gap-2 max-h-[250px] overflow-y-auto scrollbar-hide">
      {/* <h1 className="text-2xl font-bold">Quests</h1> */}

      {isEnabledRefreshButton && <button onClick={() => loadQuests()}><Icon name="refresh" /></button>}
      <div className={styles.questList}>
        {questsState.map((quest) => (
          <QuestItem key={quest.id} quest={quest} onClick={() => onSelect?.(quest.id)} />
        ))}
      </div>
    </div>

  );
};

export default QuestList; 