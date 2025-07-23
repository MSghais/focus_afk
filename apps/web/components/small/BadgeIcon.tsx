import React from 'react';
import styles from './BadgeIcon.module.scss';

interface BadgeIconProps {
  icon: string; // URL or emoji
  label?: string;
}

const BadgeIcon: React.FC<BadgeIconProps> = ({ icon, label }) => (
  <div className={styles.badgeIcon} title={label}>
    <span className={styles.icon}>{icon}</span>
  </div>
);

export default BadgeIcon; 