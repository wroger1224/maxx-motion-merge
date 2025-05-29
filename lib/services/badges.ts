import { supabase } from './supabase';

export interface Badge {
    id: string;
    name: string;
    icon: string;
    icon_type: 'fontawesome' | 'material' | 'ionicon' | 'emoji' | 'svg';
    description: string;
    total: number;
    category: string;
    emoji?: string;
    image_url?: string;
}

export interface UserBadge {
    id: string;
    user_id: string;
    badge_id: string;
    progress: number;
    is_unlocked: boolean;
    unlocked_at?: string;
    badge?: Badge;
}

export async function getBadges(): Promise<Badge[]> {
    const { data, error } = await supabase
        .from('badges')
        .select('*')
        .order('category', { ascending: true });

    if (error) {
        console.error('Error fetching badges:', error);
        throw error;
    }

    return data || [];
}

export async function getUserBadges(userId: string): Promise<UserBadge[]> {
    const { data, error } = await supabase
        .from('user_badges')
        .select(`
      *,
      badge:badges(*)
    `)
        .eq('user_id', userId);

    if (error) {
        console.error('Error fetching user badges:', error);
        throw error;
    }

    return data || [];
}

export async function updateBadgeProgress(
    userId: string,
    badgeId: string,
    progress: number
): Promise<void> {
    const { data: existingBadge, error: fetchError } = await supabase
        .from('user_badges')
        .select('*')
        .eq('user_id', userId)
        .eq('badge_id', badgeId)
        .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('Error fetching badge progress:', fetchError);
        throw fetchError;
    }

    const { data: badge, error: badgeError } = await supabase
        .from('badges')
        .select('total')
        .eq('id', badgeId)
        .single();

    if (badgeError) {
        console.error('Error fetching badge:', badgeError);
        throw badgeError;
    }

    const isUnlocked = progress >= badge.total;
    const unlockedAt = isUnlocked && !existingBadge?.is_unlocked ? new Date().toISOString() : existingBadge?.unlocked_at;

    if (existingBadge) {
        const { error: updateError } = await supabase
            .from('user_badges')
            .update({
                progress,
                is_unlocked,
                unlocked_at: unlockedAt,
                updated_at: new Date().toISOString()
            })
            .eq('id', existingBadge.id);

        if (updateError) {
            console.error('Error updating badge progress:', updateError);
            throw updateError;
        }
    } else {
        const { error: insertError } = await supabase
            .from('user_badges')
            .insert({
                user_id: userId,
                badge_id: badgeId,
                progress,
                is_unlocked,
                unlocked_at: unlockedAt
            });

        if (insertError) {
            console.error('Error inserting badge progress:', insertError);
            throw insertError;
        }
    }
}

export async function calculateBadgeProgress(
    userId: string,
    eventId: string
): Promise<void> {
    // Fetch user's activities for the event
    const { data: activities, error: activitiesError } = await supabase
        .from('activities')
        .select('activity_minutes, activity_date, activity_type')
        .eq('event_id', eventId)
        .eq('user_id', userId);

    if (activitiesError) {
        console.error('Error fetching activities:', activitiesError);
        throw activitiesError;
    }

    // Fetch all badges
    const badges = await getBadges();

    // Calculate progress for each badge
    for (const badge of badges) {
        let progress = 0;

        switch (badge.category) {
            case 'Steps':
                const maxSteps = Math.max(...activities.map(a => a.activity_minutes || 0), 0);
                progress = Math.min(badge.total, maxSteps);
                break;

            case 'Workouts':
                const workoutCount = activities.filter(a => a.activity_type === 'workout').length;
                progress = Math.min(badge.total, workoutCount);
                break;

            case 'Activities':
                const activityCount = activities.filter(a =>
                    a.activity_type?.toLowerCase() === badge.name.toLowerCase().split("'")[0]
                ).length;
                progress = Math.min(badge.total, activityCount);
                break;

            case 'Time':
                if (badge.name === 'Early Bird') {
                    const earlyWorkouts = activities.filter(a => {
                        const hour = new Date(a.activity_date).getHours();
                        return hour < 7;
                    }).length;
                    progress = Math.min(badge.total, earlyWorkouts);
                } else if (badge.name === 'Weekend Warrior') {
                    const weekendWorkouts = activities.filter(a => {
                        const day = new Date(a.activity_date).getDay();
                        return day === 0 || day === 6;
                    }).length;
                    progress = Math.min(badge.total, weekendWorkouts);
                } else if (badge.name === 'Night Owl') {
                    const nightWorkouts = activities.filter(a => {
                        const hour = new Date(a.activity_date).getHours();
                        return hour >= 22;
                    }).length;
                    progress = Math.min(badge.total, nightWorkouts);
                }
                break;
        }

        await updateBadgeProgress(userId, badge.id, progress);
    }
} 