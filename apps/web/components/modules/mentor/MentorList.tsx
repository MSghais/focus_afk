'use client';

import { useEffect, useState } from 'react';
import { useFocusAFKStore } from '../../../store/store';
import styles from '../../../styles/components/mentor.module.scss';
import ChatAi from '../ChatAi';
import { useUIStore } from '../../../store/uiStore';
import { useApi } from '../../../hooks/useApi';
import { Message, Mentor } from '../../../types';
import { useAuthStore } from '../../../store/auth';
import MentorForm from './MentorForm';
import { ButtonPrimary } from '../../small/buttons';
import { useMentorsStore } from '../../../store/mentors';
import { Checkbox } from '../../small/checkbox';
import { logClickedEvent } from '../../../lib/analytics'; 
export default function MentorList() {
  const { mentors, setMentors, setSelectedMentor, selectedMentor } = useMentorsStore();
  const { timerSessions, tasks, goals } = useFocusAFKStore();
  const { userConnected } = useAuthStore();
  const { showToast } = useUIStore();
  const apiService = useApi();
  const [messages, setMessages] = useState<Message[]>([]);
  const [mentorsState, setMentorsState] = useState<Mentor[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingMentor, setEditingMentor] = useState<Mentor | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (userConnected) loadMentors();

    // Load recent session feedback
    if (timerSessions.length > 0) {
      const latestSession = timerSessions[0];
      // generateSessionFeedback(latestSession);
    }
  }, [userConnected]);

  const loadMentors = async () => {
    try {
      setIsLoading(true);
      if (!userConnected) return;

      const response = await apiService.getMentors();
      console.log('response', response);
      if (response) {
        setMentorsState(response);
        setMentors(response);
        // setSelectedMentor(response[0]);
      }
    } catch (error) {
      console.error('Error loading mentors:', error);
      showToast({
        message: 'Failed to load mentors',
        type: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateSuccess = () => {
    setShowCreateForm(false);
    loadMentors();
  };

  const handleEditSuccess = () => {
    setEditingMentor(null);
    loadMentors();
  };

  const handleDeleteMentor = async (mentorId: string) => {
    if (!confirm('Are you sure you want to delete this mentor? This action cannot be undone.')) {
      return;
    }

    try {

      logClickedEvent('delete_mentor', 'mentor', 'delete_mentor'  );
      const response = await apiService.deleteMentor(mentorId);
      if (response.success || response.message) {
        showToast({
          message: 'Mentor deleted successfully',
          type: 'success'
        });
        loadMentors();
      } else {
        throw new Error(response.error || 'Failed to delete mentor');
      }
    } catch (error) {
      console.error('Error deleting mentor:', error);
      showToast({
        message: 'Failed to delete mentor',
        type: 'error'
      });
    }
  };

  const handleEditMentor = (mentor: Mentor | undefined | null) => {
    if (!mentor) return;
    // setSelectedMentor(mentor);
    setEditingMentor(mentor);
  };

  const handleSelectMentor = (mentor: Mentor | undefined | null) => {
    if (!mentor) return;
    setSelectedMentor(mentor);
  };

  if (showCreateForm) {
    return (
      <MentorForm
        mode="create"
        onSuccess={handleCreateSuccess}
        onCancel={() => setShowCreateForm(false)}
      />
    );
  }

  if (editingMentor) {
    return (
      <MentorForm
        mode="edit"
        mentor={editingMentor}
        onSuccess={handleEditSuccess}
        onCancel={() => setEditingMentor(null)}
      />
    );
  }

  return (
    <div className={styles.mentor}>
      <div className={styles.mentorHeader}>
        <h1 className={styles.title}>AI Mentors</h1>
        <ButtonPrimary
          onClick={() => setShowCreateForm(true)}
          className={styles.createButton}
        >
          + Create New Mentor
        </ButtonPrimary>
      </div>

      {isLoading ? (
        <div className={styles.loadingState}>
          <div className={styles.spinner}></div>
          <p>Loading mentors...</p>
        </div>
      ) : mentors?.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>🤖</div>
          <h3>No mentors yet</h3>
          <p>Create your first AI mentor to get personalized guidance and support</p>
          <ButtonPrimary
            onClick={() => setShowCreateForm(true)}
            className={styles.createFirstButton}
          >
            Create Your First Mentor
          </ButtonPrimary>
        </div>
      ) : (
        <div className={styles.mentorGrid}>
          {mentors?.map((mentor) => {
            return (
              <div className={styles.mentorCard} key={mentor.id}>
                <div className={styles.cardHeader}>
                  <h2 className={styles.cardTitle + "ellipsis no-wrap overflow-hidden"}>{mentor.name}</h2>
                  <div className={styles.cardActions}>
                    <button
                      onClick={() => { 
                        // Fix: ensure 'about' is undefined if null to match Mentor type
                        const safeMentor = { ...mentor, about: mentor.about ?? undefined, createdAt: mentor.createdAt?.toString() ?? undefined, updatedAt: mentor.updatedAt?.toString() ?? undefined, notes: mentor.notes ?? undefined, assistant_metadata: mentor.assistant_metadata ?? undefined, accountEvmAddress: mentor.accountEvmAddress ?? undefined, evmAddressAgent: mentor.evmAddressAgent ?? undefined };
                        handleEditMentor(safeMentor);
                      }}
                      className={styles.editButton}
                      title="Edit mentor"
                    >
                      ✏️
                    </button>

                    <button
                      onClick={() => { 
                        // Fix: ensure 'about' is undefined if null to match Mentor type
                        const safeMentor = { ...mentor, about: mentor.about ?? undefined, createdAt: mentor.createdAt?.toString() ?? undefined, updatedAt: mentor.updatedAt?.toString() ?? undefined, notes: mentor.notes ?? undefined, assistant_metadata: mentor.assistant_metadata ?? undefined, accountEvmAddress: mentor.accountEvmAddress ?? undefined, evmAddressAgent: mentor.evmAddressAgent ?? undefined };
                        handleSelectMentor(safeMentor);
                        logClickedEvent('select_mentor', 'mentor', 'select_mentor', 1   );  
                        showToast({
                          message: 'Mentor selected',
                          type: 'success'
                        });
                      }}
                      className={styles.editButton}
                      title="Select mentor"
                    >
                      <Checkbox 
                        checked={selectedMentor?.id === mentor.id}
                        onChange={() => {
                          handleSelectMentor(mentor);
                        }}
                      />
                    </button>

                    <button
                      onClick={() => {
                        // Fix: ensure 'about' is undefined if null to match Mentor type
                        const safeMentor = { ...mentor, about: mentor.about ?? undefined, createdAt: mentor.createdAt?.toString() ?? undefined, updatedAt: mentor.updatedAt?.toString() ?? undefined, notes: mentor.notes ?? undefined, assistant_metadata: mentor.assistant_metadata ?? undefined, accountEvmAddress: mentor.accountEvmAddress ?? undefined, evmAddressAgent: mentor.evmAddressAgent ?? undefined };
                        handleDeleteMentor(safeMentor.id!);
                      }}
                      className={styles.deleteButton}
                      title="Delete mentor"
                    >
                      🗑️
                    </button>
                  </div>
                </div>

                <p className={styles.cardRole}>{mentor.role}</p>

                {mentor.about && (
                  <p className={styles.cardDescription}>{mentor.about}</p>
                )}

                <div className={styles.knowledgeTags}>
                  {mentor.knowledges.slice(0, 3).map((knowledge, index) => (
                    <span key={index} className={styles.knowledgeTag}>
                      {knowledge}
                    </span>
                  ))}
                  {mentor.knowledges.length > 3 && (
                    <span className={styles.moreTag}>
                      +{mentor.knowledges.length - 3} more
                    </span>
                  )}
                </div>

                <div className={styles.cardFooter}>
                  <span className={styles.createdDate}>
                    Created {new Date(mentor.createdAt || '').toLocaleDateString()}
                  </span>
                  <div className={styles.statusIndicator}>
                    <span className={`${styles.statusDot} ${mentor.isActive ? styles.active : styles.inactive}`}></span>
                    {mentor.isActive ? 'Active' : 'Inactive'}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  );
} 