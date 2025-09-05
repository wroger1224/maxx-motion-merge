import { supabase } from '@/lib/supabase';

interface Activity {
    activity_minutes: number;
    activity_date: string;
    activity_type: string;
}

export interface Badge {
    id: string;
    name: string;
    icon: string;
    description: string;
    total: number;
    category: string;
    emoji: string;
    image_url: string;
    created_at: string;
}

export interface UserBadge {
    id: string;
    user_id: string;
    badge_id: string;
    progress: number;
    is_unlocked: boolean;
    unlocked_at: string | null;
    created_at: string;
    badge?: Badge;
}

export const fetchBadges = async (): Promise<Badge[]> => {
    const { data, error } = await supabase
        .from('badges')
        .select('*')
        .order('category', { ascending: true });

    if (error) {
        console.error('Error fetching badges:', error);
        return [];
    }

    return data || [];
};

export const fetchUserBadges = async (userId: string): Promise<UserBadge[]> => {
    const { data, error } = await supabase
        .from('user_badges')
        .select(`
      *,
      badge:badges(*)
    `)
        .eq('user_id', userId);

    if (error) {
        console.error('Error fetching user badges:', error);
        return [];
    }

    return data || [];
};

export const updateBadgeProgress = async (
    userId: string,
    badgeId: string,
    progress: number
): Promise<void> => {
    const { data: badge } = await supabase
        .from('badges')
        .select('total')
        .eq('id', badgeId)
        .single();

    if (!badge) return;

    const isUnlocked = progress >= badge.total;
    const unlockedAt = isUnlocked ? new Date().toISOString() : null;

    const { error } = await supabase
        .from('user_badges')
        .upsert({
            user_id: userId,
            badge_id: badgeId,
            progress,
            is_unlocked: isUnlocked,
            unlocked_at: unlockedAt
        }, {
            onConflict: 'user_id,badge_id'
        });

    if (error) {
        console.error('Error updating badge progress:', error);
    }
};

export const calculateBadgeProgress = async (userId: string): Promise<void> => {
    // Get all badges
    const badges = await fetchBadges();

    // Get user's activities
    const { data: activities } = await supabase
        .from('activities')
        .select('activity_minutes, activity_date, activity_type')
        .eq('user_id', userId);

    if (!activities) return;

    // Calculate progress for each badge type
    for (const badge of badges) {
        let progress = 0;

        switch (badge.category) {
            case 'Steps':
                const maxSteps = Math.max(...activities.map((a: Activity) => a.activity_minutes || 0), 0);
                progress = Math.min(badge.total, maxSteps);
                break;

            case 'Workouts':
                const workoutCount = activities.filter((a: Activity) => a.activity_type === 'workout').length;
                progress = Math.min(badge.total, workoutCount);
                break;

            case 'Activities':
                if (badge.name.includes('Runner')) {
                    const runningCount = activities.filter((a: Activity) => a.activity_type?.toLowerCase() === 'running').length;
                    progress = Math.min(badge.total, runningCount);
                } else if (badge.name.includes('Cyclist')) {
                    const cyclingCount = activities.filter((a: Activity) => a.activity_type?.toLowerCase() === 'cycling').length;
                    progress = Math.min(badge.total, cyclingCount);
                } else if (badge.name.includes('Yogi')) {
                    const yogaCount = activities.filter((a: Activity) => a.activity_type?.toLowerCase() === 'yoga').length;
                    progress = Math.min(badge.total, yogaCount);
                }
                break;

            case 'Time':
                if (badge.name.includes('Early Bird')) {
                    const earlyWorkouts = activities.filter((a: Activity) => {
                        const hour = new Date(a.activity_date).getHours();
                        return hour < 7;
                    }).length;
                    progress = Math.min(badge.total, earlyWorkouts);
                } else if (badge.name.includes('Weekend Warrior')) {
                    const weekendWorkouts = activities.filter((a: Activity) => {
                        const day = new Date(a.activity_date).getDay();
                        return day === 0 || day === 6;
                    }).length;
                    progress = Math.min(badge.total, weekendWorkouts);
                } else if (badge.name.includes('Night Owl')) {
                    const nightWorkouts = activities.filter((a: Activity) => {
                        const hour = new Date(a.activity_date).getHours();
                        return hour >= 22;
                    }).length;
                    progress = Math.min(badge.total, nightWorkouts);
                }
                break;
        }

        await updateBadgeProgress(userId, badge.id, progress);
    }
}; 