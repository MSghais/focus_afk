import { useEffect, useState } from 'react';
import { useApi } from '../../hooks/useApi';
import { useAuthStore } from '../../store/auth';
import { Icon } from '../small/icons';

interface Badge {
    id: string;
    type: string;
    name: string;
    description?: string;
    icon?: string;
    dateAwarded: string;
}

export default function Badges() {
    const apiService = useApi();
    const { userConnected } = useAuthStore();
    const [badges, setBadges] = useState<Badge[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

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

    // if (!userConnected?.id) return null;
    // if (loading) return <div>Loading badges...</div>;
    // if (error) return;


    console.log("badges", badges);
    return (
        <div className="w-full max-w-xl mx-auto p-4 shadow-md rounded-lg my-2">
            <h2 className="text-xl font-bold mb-4">Your Badges</h2>
            {error && <div className="text-red-500">{error}</div>}

            <div className='flex  rounded-lg'>
                <button 
                className='flex items-center gap-2'
                onClick={() => {
                    if (!userConnected?.id) return;
                    loadBadges();
                }}>Get Badges <Icon name='refresh' /></button>
            </div>

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