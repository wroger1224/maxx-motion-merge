import { Platform, NativeModules } from 'react-native';
import * as Device from 'expo-device';
import { supabase } from '../supabase';

// Import react-native-health - try both default and named exports
let AppleHealthKit: any;
try {
  // First try default import
  AppleHealthKit = require('react-native-health').default;
  if (!AppleHealthKit || !AppleHealthKit.initHealthKit) {
    // If default doesn't work, try the module itself
    AppleHealthKit = require('react-native-health');
  }
} catch (e) {
  console.error('Failed to import react-native-health:', e);
}

// If still no methods, build from NativeModule
if (!AppleHealthKit || !AppleHealthKit.initHealthKit) {
  const RNHealth = require('react-native-health');
  if (NativeModules.RCTAppleHealthKit) {
    AppleHealthKit = {
      Constants: RNHealth.Constants || {},
      initHealthKit: NativeModules.RCTAppleHealthKit.initHealthKit,
      getSamples: NativeModules.RCTAppleHealthKit.getSamples,
      getDailyStepCountSamples: NativeModules.RCTAppleHealthKit.getDailyStepCountSamples,
      getWorkoutRouteSamples: NativeModules.RCTAppleHealthKit.getWorkoutRouteSamples,
    };
  }
}

console.log('AppleHealthKit setup complete. Methods available:', {
  initHealthKit: !!AppleHealthKit?.initHealthKit,
  getSamples: !!AppleHealthKit?.getSamples,
  getDailyStepCountSamples: !!AppleHealthKit?.getDailyStepCountSamples,
  Constants: !!AppleHealthKit?.Constants
});

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

// Activity type mappings from HealthKit to your database
const HEALTHKIT_TO_ACTIVITY_TYPE: Record<string, { name: string; id: string }> = {
  'Running': { name: 'Running', id: 'running' },
  'Walking': { name: 'Walking', id: 'walking' },
  'Cycling': { name: 'Cycling', id: 'cycling' },
  'Swimming': { name: 'Swimming', id: 'swimming' },
  'Yoga': { name: 'Yoga', id: 'yoga' },
  'Strength': { name: 'Strength Training', id: 'strength' },
  'CrossTraining': { name: 'Cross Training', id: 'cross_training' },
  'Dance': { name: 'Dance', id: 'dance' },
  'Elliptical': { name: 'Elliptical', id: 'elliptical' },
  'Rowing': { name: 'Rowing', id: 'rowing' },
  'StairClimbing': { name: 'Stair Climbing', id: 'stair_climbing' },
  'Default': { name: 'Other Activity', id: 'other' }
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
    
    if (this.platformInfo.platform === 'ios' && !this.platformInfo.isSimulator) {
      // iOS device - initialize HealthKit
      return new Promise((resolve, reject) => {
        // Check if native module is available
        if (!NativeModules.RCTAppleHealthKit) {
          console.error('RCTAppleHealthKit native module not found. Make sure:');
          console.error('1. HealthKit capability is enabled in Xcode');
          console.error('2. The app was rebuilt after adding react-native-health');
          console.error('3. You are running on a real iOS device');
          reject(new Error('HealthKit native module not found. Please enable HealthKit capability in Xcode and rebuild.'));
          return;
        }

        // Check if AppleHealthKit methods are available
        if (!AppleHealthKit || typeof AppleHealthKit.initHealthKit !== 'function') {
          console.error('AppleHealthKit.initHealthKit not available');
          reject(new Error('HealthKit initHealthKit method not found.'));
          return;
        }

        // Permission configuration - using the documented approach
        const permissions = {
          permissions: {
            read: [
              AppleHealthKit.Constants.Permissions.Steps,
              AppleHealthKit.Constants.Permissions.DistanceWalkingRunning,
              AppleHealthKit.Constants.Permissions.DistanceCycling,
              AppleHealthKit.Constants.Permissions.Workout,
              AppleHealthKit.Constants.Permissions.ActiveEnergyBurned,
              AppleHealthKit.Constants.Permissions.HeartRate,
              AppleHealthKit.Constants.Permissions.FlightsClimbed
            ],
            write: [] // We only need read permissions
          }
        };

        console.log('Requesting HealthKit permissions...');
        AppleHealthKit.initHealthKit(permissions, (error: string) => {
          if (error) {
            console.error('Error initializing HealthKit:', error);
            reject(new Error(error));
          } else {
            console.log('HealthKit initialized successfully');
            this.isInitialized = true;
            resolve();
          }
        });
      });
    } else {
      // Not iOS device or is simulator
      console.log('Health tracking not implemented yet for this platform/device');
      this.isInitialized = false;
      return Promise.resolve();
    }
  }

  // Check if health tracking is available on current platform/device
  isAvailable(): boolean {
    // Only available on real iOS devices for now
    return this.platformInfo.platform === 'ios' && !this.platformInfo.isSimulator;
  }

  // Request necessary permissions from user
  async requestPermissions(): Promise<boolean> {
    if (!this.isAvailable()) {
      console.log('Health tracking not available on this platform/device');
      return false;
    }

    // Permissions are requested during initialization for iOS
    // Return true if initialized successfully
    if (!this.isInitialized) {
      try {
        await this.initialize();
        return this.isInitialized;
      } catch (error) {
        console.error('Failed to request permissions:', error);
        return false;
      }
    }

    return this.isInitialized;
  }

  // Fetch activity data from health tracker
  async fetchActivityData(startDate: Date, endDate: Date): Promise<ActivityData[]> {
    if (!this.isAvailable() || !this.isInitialized) {
      console.log('Cannot fetch data - tracker not available or not initialized');
      return [];
    }

    const activities: ActivityData[] = [];

    try {
      // Fetch workouts
      const workouts = await this.fetchWorkouts(startDate, endDate);
      activities.push(...workouts);

      // Fetch step-based activities if no workouts found
      if (activities.length === 0) {
        const stepActivities = await this.fetchStepActivities(startDate, endDate);
        activities.push(...stepActivities);
      }

      console.log(`Fetched ${activities.length} activities from HealthKit`);
      return activities;
    } catch (error) {
      console.error('Error fetching activity data:', error);
      return [];
    }
  }

  private fetchWorkouts(startDate: Date, endDate: Date): Promise<ActivityData[]> {
    return new Promise((resolve, reject) => {
      if (!AppleHealthKit || !AppleHealthKit.getSamples) {
        console.error('AppleHealthKit.getSamples not available');
        reject(new Error('HealthKit getSamples not available'));
        return;
      }

      const options = {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        type: 'Workout'
      };

      AppleHealthKit.getSamples(options, (err: any, results: Array<any>) => {
        if (err) {
          console.error('Error fetching workouts:', err);
          reject(err);
          return;
        }

        const activities: ActivityData[] = results.map(workout => {
          const workoutType = workout.activityName || 'Other';
          const activityMapping = HEALTHKIT_TO_ACTIVITY_TYPE[workoutType] || 
                                HEALTHKIT_TO_ACTIVITY_TYPE['Default'];

          // Generate a unique ID for this workout
          // Using workout UUID if available, otherwise create one from workout properties
          const externalId = workout.uuid || 
            `workout_${new Date(workout.start).getTime()}_${workout.activityName}_${workout.duration}`;

          return {
            activity_type: activityMapping.name,
            activity_type_linked: activityMapping.id,
            activity_minutes: Math.round(workout.duration / 60),
            activity_date: new Date(workout.start).toISOString().split('T')[0],
            activity_source: 'apple_health',
            external_activity_id: externalId,
            calories: workout.calories || 0,
            distance: workout.distance || 0
          };
        });

        resolve(activities);
      });
    });
  }

  private async fetchStepActivities(startDate: Date, endDate: Date): Promise<ActivityData[]> {
    return new Promise((resolve, reject) => {
      if (!AppleHealthKit || !AppleHealthKit.getDailyStepCountSamples) {
        console.error('AppleHealthKit.getDailyStepCountSamples not available');
        resolve([]); // Don't reject, just return empty array
        return;
      }

      const options: any = {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        period: 1440 // Daily aggregation (in minutes)
      };

      AppleHealthKit.getDailyStepCountSamples(options, (err: any, results: Array<any>) => {
        if (err) {
          console.error('Error fetching steps:', err);
          resolve([]); // Don't reject, just return empty array
          return;
        }

        const activities: ActivityData[] = [];
        
        // Create walking activities from step data
        results.forEach(day => {
          const steps = day.value;
          if (steps > 1000) { // Only log if more than 1000 steps
            // Estimate walking time based on steps (100 steps per minute average)
            const estimatedMinutes = Math.round(steps / 100);
            
            // Generate a unique ID for this step activity
            const dateStr = new Date(day.startDate).toISOString().split('T')[0];
            const externalId = `steps_${dateStr}_${steps}`;
            
            activities.push({
              activity_type: 'Walking',
              activity_type_linked: 'walking',
              activity_minutes: estimatedMinutes,
              activity_date: dateStr,
              activity_source: 'apple_health',
              external_activity_id: externalId,
              steps: steps
            });
          }
        });

        resolve(activities);
      });
    });
  }

  // Sync fetched data to Supabase
  async syncToSupabase(activities: ActivityData[], userId: string, eventId: string): Promise<{ newCount: number; skippedCount: number }> {
    if (activities.length === 0) {
      console.log('No activities to sync');
      return { newCount: 0, skippedCount: 0 };
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
        .eq('activity_source', 'apple_health');

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
          activity_source: activity.activity_source,
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
        return { newCount: newActivities.length, skippedCount };
      } else {
        console.log(`No new activities to sync (${skippedCount} duplicates skipped)`);
        return { newCount: 0, skippedCount };
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
      return 'Android - Health tracking not implemented yet';
    } else if (this.platformInfo.platform === 'web') {
      return 'Web - Health tracking not available';
    }
    return 'Platform not supported';
  }
}

export default TrackerService;