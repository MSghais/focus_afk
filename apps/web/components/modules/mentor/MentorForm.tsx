'use client';

import { useState, useEffect } from 'react';
import { useApi } from '../../../hooks/useApi';
import { useUIStore } from '../../../store/uiStore';
import { useAuthStore } from '../../../store/auth';
import { Mentor } from '../../../types';
import styles from '../../../styles/components/mentor.module.scss';
import { logClickedEvent } from '../../../lib/analytics'; 

interface MentorFormProps {
  mentor?: Mentor;
  onSuccess?: () => void;
  onCancel?: () => void;
  mode: 'create' | 'edit';
}

const KNOWLEDGE_OPTIONS = [
  'Productivity & Time Management',
  'Focus & Concentration',
  'Goal Setting & Planning',
  'Learning & Education',
  'Career Development',
  'Health & Wellness',
  'Mindfulness & Meditation',
  'Technology & Programming',
  'Business & Entrepreneurship',
  'Creative Arts & Design',
  'Fitness & Exercise',
  'Nutrition & Diet',
  'Personal Finance',
  'Relationships & Communication',
  'Stress Management',
  'Sleep & Recovery',
  'Motivation & Inspiration',
  'Problem Solving',
  'Leadership & Management',
  'Study Techniques'
];

const ROLE_OPTIONS = [
  'Personal Assistant',
  'Life Coach',
  'Career Mentor',
  'Fitness Trainer',
  'Study Buddy',
  'Productivity Expert',
  'Wellness Guide',
  'Learning Partner',
  'Motivation Coach',
  'Custom'
];

export default function MentorForm({ mentor, onSuccess, onCancel, mode }: MentorFormProps) {
  const { userConnected } = useAuthStore();
  const { showToast } = useUIStore();
  const apiService = useApi();
  
  const [formData, setFormData] = useState({
    name: '',
    role: 'Personal Assistant',
    knowledges: [] as string[],
    about: '',
    customRole: ''
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (mentor && mode === 'edit') {
      setFormData({
        name: mentor.name || '',
        role: mentor.role || 'Personal Assistant',
        knowledges: mentor.knowledges || [],
        about: mentor.about || '',
        customRole: ROLE_OPTIONS.includes(mentor.role) ? '' : mentor.role
      });
    }
  }, [mentor, mode]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (formData.knowledges.length === 0) {
      newErrors.knowledges = 'At least one knowledge area is required';
    }

    if (formData.role === 'Custom' && !formData.customRole.trim()) {
      newErrors.customRole = 'Custom role is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userConnected) {
      showToast({
        message: 'Please connect your wallet to create a mentor',
        type: 'error'
      });
      return;
    }

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const mentorData = {
        name: formData.name.trim(),
        role: formData.role === 'Custom' ? formData.customRole.trim() : formData.role,
        knowledges: formData.knowledges,
        about: formData.about.trim() || undefined
      };

      let response;
      if (mode === 'create') {
        logClickedEvent('create_mentor', 'mentor', 'create_mentor'  );
        response = await apiService.createMentor(mentorData);
      } else {
        logClickedEvent('update_mentor', 'mentor', 'update_mentor'  );
        response = await apiService.updateMentor(mentor!.id!, mentorData);
      }

      if (response.success || response.id) {
        showToast({
          message: `Mentor ${mode === 'create' ? 'created' : 'updated'} successfully!`,
          type: 'success'
        });
        onSuccess?.();
      } else {
        throw new Error(response.error || 'Failed to save mentor');
      }
    } catch (error) {
      console.error('Error saving mentor:', error);
      showToast({
        message: `Failed to ${mode} mentor: ${error instanceof Error ? error.message : 'Unknown error'}`,
        type: 'error'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKnowledgeToggle = (knowledge: string) => {
    setFormData(prev => ({
      ...prev,
      knowledges: prev.knowledges.includes(knowledge)
        ? prev.knowledges.filter(k => k !== knowledge)
        : [...prev.knowledges, knowledge]
    }));
  };

  const handleRoleChange = (role: string) => {
    setFormData(prev => ({
      ...prev,
      role,
      customRole: role === 'Custom' ? prev.customRole : ''
    }));
  };

  return (
    <div className={styles.mentorForm}>
      <div className={styles.formHeader}>
        <h2 className={styles.formTitle}>
          {mode === 'create' ? 'Create New Mentor' : 'Edit Mentor'}
        </h2>
        <p className={styles.formSubtitle}>
          {mode === 'create' 
            ? 'Design your personalized AI companion to help you achieve your goals'
            : 'Update your mentor\'s profile and expertise'
          }
        </p>
      </div>

      <form onSubmit={handleSubmit} className={styles.form}>
        {/* Name Field */}
        <div className={styles.formGroup}>
          <label htmlFor="name" className={styles.label}>
            Mentor Name *
          </label>
          <input
            id="name"
            type="text"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            className={`${styles.input} ${errors.name ? styles.inputError : ''}`}
            placeholder="e.g., Alex, Coach Sarah, Focus Buddy"
          />
          {errors.name && <span className={styles.errorText}>{errors.name}</span>}
        </div>

        {/* Role Field */}
        <div className={styles.formGroup}>
          <label htmlFor="role" className={styles.label}>
            Role *
          </label>
          <select
            id="role"
            value={formData.role}
            onChange={(e) => handleRoleChange(e.target.value)}
            className={styles.select}
          >
            {ROLE_OPTIONS.map(role => (
              <option key={role} value={role}>{role}</option>
            ))}
          </select>
          
          {formData.role === 'Custom' && (
            <input
              type="text"
              value={formData.customRole}
              onChange={(e) => setFormData(prev => ({ ...prev, customRole: e.target.value }))}
              className={`${styles.input} ${styles.customInput} ${errors.customRole ? styles.inputError : ''}`}
              placeholder="Enter custom role..."
            />
          )}
          {errors.customRole && <span className={styles.errorText}>{errors.customRole}</span>}
        </div>

        {/* Knowledge Areas */}
        <div className={styles.formGroup}>
          <label className={styles.label}>
            Areas of Expertise * (Select at least one)
          </label>
          <div className={styles.knowledgeGrid}>
            {KNOWLEDGE_OPTIONS.map(knowledge => (
              <label key={knowledge} className={styles.knowledgeItem}>
                <input
                  type="checkbox"
                  checked={formData.knowledges.includes(knowledge)}
                  onChange={() => handleKnowledgeToggle(knowledge)}
                  className={styles.checkbox}
                />
                <span className={styles.knowledgeText}>{knowledge}</span>
              </label>
            ))}
          </div>
          {errors.knowledges && <span className={styles.errorText}>{errors.knowledges}</span>}
        </div>

        {/* About Field */}
        <div className={styles.formGroup}>
          <label htmlFor="about" className={styles.label}>
            About Your Mentor
          </label>
          <textarea
            id="about"
            value={formData.about}
            onChange={(e) => setFormData(prev => ({ ...prev, about: e.target.value }))}
            className={styles.textarea}
            placeholder="Describe your mentor's personality, approach, or any specific instructions..."
            rows={4}
          />
        </div>

        {/* Form Actions */}
        <div className={styles.formActions}>
          <button
            type="button"
            onClick={onCancel}
            className={styles.cancelButton}
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className={styles.submitButton}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <span className={styles.spinner}></span>
                {mode === 'create' ? 'Creating...' : 'Updating...'}
              </>
            ) : (
              mode === 'create' ? 'Create Mentor' : 'Update Mentor'
            )}
          </button>
        </div>
      </form>
    </div>
  );
} 