import { Platform } from 'react-native';
import * as Device from 'expo-device';
import { supabase } from '../supabase';
import { healthService } from '../healthService';

// Import Health Connect for Android if available
let HealthConnect: any;
if (Platform.OS === 'android') {
  try {
    HealthConnect = require('react-native-health-connect');
  } catch (e) {
    console.log('Health Connect not available:', e);
  }
}

// Types
export interface ActivityData {
  activity_type: string;
  activity_type_linked: string;
  activity_minutes: number;
  activity_date: string;
  activity_source: string;
  external_activity_id?: string;
  calories?: number;
  distance?: number;
  steps?: number;
}

interface PlatformInfo {
  platform: 'ios' | 'android' | 'web' | 'windows' | 'macos';
  isSimulator: boolean;
  deviceType: Device.DeviceType | null;
  osVersion: string | null;
}

// Activity type mappings from health apps to your database
const ACTIVITY_TYPE_MAPPING: Record<string, { name: string; id: string }> = {
  // Common activities
  'Running': { name: 'Running', id: 'running' },
  'Walking': { name: 'Walking', id: 'walking' },
  'Cycling': { name: 'Cycling', id: 'cycling' },
  'Biking': { name: 'Cycling', id: 'cycling' },
  'Swimming': { name: 'Swimming', id: 'swimming' },
  'Swimming (Pool)': { name: 'Swimming', id: 'swimming' },
  'Swimming (Open Water)': { name: 'Swimming', id: 'swimming' },
  'Yoga': { name: 'Yoga', id: 'yoga' },
  'Strength': { name: 'Strength Training', id: 'strength' },
  'Strength Training': { name: 'Strength Training', id: 'strength' },
  'Weight Training': { name: 'Strength Training', id: 'strength' },
  'CrossTraining': { name: 'Cross Training', id: 'cross_training' },
  'Dance': { name: 'Dance', id: 'dance' },
  'Dancing': { name: 'Dance', id: 'dance' },
  'Elliptical': { name: 'Elliptical', id: 'elliptical' },
  'Rowing': { name: 'Rowing', id: 'rowing' },
  'Rowing Machine': { name: 'Rowing', id: 'rowing' },
  'StairClimbing': { name: 'Stair Climbing', id: 'stair_climbing' },
  'Stair Climbing': { name: 'Stair Climbing', id: 'stair_climbing' },
  'Stair Climbing Machine': { name: 'Stair Climbing', id: 'stair_climbing' },
  'Hiking': { name: 'Hiking', id: 'hiking' },
  'Pilates': { name: 'Pilates', id: 'pilates' },
  'Boxing': { name: 'Boxing', id: 'boxing' },
  'Tennis': { name: 'Tennis', id: 'tennis' },
  'Basketball': { name: 'Basketball', id: 'basketball' },
  'Soccer': { name: 'Soccer', id: 'soccer' },
  'Volleyball': { name: 'Volleyball', id: 'volleyball' },
  'Default': { name: 'Other Activity', id: 'other' },
  'Other': { name: 'Other Activity', id: 'other' },
  'Other Activity': { name: 'Other Activity', id: 'other' }
};

class TrackerService {
  private platformInfo: PlatformInfo;
  private isInitialized: boolean = false;

  constructor() {
    this.platformInfo = this.getPlatformInfo();
  }

  private getPlatformInfo(): PlatformInfo {
    return {
      platform: Platform.OS,
      isSimulator: !Device.isDevice,
      deviceType: Device.deviceType,
      osVersion: Device.osVersion
    };
  }

  // Initialize the health tracking system
  async initialize(): Promise<void> {
    console.log('Initializing TrackerService...', this.platformInfo);
    
    try {
      const initialized = await healthService.initialize();
      this.isInitialized = initialized;
      
      if (initialized) {
        console.log('Health service initialized successfully');
      } else {
        console.log('Health service initialization failed or not available');
      }
    } catch (error) {
      console.error('Error initializing health service:', error);
      this.isInitialized = false;
      throw error;
    }
  }

  // Check if health tracking is available on current platform/device
  isAvailable(): boolean {
    return healthService.isAvailable;
  }

  // Request necessary permissions from user
  async requestPermissions(): Promise<boolean> {
    if (!this.isAvailable()) {
      console.log('Health tracking not available on this platform/device');
      return false;
    }

    try {
      const hasPermissions = await healthService.requestPermissions();
      return hasPermissions;
    } catch (error) {
      console.error('Failed to request permissions:', error);
      return false;
    }
  }

  // Fetch activity data from health tracker
  async fetchActivityData(startDate: Date, endDate: Date): Promise<ActivityData[]> {
    if (!this.isAvailable() || !this.isInitialized) {
      console.log('Cannot fetch data - tracker not available or not initialized');
      return [];
    }

    const activities: ActivityData[] = [];

    try {
      // Fetch workouts from health service
      const workouts = await healthService.getWorkouts(startDate, endDate);
      
      if (workouts && workouts.length > 0) {
        // Convert workout data to ActivityData format
        const workoutActivities = workouts.map(workout => {
          const activityMapping = ACTIVITY_TYPE_MAPPING[workout.type] || 
                                ACTIVITY_TYPE_MAPPING['Default'];
          
          // Generate a unique ID for this workout
          const externalId = `workout_${workout.startDate.getTime()}_${workout.type}_${workout.duration}`;
          
          return {
            activity_type: activityMapping.name,
            activity_type_linked: activityMapping.id,
            activity_minutes: workout.duration,
            activity_date: workout.startDate.toISOString().split('T')[0],
            activity_source: this.platformInfo.platform === 'ios' ? 'apple_health' : 'google_fit',
            external_activity_id: externalId,
            calories: workout.calories,
            distance: workout.distance
          };
        });
        
        activities.push(...workoutActivities);
      }

      // If no workouts found, try to create an activity from step data
      if (activities.length === 0) {
        const steps = await healthService.getStepCount(startDate, endDate);
        
        if (steps && steps > 1000) { // Only log if more than 1000 steps
          // Estimate walking time based on steps (100 steps per minute average)
          const estimatedMinutes = Math.round(steps / 100);
          const dateStr = startDate.toISOString().split('T')[0];
          const externalId = `steps_${dateStr}_${steps}`;
          
          activities.push({
            activity_type: 'Walking',
            activity_type_linked: 'walking',
            activity_minutes: estimatedMinutes,
            activity_date: dateStr,
            activity_source: this.platformInfo.platform === 'ios' ? 'apple_health' : 'google_fit',
            external_activity_id: externalId,
            steps: steps
          });
        }
      }

      console.log(`Fetched ${activities.length} activities from ${this.platformInfo.platform === 'ios' ? 'HealthKit' : 'Health Connect'}`);
      return activities;
    } catch (error) {
      console.error('Error fetching activity data:', error);
      return [];
    }
  }


  // Sync fetched data to Supabase
  async syncToSupabase(activities: ActivityData[], userId: string, eventId: string): Promise<void> {
    if (activities.length === 0) {
      console.log('No activities to sync');
      return;
    }

    try {
      // First, fetch activity types from database to get correct IDs
      const { data: activityTypes, error: typesError } = await supabase
        .from('activity_types')
        .select('id, type_name');

      if (typesError) {
        throw typesError;
      }

      // Create a mapping of activity names to database IDs
      const typeMapping: Record<string, string> = {};
      activityTypes?.forEach(type => {
        typeMapping[type.type_name.toLowerCase()] = type.id;
      });

      // Fetch existing activities for this user and event to check for duplicates
      const { data: existingActivities, error: fetchError } = await supabase
        .from('activities')
        .select('activity_date, activity_type, activity_source, external_activity_id')
        .eq('user_id', userId)
        .eq('event_id', eventId)
        .in('activity_source', ['apple_health', 'google_fit']);

      if (fetchError) {
        throw fetchError;
      }

      // Create two sets for duplicate checking:
      // 1. Check by unique constraint (user_id, event_id, date, type, source)
      // 2. Check by external_activity_id
      const existingActivityKeys = new Set(
        existingActivities?.map(a => 
          `${a.activity_date}_${a.activity_type}_${a.activity_source}`
        ) || []
      );
      
      const existingExternalIds = new Set(
        existingActivities?.filter(a => a.external_activity_id)
          .map(a => a.external_activity_id) || []
      );

      // Filter out activities that already exist and prepare new ones for insertion
      const newActivities = [];
      let skippedCount = 0;

      for (const activity of activities) {
        // Check both constraints to avoid duplicates
        const activityKey = `${activity.activity_date}_${activity.activity_type}_${activity.activity_source}`;
        const hasExternalId = activity.external_activity_id && existingExternalIds.has(activity.external_activity_id);
        
        if (existingActivityKeys.has(activityKey) || hasExternalId) {
          skippedCount++;
          console.log(`Skipping duplicate activity: ${activity.activity_type} on ${activity.activity_date}`);
          continue;
        }

        // Find the correct activity type ID
        const activityTypeId = typeMapping[activity.activity_type.toLowerCase()] || 
                              typeMapping['other'] || 
                              activityTypes?.[0]?.id; // Fallback to first type

        newActivities.push({
          user_id: userId,
          event_id: eventId,
          activity_type: activity.activity_type,
          activity_type_linked: activityTypeId,
          activity_minutes: activity.activity_minutes,
          activity_date: activity.activity_date,
          activity_source: activity.activity_source === 'google_fit' ? 'google_fit' : activity.activity_source,
          external_activity_id: activity.external_activity_id || null
        });
      }

      // Only insert new activities
      if (newActivities.length > 0) {
        const { error } = await supabase
          .from('activities')
          .insert(newActivities);

        if (error) {
          throw error;
        }

        console.log(`Successfully synced ${newActivities.length} new activities to Supabase (${skippedCount} duplicates skipped)`);
      } else {
        console.log(`No new activities to sync (${skippedCount} duplicates skipped)`);
      }
    } catch (error) {
      console.error('Error syncing to Supabase:', error);
      throw error;
    }
  }

  // Connect to specific tracker
  async connectTracker(trackerId: string): Promise<void> {
    console.log(`Attempting to connect to tracker: ${trackerId}`);
    
    switch (trackerId) {
      case 'apple':
        if (this.platformInfo.platform === 'ios' && !this.platformInfo.isSimulator) {
          await this.initialize();
        } else {
          console.log('Apple Health not available on this platform/device');
          throw new Error('Apple Health is only available on iOS devices');
        }
        break;
      
      case 'google':
        if (this.platformInfo.platform === 'android') {
          await this.initialize();
        } else {
          console.log('Google Fit (Health Connect) not available on this platform');
          throw new Error('Google Fit is only available on Android devices');
        }
        break;
      
      case 'fitbit':
      case 'strava':
        console.log(`${trackerId} integration not implemented yet`);
        throw new Error(`${trackerId} integration coming soon!`);
      
      default:
        throw new Error(`Unknown tracker: ${trackerId}`);
    }
  }

  // Get platform status message
  getPlatformStatus(): string {
    if (this.platformInfo.platform === 'ios') {
      if (this.platformInfo.isSimulator) {
        return 'Running on iOS Simulator - Health tracking not available';
      }
      return 'iOS Device - Apple Health available';
    } else if (this.platformInfo.platform === 'android') {
      if (healthService.isAvailable) {
        return 'Android - Google Fit (Health Connect) available';
      }
      return 'Android - Health Connect not available (app may need to be installed)';
    } else if (this.platformInfo.platform === 'web') {
      return 'Web - Health tracking not available';
    }
    return 'Platform not supported';
  }
}

export default TrackerService;