import { useEffect, useState } from 'react';
import { useApi } from '../../hooks/useApi';
import { useAuthStore } from '../../store/auth';
import { Icon } from '../small/icons';
import { useFocusAFKStore } from '../../store/store';
import { useUIStore } from '../../store/uiStore';

interface Badge {
    id: string;
    type: string;
    name: string;
    description?: string;
    icon?: string;
    dateAwarded: string;
}

interface IBadgesProps {
    isEnabledRefreshButton?: boolean;
    isDailyBadgeEnabled?: boolean;
}
export default function Badges({ isEnabledRefreshButton = true, isDailyBadgeEnabled }: IBadgesProps) {
    const apiService = useApi();
    const { userConnected } = useAuthStore();
    const [badges, setBadges] = useState<Badge[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { showToast } = useUIStore();
    const {
        tasks,
        goals,
        timerSessions,
        settings,
        getTaskStats,
        getFocusStats,
        getBreakStats,
        setCurrentModule
    } = useFocusAFKStore();
    const loadBadges = async () => {
        console.log("userConnected", userConnected);

        try {
            if (!userConnected?.id) return;
            console.log("loadBadges", userConnected.id);
            const res = await apiService.getBadges(userConnected.id)
            console.log("res", res);
            if (
                res.success &&
                Array.isArray((res as any).badges)
            ) {
                setBadges((res as any).badges);
            } else {
                setBadges([]);
                setError('Failed to load badges');
            }
            setLoading(false);
        } catch (error) {
            setError('Failed to load badges');
            showToast({ message: 'Failed to load badges', type: 'error' });
            setLoading(false);
        }
        finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        setLoading(true);
        loadBadges();
    }, [userConnected?.id]);

    const [focusStats, setFocusStats] = useState({
        totalSessions: 0,
        totalMinutes: 0,
        averageSessionLength: 0,
        sessionsByDay: [] as { date: string; sessions: number; minutes: number }[]
    });

    useEffect(() => {
        const loadStats = async () => {
            const [taskStatsData, focusStatsData, breakStatsData] = await Promise.all([
                getTaskStats(),
                getFocusStats(7),
                getBreakStats(7)
            ]);
            // setTaskStats(taskStatsData);
            setFocusStats(focusStatsData);
            // setBreakStats(breakStatsData);
        };

        loadStats();
    }, [tasks, goals, timerSessions, getTaskStats, getFocusStats]);

    // if (!userConnected?.id) return null;
    // if (loading) return <div>Loading badges...</div>;
    // if (error) return;

    const calculateStreak = (sessionsByDay: { date: string; sessions: number; minutes: number }[]) => {
        if (!sessionsByDay || sessionsByDay.length === 0) return 0;
        // Sort by date descending
        const sorted = [...sessionsByDay].sort((a, b) => b.date.localeCompare(a.date));
        let streak = 0;
        let current = new Date();
        for (let i = 0; i < sorted.length; i++) {
            const day = new Date(sorted[i]?.date || new Date().toISOString());
            // If first day, check if today or yesterday
            if (i === 0) {
                const diff = Math.floor((current.getTime() - day.getTime()) / (1000 * 60 * 60 * 24));
                if (diff > 1) break; // streak broken
                streak++;
                current = day;
            } else {
                // Check if previous day
                const diff = Math.floor((current.getTime() - day.getTime()) / (1000 * 60 * 60 * 24));
                if (diff !== 1) break;
                streak++;
                current = day;
            }
        }
        return streak;
    };

    const streak = calculateStreak(focusStats.sessionsByDay || []);
    console.log("badges", badges);
    return (
        <div className="w-full  mx-auto p-4 shadow-md rounded-lg my-2">
            <h2 className="text-xl font-bold mb-4">Your Badges</h2>
            {error && <div className="text-red-500">{error}</div>}

            {isEnabledRefreshButton && <div className='flex  rounded-lg py-4'>
                <button
                    className='flex items-center gap-2'
                    onClick={() => {
                        if (!userConnected?.id) return;
                        loadBadges();
                    }}> <Icon name='refresh' /></button>

            </div>}

            {isDailyBadgeEnabled && (
                <div style={{ flex: 1, border: '1px solid var(--border)', borderRadius: 14, padding: '1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'rgba(255,255,255,0.01)' }}>
                    <div style={{ fontSize: '2.2rem', marginBottom: 4 }}>🔥</div>
                    <div style={{ fontWeight: 600, fontSize: '1rem', marginBottom: 4 }}>Daily Streak</div>
                    <div style={{ color: 'var(--feed-text, var(--foreground))', fontSize: '0.95rem', fontWeight: 700 }}>
                        {streak > 0 ? `${streak}-day streak` : 'No streak yet'}
                    </div>
                </div>
            )}
            {badges.length === 0 ? (
                <div className="text-gray-500">No badges yet. Start focusing to earn some!</div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {badges.map((badge) => (
                        <div key={badge.id} className="flex flex-col items-center border rounded-lg p-3 bg-white/10 shadow">
                            <div className="text-3xl mb-2">{badge.icon || '🏅'}</div>
                            <div className="font-semibold text-base mb-1">{badge.name}</div>
                            <div className="text-xs text-gray-500 mb-1">{badge.description}</div>
                            <div className="text-xs text-gray-400">{new Date(badge.dateAwarded).toLocaleDateString()}</div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
} 