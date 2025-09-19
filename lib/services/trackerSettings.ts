import { supabase } from '../supabase';
import TrackerService from './tracker';

export interface TrackerSettings {
    id?: string;
    user_id: string;
    connected_tracker?: string;
    last_sync_date?: string;
    auto_sync_enabled: boolean;
    sync_frequency: 'daily' | 'weekly' | 'manual';
    created_at?: string;
    updated_at?: string;
}

export interface SyncResult {
    success: boolean;
    activitiesSynced: number;
    error?: string;
    syncDate: string;
}

export class TrackerSettingsService {
    /**
     * Get tracker settings for a user
     */
    async getTrackerSettings(userId: string): Promise<TrackerSettings | null> {
        try {
            const { data, error } = await supabase
                .from('user_tracker_settings')
                .select('*')
                .eq('user_id', userId)
                .single();

            if (error) {
                if (error.code === 'PGRST116') {
                    // No settings found, return default
                    return {
                        user_id: userId,
                        auto_sync_enabled: true,
                        sync_frequency: 'daily'
                    };
                }
                if (error.code === 'PGRST205') {
                    // Table doesn't exist yet, return default
                    console.warn('Tracker settings table not found, using defaults');
                    return {
                        user_id: userId,
                        auto_sync_enabled: true,
                        sync_frequency: 'daily'
                    };
                }
                console.error('Error fetching tracker settings:', error);
                return null;
            }

            return data as TrackerSettings;
        } catch (error) {
            console.error('Unexpected error fetching tracker settings:', error);
            return null;
        }
    }

    /**
     * Create or update tracker settings
     */
    async upsertTrackerSettings(settings: Partial<TrackerSettings>): Promise<boolean> {
        try {
            const { error } = await supabase
                .from('user_tracker_settings')
                .upsert(settings, {
                    onConflict: 'user_id'
                });

            if (error) {
                console.error('Error upserting tracker settings:', error);
                return false;
            }

            return true;
        } catch (error) {
            console.error('Unexpected error upserting tracker settings:', error);
            return false;
        }
    }

    /**
     * Connect a tracker and save settings
     */
    async connectTracker(userId: string, trackerId: string): Promise<boolean> {
        try {
            const success = await this.upsertTrackerSettings({
                user_id: userId,
                connected_tracker: trackerId,
                auto_sync_enabled: true,
                sync_frequency: 'daily'
            });

            return success;
        } catch (error) {
            console.error('Error connecting tracker:', error);
            return false;
        }
    }

    /**
     * Disconnect tracker
     */
    async disconnectTracker(userId: string): Promise<boolean> {
        try {
            const success = await this.upsertTrackerSettings({
                user_id: userId,
                connected_tracker: null,
                auto_sync_enabled: false
            });

            return success;
        } catch (error) {
            console.error('Error disconnecting tracker:', error);
            return false;
        }
    }

    /**
     * Sync activities from connected tracker
     */
    async syncActivities(userId: string, eventId: string): Promise<SyncResult> {
        try {
            // Get user's tracker settings
            const settings = await this.getTrackerSettings(userId);

            if (!settings?.connected_tracker) {
                return {
                    success: false,
                    activitiesSynced: 0,
                    error: 'No tracker connected',
                    syncDate: new Date().toISOString()
                };
            }

            // Create tracker service instance
            let tracker;
            try {
                console.log('Creating TrackerService instance...');
                tracker = new TrackerService();
                console.log('TrackerService created successfully');
            } catch (error) {
                console.error('Error creating TrackerService:', error);
                console.error('Error details:', {
                    message: error instanceof Error ? error.message : 'Unknown error',
                    stack: error instanceof Error ? error.stack : undefined
                });
                return {
                    success: false,
                    activitiesSynced: 0,
                    error: 'Failed to initialize tracker service',
                    syncDate: new Date().toISOString()
                };
            }

            // Check if tracker is available
            if (!tracker.isAvailable()) {
                return {
                    success: false,
                    activitiesSynced: 0,
                    error: 'Tracker not available on this device',
                    syncDate: new Date().toISOString()
                };
            }

            // Connect to tracker
            try {
                console.log('Connecting to tracker:', settings.connected_tracker);
                await tracker.connectTracker(settings.connected_tracker);
                console.log('Tracker connected successfully');
            } catch (error) {
                console.error('Error connecting to tracker:', error);
                return {
                    success: false,
                    activitiesSynced: 0,
                    error: 'Failed to connect to tracker',
                    syncDate: new Date().toISOString()
                };
            }

            // Request permissions
            let hasPermissions;
            try {
                console.log('Requesting permissions...');
                hasPermissions = await tracker.requestPermissions();
                console.log('Permissions result:', hasPermissions);
            } catch (error) {
                console.error('Error requesting permissions:', error);
                return {
                    success: false,
                    activitiesSynced: 0,
                    error: 'Failed to request tracker permissions',
                    syncDate: new Date().toISOString()
                };
            }
            if (!hasPermissions) {
                return {
                    success: false,
                    activitiesSynced: 0,
                    error: 'Tracker permissions not granted',
                    syncDate: new Date().toISOString()
                };
            }

            // Calculate date range (last 7 days)
            const endDate = new Date();
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - 7);

            // Fetch activity data
            const activities = await tracker.fetchActivityData(startDate, endDate);

            if (activities.length === 0) {
                // Update last sync date even if no activities
                await this.updateLastSyncDate(userId);
                return {
                    success: true,
                    activitiesSynced: 0,
                    syncDate: new Date().toISOString()
                };
            }

            // Sync to Supabase
            await tracker.syncToSupabase(activities, userId, eventId);

            // Update last sync date
            await this.updateLastSyncDate(userId);

            return {
                success: true,
                activitiesSynced: activities.length,
                syncDate: new Date().toISOString()
            };

        } catch (error) {
            console.error('Error syncing activities:', error);
            return {
                success: false,
                activitiesSynced: 0,
                error: error instanceof Error ? error.message : 'Unknown error',
                syncDate: new Date().toISOString()
            };
        }
    }

    /**
     * Update last sync date
     */
    private async updateLastSyncDate(userId: string): Promise<boolean> {
        try {
            const success = await this.upsertTrackerSettings({
                user_id: userId,
                last_sync_date: new Date().toISOString()
            });

            return success;
        } catch (error) {
            console.error('Error updating last sync date:', error);
            return false;
        }
    }

    /**
     * Check if auto-sync should run based on frequency
     */
    shouldAutoSync(settings: TrackerSettings): boolean {
        if (!settings.auto_sync_enabled || !settings.connected_tracker) {
            return false;
        }

        if (settings.sync_frequency === 'manual') {
            return false;
        }

        if (!settings.last_sync_date) {
            return true; // Never synced before
        }

        const lastSync = new Date(settings.last_sync_date);
        const now = new Date();
        const hoursSinceLastSync = (now.getTime() - lastSync.getTime()) / (1000 * 60 * 60);

        switch (settings.sync_frequency) {
            case 'daily':
                return hoursSinceLastSync >= 24;
            case 'weekly':
                return hoursSinceLastSync >= 168; // 7 days
            default:
                return false;
        }
    }

    /**
     * Get sync status message
     */
    getSyncStatusMessage(settings: TrackerSettings): string {
        if (!settings.connected_tracker) {
            return 'No tracker connected';
        }

        if (!settings.last_sync_date) {
            return 'Never synced';
        }

        const lastSync = new Date(settings.last_sync_date);
        const now = new Date();
        const hoursSinceLastSync = (now.getTime() - lastSync.getTime()) / (1000 * 60 * 60);

        if (hoursSinceLastSync < 1) {
            return 'Synced just now';
        } else if (hoursSinceLastSync < 24) {
            return `Synced ${Math.floor(hoursSinceLastSync)} hours ago`;
        } else {
            const daysSinceLastSync = Math.floor(hoursSinceLastSync / 24);
            return `Synced ${daysSinceLastSync} day${daysSinceLastSync > 1 ? 's' : ''} ago`;
        }
    }
}