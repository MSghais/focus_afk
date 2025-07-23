'use client';

import { useEffect, useState } from 'react';
import { useFocusAFKStore } from '../../../store/store';
import styles from '../../../styles/components/mentor.module.scss';
import ChatAi from '../ChatAi';
import { useUIStore } from '../../../store/uiStore';
import { useApi } from '../../../hooks/useApi';
import { Message, Mentor } from '../../../types';
import { useAuthStore } from '../../../store/auth';


export default function MentorList() {
  const { timerSessions, tasks, goals } = useFocusAFKStore();
  const { userConnected } = useAuthStore();
  const { showToast } = useUIStore();
  const apiService = useApi();
  const [messages, setMessages] = useState<Message[]>([]);
  const [mentors, setMentors] = useState<Mentor[]>([]);

  useEffect(() => {
    if(userConnected) loadMentors();
    
    // Load recent session feedback
    if (timerSessions.length > 0) {
      const latestSession = timerSessions[0];
      // generateSessionFeedback(latestSession);
    }
  }, [userConnected]);



  const loadMentors = async () => {
    try {

      if(!userConnected) return;
      
      const response = await apiService.getMentors();
      console.log('response', response);
      if ( response) {
        setMentors(response);
      }
    } catch (error) {
      console.error('Error loading mentors:', error);
    }
  };


  console.log('mentors', mentors);
  return (
    <div className={styles.mentor}>
      <h1 className={styles.title}>AI Mentors</h1>

      <button onClick={loadMentors}>Load Mentors</button>

      <div className={styles.mentorGrid}>
        {mentors.map((mentor) => (
          <div className={styles.mentorCard} key={mentor.id}>
            <h2 className={styles.cardTitle}>{mentor.name}</h2>
            <p className={styles.cardDescription}>{mentor.role}</p>
          </div>
        ))}
      </div>

    </div>
  );
} 