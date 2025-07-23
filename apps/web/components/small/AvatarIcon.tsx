import React from 'react';
import styles from './AvatarIcon.module.scss';

interface AvatarIconProps {
  avatar: string; // URL or emoji
  alt?: string;
}

const AvatarIcon: React.FC<AvatarIconProps> = ({ avatar, alt }) => (
  <div className={styles.avatarIcon}>
    {avatar.startsWith('http') ? (
      <img src={avatar} alt={alt || 'Avatar'} className={styles.avatarImg} />
    ) : (
      <span className={styles.avatarEmoji}>{avatar}</span>
    )}
  </div>
);

export default AvatarIcon; 