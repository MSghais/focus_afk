import styles from '../../../styles/components/dashboard.module.scss';

export default function Dashboard() {
  return (
    <div className={styles.dashboardContainer}>
      <div className={styles.dashboardHeader}>FOCUSFI</div>
      <div style={{ color: 'var(--foreground)', fontWeight: 500, textAlign: 'center', marginBottom: '2rem' }}>
        Bet. Focus. Prove. Earn.
      </div>

      <div className={styles.dashboardContent} style={{ marginBottom: '2rem' }}>
        <div style={{ border: '1px solid var(--border)', borderRadius: 14, padding: '1.2rem', marginBottom: '1.5rem', color: 'var(--foreground)' }}>
          <div style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: 8 }}>Set a Goal & Stake</div>
          <div style={{ fontSize: '1.1rem', marginBottom: 8 }}>Complete 20 Pomodoros<br />in a week</div>
          <div style={{ color: 'var(--feed-text, var(--foreground))', fontWeight: 500, fontSize: '1rem' }}>
            Tokens <span style={{ fontSize: '1.2rem' }}>🪙</span> 20
          </div>
        </div>

        <div style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: 12 }}>AI-Verified Proof of Focus</div>
        <div style={{ display: 'flex', gap: 16, width: '100%', justifyContent: 'center', marginBottom: 16 }}>
          <div style={{ flex: 1, border: '1px solid var(--border)', borderRadius: 14, padding: '1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'rgba(255,255,255,0.01)' }}>
            <div style={{ position: 'relative', width: 64, height: 64, marginBottom: 8 }}>
              <svg width="64" height="64">
                <circle cx="32" cy="32" r="28" stroke="#333" strokeWidth="6" fill="none" />
                <circle cx="32" cy="32" r="28" stroke="var(--brand-accent)" strokeWidth="6" fill="none" strokeDasharray="176" strokeDashoffset="44" strokeLinecap="round" />
              </svg>
              <div style={{ position: 'absolute', top: 0, left: 0, width: 64, height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '1.1rem', color: 'var(--foreground)' }}>05:12</div>
            </div>
            <div style={{ fontWeight: 600, fontSize: '1rem', marginBottom: 4 }}>Focus Session</div>
            <div style={{ color: 'var(--brand-primary)', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ fontSize: '1.1rem' }}>✔️</span> Proof submitted
            </div>
          </div>
          <div style={{ flex: 1, border: '1px solid var(--border)', borderRadius: 14, padding: '1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'rgba(255,255,255,0.01)' }}>
            <div style={{ fontSize: '2.2rem', marginBottom: 4 }}>🐉</div>
            <div style={{ fontWeight: 600, fontSize: '1rem', marginBottom: 4 }}>Draggis</div>
            <div style={{ color: 'var(--feed-text, var(--foreground))', fontSize: '0.95rem' }}>45-day streak</div>
          </div>
        </div>
      </div>

      <div className={styles.dashboardContent}>
        <div style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: 12 }}>Social & Viral Mechanics</div>
        <div style={{ border: '1px solid var(--border)', borderRadius: 14, padding: '1.2rem', display: 'flex', alignItems: 'center', gap: 12, color: 'var(--foreground)', background: 'rgba(255,255,255,0.01)' }}>
          <span style={{ fontSize: '1.5rem' }}>👥</span>
          <span style={{ fontWeight: 600, fontSize: '1.1rem' }}>Join Guild</span>
        </div>
      </div>
    </div>
  );
}