import { Platform, NativeModules } from 'react-native';
import * as Device from 'expo-device';

// Types
export interface HealthData {
  stepCount?: number;
  heartRate?: number;
  distance?: number;
  calories?: number;
  workouts?: WorkoutData[];
}

export interface WorkoutData {
  type: string;
  duration: number; // in minutes
  calories?: number;
  distance?: number;
  startDate: Date;
  endDate: Date;
}

// Import Health Connect for Android with named exports
let HealthConnectModule: any = null;
if (Platform.OS === 'android') {
  try {
    HealthConnectModule = require('react-native-health-connect');
    console.log('[HealthService] Health Connect module loaded successfully');
  } catch (e) {
    console.log('[HealthService] Failed to load Health Connect module:', e);
  }
}

class HealthService {
  public isAvailable: boolean = false;
  private isInitialized: boolean = false;
  private platform: 'ios' | 'android' | 'web' | 'windows' | 'macos';
  private isSimulator: boolean;

  constructor() {
    this.platform = Platform.OS;
    this.isSimulator = !Device.isDevice;
    this.checkAvailability();
  }

  private async checkAvailability() {
    console.log(`[HealthService] Checking availability for platform: ${this.platform}, isSimulator: ${this.isSimulator}`);

    if (this.platform === 'android' && HealthConnectModule) {
      // Check if Health Connect is available on the device
      try {
        console.log('[HealthService] Android: Checking Health Connect SDK status...');
        const status = await HealthConnectModule.getSdkStatus();
        console.log(`[HealthService] Health Connect SDK status code: ${status}`);

        // Map status codes to readable strings
        const statusMap: { [key: number]: string } = {
          1: 'SDK_UNAVAILABLE',
          2: 'SDK_UNAVAILABLE_PROVIDER_UPDATE_REQUIRED',
          3: 'SDK_AVAILABLE'
        };

        console.log(`[HealthService] Health Connect SDK status: ${statusMap[status] || 'UNKNOWN'} (${status})`);

        // Check if SDK is available (status === 3)
        this.isAvailable = status === HealthConnectModule.SdkAvailabilityStatus?.SDK_AVAILABLE || status === 3;

        if (!this.isAvailable) {
          if (status === 1) {
            console.warn('[HealthService] Health Connect is not installed on this device');
          } else if (status === 2) {
            console.warn('[HealthService] Health Connect needs to be updated');
          }
        } else {
          console.log('[HealthService] Health Connect is available and ready');
        }
      } catch (e) {
        console.error('[HealthService] Error checking Health Connect availability:', e);
        // Try to initialize anyway in case the status check is not supported
        this.isAvailable = true;
        console.log('[HealthService] Assuming Health Connect is available despite error');
      }
    } else {
      this.isAvailable = false;
      console.log(`[HealthService] Health tracking not available - Platform: ${this.platform}, Module loaded: ${!!HealthConnectModule}`);
    }
  }

  async initialize(): Promise<boolean> {
    if (!this.isAvailable) {
      console.log('Health service not available on this platform/device');
      return false;
    }

    if (this.platform === 'android') {
      return this.initializeHealthConnect();
    }

    return false;
  }

  private async initializeHealthConnect(): Promise<boolean> {
    try {
      if (!HealthConnectModule) {
        console.error('[HealthService] Health Connect module not loaded');
        return false;
      }

      console.log('[HealthService] Initializing Health Connect...');

      // Initialize Health Connect - returns a boolean
      const isInitialized = await HealthConnectModule.initialize();

      console.log(`[HealthService] Health Connect initialization result: ${isInitialized}`);

      if (!isInitialized) {
        console.error('[HealthService] Failed to initialize Health Connect');

        // Try to get more information about why initialization failed
        try {
          const status = await HealthConnectModule.getSdkStatus();
          console.error(`[HealthService] Current SDK status after failed init: ${status}`);
        } catch (statusError) {
          console.error('[HealthService] Could not get SDK status after failed init:', statusError);
        }

        return false;
      }

      console.log('[HealthService] ✅ Health Connect initialized successfully');
      this.isInitialized = true;
      return true;
    } catch (error: any) {
      console.error('[HealthService] Error initializing Health Connect:', error);
      console.error('[HealthService] Error message:', error?.message);
      console.error('[HealthService] Error stack:', error?.stack);
      return false;
    }
  }

  async requestPermissions(): Promise<boolean> {
    if (!this.isAvailable) {
      return false;
    }

    if (!this.isInitialized) {
      const initialized = await this.initialize();
      if (!initialized) {
        return false;
      }
    }

    if (this.platform === 'android') {
      return this.requestHealthConnectPermissions();
    }

    return false;
  }

  private async requestHealthConnectPermissions(): Promise<boolean> {
    try {
      if (!HealthConnectModule) {
        console.error('[HealthService] Health Connect module not available');
        return false;
      }

      console.log('[HealthService] Starting Health Connect permission request flow...');

      // First check if Health Connect is installed and available
      if (HealthConnectModule.getSdkStatus) {
        const status = await HealthConnectModule.getSdkStatus();
        console.log(`[HealthService] Current SDK Status: ${status}`);

        const statusMap: { [key: number]: string } = {
          1: 'SDK_UNAVAILABLE - Health Connect not installed',
          2: 'SDK_UNAVAILABLE_PROVIDER_UPDATE_REQUIRED - Health Connect needs update',
          3: 'SDK_AVAILABLE - Ready to use'
        };

        console.log(`[HealthService] Status meaning: ${statusMap[status] || 'UNKNOWN STATUS'}`);

        if (status !== 3) { // SDK_AVAILABLE = 3
          console.error(`[HealthService] Health Connect not ready. Status code: ${status}`);

          if (status === 2) {
            console.error('[HealthService] Health Connect app needs to be updated');
          } else if (status === 1) {
            console.error('[HealthService] Health Connect app needs to be installed');
            console.log('[HealthService] Please install Health Connect from Google Play Store');
          }
          return false;
        }

        console.log('[HealthService] Health Connect is available, proceeding with permission request...');
      }

      // Request permissions for various health data types
      const permissions = [
        { accessType: 'read', recordType: 'Steps' },
        { accessType: 'read', recordType: 'Distance' },
        { accessType: 'read', recordType: 'ActiveCaloriesBurned' },
        { accessType: 'read', recordType: 'ExerciseSession' },
        { accessType: 'read', recordType: 'HeartRate' },
        { accessType: 'read', recordType: 'TotalCaloriesBurned' },
      ];

      console.log('[HealthService] Requesting the following permissions:');
      permissions.forEach(p => console.log(`[HealthService]   - ${p.accessType} ${p.recordType}`));

      const grantedPermissions = await HealthConnectModule.requestPermission(permissions);

      console.log('[HealthService] Permission request completed');
      console.log('[HealthService] Granted permissions:', JSON.stringify(grantedPermissions, null, 2));

      // Check if at least some permissions were granted
      const hasPermissions = grantedPermissions && grantedPermissions.length > 0;

      if (hasPermissions) {
        console.log(`[HealthService] ✅ ${grantedPermissions.length} permissions granted`);
        grantedPermissions.forEach((p: any) => {
          console.log(`[HealthService]   ✓ ${p.accessType || 'read'} ${p.recordType || p}`);
        });

        // Important: After permissions are granted, give Health Connect a moment to process
        console.log('[HealthService] Waiting for Health Connect to process permissions...');
        await new Promise(resolve => setTimeout(resolve, 1000));

      } else {
        console.log('[HealthService] ⚠️ No Health Connect permissions granted');
        console.log('[HealthService] User may need to manually grant permissions in Health Connect settings');

        // Try to open Health Connect settings if available
        if (HealthConnectModule.openHealthConnectSettings) {
          console.log('[HealthService] Opening Health Connect settings for manual permission grant...');
          try {
            HealthConnectModule.openHealthConnectSettings();
            console.log('[HealthService] Health Connect settings opened');
          } catch (openError) {
            console.error('[HealthService] Failed to open Health Connect settings:', openError);
          }
        }
      }

      return hasPermissions;
    } catch (error: any) {
      console.error('[HealthService] ❌ Error requesting Health Connect permissions:', error);
      console.error('[HealthService] Error type:', typeof error);
      console.error('[HealthService] Error message:', error?.message);
      console.error('[HealthService] Error code:', error?.code);
      console.error('[HealthService] Error stack:', error?.stack);

      // Common error scenarios
      if (error?.message?.includes('not installed')) {
        console.error('[HealthService] Health Connect app is not installed. Please install it from Google Play Store.');
      } else if (error?.message?.includes('permission')) {
        console.error('[HealthService] Permission denied by user or system');
      } else if (error?.message?.includes('initialize')) {
        console.error('[HealthService] Health Connect not initialized. Try restarting the app.');
      }

      return false;
    }
  }

  async getStepCount(startDate: Date, endDate: Date): Promise<number | null> {
    if (!this.isAvailable || !this.isInitialized) {
      return null;
    }

    if (this.platform === 'android') {
      return this.getHealthConnectSteps(startDate, endDate);
    }

    return null;
  }

  private async getHealthConnectSteps(startDate: Date, endDate: Date): Promise<number | null> {
    try {
      if (!HealthConnectModule) {
        console.error('[HealthService] Health Connect module not available for reading steps');
        return null;
      }

      console.log('[HealthService] Reading steps from Health Connect');
      console.log(`[HealthService] Date range: ${startDate.toISOString()} to ${endDate.toISOString()}`);

      const result = await HealthConnectModule.readRecords('Steps', {
        timeRangeFilter: {
          operator: 'between',
          startTime: startDate.toISOString(),
          endTime: endDate.toISOString(),
        },
      });

      console.log(`[HealthService] Steps query returned ${result?.records?.length || 0} records`);

      if (!result || !result.records) {
        console.log('[HealthService] No step records found');
        return null;
      }

      // Sum up all step counts
      const totalSteps = result.records.reduce((sum: number, record: any) => {
        const steps = record.count || 0;
        console.log(`[HealthService] Step record: ${steps} steps at ${record.time || 'unknown time'}`);
        return sum + steps;
      }, 0);

      console.log(`[HealthService] Total steps: ${totalSteps}`);
      return totalSteps;
    } catch (error: any) {
      console.error('[HealthService] Error fetching steps from Health Connect:', error);
      console.error('[HealthService] Error details:', error?.message);
      return null;
    }
  }

  async getHeartRate(startDate: Date, endDate: Date): Promise<number | null> {
    if (!this.isAvailable || !this.isInitialized) {
      return null;
    }

    if (this.platform === 'android') {
      return this.getHealthConnectHeartRate(startDate, endDate);
    }

    return null;
  }

  private async getHealthConnectHeartRate(startDate: Date, endDate: Date): Promise<number | null> {
    try {
      if (!HealthConnectModule) {
        console.error('[HealthService] Health Connect module not available for reading heart rate');
        return null;
      }

      console.log('[HealthService] Reading heart rate from Health Connect');
      console.log(`[HealthService] Date range: ${startDate.toISOString()} to ${endDate.toISOString()}`);

      const result = await HealthConnectModule.readRecords('HeartRate', {
        timeRangeFilter: {
          operator: 'between',
          startTime: startDate.toISOString(),
          endTime: endDate.toISOString(),
        },
      });

      console.log(`[HealthService] Heart rate query returned ${result?.records?.length || 0} records`);

      if (!result || !result.records || result.records.length === 0) {
        console.log('[HealthService] No heart rate records found');
        return null;
      }

      // Calculate average heart rate
      let totalSamples = 0;
      let totalBPM = 0;

      result.records.forEach((record: any) => {
        const samples = record.samples || [];
        samples.forEach((sample: any) => {
          if (sample.beatsPerMinute) {
            totalBPM += sample.beatsPerMinute;
            totalSamples++;
            console.log(`[HealthService] Heart rate sample: ${sample.beatsPerMinute} bpm at ${sample.time || 'unknown time'}`);
          }
        });
      });

      if (totalSamples === 0) {
        console.log('[HealthService] No valid heart rate samples found');
        return null;
      }

      const avgHeartRate = Math.round(totalBPM / totalSamples);
      console.log(`[HealthService] Average heart rate: ${avgHeartRate} bpm from ${totalSamples} samples`);

      return avgHeartRate;
    } catch (error: any) {
      console.error('[HealthService] Error fetching heart rate from Health Connect:', error);
      console.error('[HealthService] Error details:', error?.message);
      return null;
    }
  }

  async getDistance(startDate: Date, endDate: Date): Promise<number | null> {
    if (!this.isAvailable || !this.isInitialized) {
      return null;
    }

    if (this.platform === 'android') {
      return this.getHealthConnectDistance(startDate, endDate);
    }

    return null;
  }

  private async getHealthConnectDistance(startDate: Date, endDate: Date): Promise<number | null> {
    try {
      if (!HealthConnectModule) {
        console.error('[HealthService] Health Connect module not available for reading distance');
        return null;
      }

      console.log('[HealthService] Reading distance from Health Connect');
      console.log(`[HealthService] Date range: ${startDate.toISOString()} to ${endDate.toISOString()}`);

      const result = await HealthConnectModule.readRecords('Distance', {
        timeRangeFilter: {
          operator: 'between',
          startTime: startDate.toISOString(),
          endTime: endDate.toISOString(),
        },
      });

      console.log(`[HealthService] Distance query returned ${result?.records?.length || 0} records`);

      if (!result || !result.records) {
        console.log('[HealthService] No distance records found');
        return null;
      }

      // Sum up all distances (in meters)
      const totalDistance = result.records.reduce((sum: number, record: any) => {
        const distance = record.distance?.inMeters || 0;
        console.log(`[HealthService] Distance record: ${distance} meters at ${record.time || 'unknown time'}`);
        return sum + distance;
      }, 0);

      console.log(`[HealthService] Total distance: ${totalDistance} meters (${(totalDistance / 1000).toFixed(2)} km)`);
      return totalDistance;
    } catch (error: any) {
      console.error('[HealthService] Error fetching distance from Health Connect:', error);
      console.error('[HealthService] Error details:', error?.message);
      return null;
    }
  }

  async getCaloriesBurned(startDate: Date, endDate: Date): Promise<number | null> {
    if (!this.isAvailable || !this.isInitialized) {
      return null;
    }

    if (this.platform === 'android') {
      return this.getHealthConnectCalories(startDate, endDate);
    }

    return null;
  }

  private async getHealthConnectCalories(startDate: Date, endDate: Date): Promise<number | null> {
    try {
      if (!HealthConnectModule) {
        console.error('[HealthService] Health Connect module not available for reading calories');
        return null;
      }

      console.log('[HealthService] Reading calories from Health Connect');
      console.log(`[HealthService] Date range: ${startDate.toISOString()} to ${endDate.toISOString()}`);

      const result = await HealthConnectModule.readRecords('ActiveCaloriesBurned', {
        timeRangeFilter: {
          operator: 'between',
          startTime: startDate.toISOString(),
          endTime: endDate.toISOString(),
        },
      });

      console.log(`[HealthService] Calories query returned ${result?.records?.length || 0} records`);

      if (!result || !result.records) {
        console.log('[HealthService] No calorie records found');
        return null;
      }

      // Sum up all calories
      const totalCalories = result.records.reduce((sum: number, record: any) => {
        const calories = record.energy?.inKilocalories || 0;
        console.log(`[HealthService] Calorie record: ${calories} kcal at ${record.time || 'unknown time'}`);
        return sum + calories;
      }, 0);

      const rounded = Math.round(totalCalories);
      console.log(`[HealthService] Total calories burned: ${rounded} kcal`);
      return rounded;
    } catch (error: any) {
      console.error('[HealthService] Error fetching calories from Health Connect:', error);
      console.error('[HealthService] Error details:', error?.message);
      return null;
    }
  }

  async getWorkouts(startDate: Date, endDate: Date): Promise<WorkoutData[] | null> {
    if (!this.isAvailable || !this.isInitialized) {
      return null;
    }

    if (this.platform === 'android') {
      return this.getHealthConnectWorkouts(startDate, endDate);
    }

    return null;
  }

  private async getHealthConnectWorkouts(startDate: Date, endDate: Date): Promise<WorkoutData[] | null> {
    try {
      if (!HealthConnectModule) {
        console.error('[HealthService] Health Connect module not available for reading workouts');
        return null;
      }

      console.log('[HealthService] ====== READING WORKOUTS FROM HEALTH CONNECT ======');
      console.log(`[HealthService] Date range: ${startDate.toLocaleDateString()} to ${endDate.toLocaleDateString()}`);
      console.log(`[HealthService] ISO dates: ${startDate.toISOString()} to ${endDate.toISOString()}`);

      // First, let's check what data sources are available
      if (HealthConnectModule.getAvailableRecords) {
        try {
          const availableRecords = await HealthConnectModule.getAvailableRecords();
          console.log('[HealthService] Available record types:', availableRecords);
        } catch (e) {
          console.log('[HealthService] Could not check available records');
        }
      }

      const result = await HealthConnectModule.readRecords('ExerciseSession', {
        timeRangeFilter: {
          operator: 'between',
          startTime: startDate.toISOString(),
          endTime: endDate.toISOString(),
        },
      });

      console.log(`[HealthService] Workout query completed`);
      console.log(`[HealthService] Raw result:`, JSON.stringify(result, null, 2).substring(0, 500));
      console.log(`[HealthService] Number of records found: ${result?.records?.length || 0}`);

      if (!result || !result.records || result.records.length === 0) {
        console.log('[HealthService] ⚠️ No workout records found in Health Connect');
        console.log('[HealthService] Possible reasons:');
        console.log('[HealthService] 1. Google Fit has not synced data to Health Connect');
        console.log('[HealthService] 2. No workouts recorded in the specified date range');
        console.log('[HealthService] 3. Permissions not granted for ExerciseSession data');
        console.log('[HealthService] 4. Data source (Google Fit) not connected to Health Connect');

        // Try to provide more debug info
        if (HealthConnectModule.getGrantedPermissions) {
          try {
            const granted = await HealthConnectModule.getGrantedPermissions();
            console.log('[HealthService] Currently granted permissions:', granted);
            const hasExercisePermission = granted?.some((p: any) =>
              p.recordType === 'ExerciseSession' || p === 'ExerciseSession'
            );
            if (!hasExercisePermission) {
              console.log('[HealthService] ❌ ExerciseSession permission NOT granted');
            }
          } catch (e) {
            console.log('[HealthService] Could not check granted permissions');
          }
        }

        return null;
      }

      const workouts = result.records.map((session: any, index: number) => {
        const start = new Date(session.startTime);
        const end = new Date(session.endTime);
        const durationMinutes = Math.round((end.getTime() - start.getTime()) / 60000);
        const workoutType = this.mapExerciseType(session.exerciseType);

        console.log(`[HealthService] Workout ${index + 1}: ${workoutType}`);
        console.log(`[HealthService]   Duration: ${durationMinutes} minutes`);
        console.log(`[HealthService]   Calories: ${session.totalEnergyBurned?.inKilocalories || 0} kcal`);
        console.log(`[HealthService]   Distance: ${session.distance?.inMeters || 0} meters`);
        console.log(`[HealthService]   Time: ${start.toLocaleString()} - ${end.toLocaleString()}`);
        console.log(`[HealthService]   Source: ${session.metadata?.dataOrigin || 'Unknown'}`);

        return {
          type: workoutType,
          duration: durationMinutes,
          calories: session.totalEnergyBurned?.inKilocalories || 0,
          distance: session.distance?.inMeters || 0,
          startDate: start,
          endDate: end
        };
      });

      console.log(`[HealthService] ✅ Successfully retrieved ${workouts.length} workouts`);
      console.log('[HealthService] ====== END READING WORKOUTS ======');
      return workouts;
    } catch (error: any) {
      console.error('[HealthService] ❌ Error fetching workouts from Health Connect:', error);
      console.error('[HealthService] Error type:', typeof error);
      console.error('[HealthService] Error message:', error?.message);
      console.error('[HealthService] Error stack:', error?.stack);

      if (error?.message?.includes('permission')) {
        console.error('[HealthService] This appears to be a permission issue');
      } else if (error?.message?.includes('not found')) {
        console.error('[HealthService] Record type might not be available');
      }

      return null;
    }
  }

  // Map Health Connect exercise types to friendly names
  private mapExerciseType(exerciseType: number): string {
    // Health Connect exercise type constants
    const exerciseTypeMap: { [key: number]: string } = {
      1: 'Badminton',
      2: 'Baseball',
      3: 'Basketball',
      4: 'Biking',
      8: 'Biking (Stationary)',
      9: 'Boot Camp',
      10: 'Boxing',
      12: 'Calisthenics',
      13: 'Cricket',
      14: 'Dancing',
      16: 'Elliptical',
      24: 'Hiking',
      25: 'Ice Hockey',
      26: 'Ice Skating',
      29: 'Martial Arts',
      32: 'Pilates',
      37: 'Rock Climbing',
      38: 'Roller Skating',
      39: 'Rowing',
      40: 'Rowing Machine',
      41: 'Rugby',
      42: 'Running',
      43: 'Running (Treadmill)',
      44: 'Sailing',
      46: 'Skiing',
      48: 'Soccer',
      50: 'Stair Climbing',
      51: 'Stair Climbing Machine',
      52: 'Strength Training',
      55: 'Swimming (Open Water)',
      56: 'Swimming (Pool)',
      59: 'Tennis',
      61: 'Volleyball',
      62: 'Walking',
      64: 'Weight Training',
      65: 'Wheelchair',
      68: 'Yoga',
      79: 'Other'
    };

    return exerciseTypeMap[exerciseType] || 'Other Activity';
  }

  // Debug helper to log current Health Connect state
  async debugHealthConnectState(): Promise<void> {
    console.log('========== Health Connect Debug Info ==========');
    console.log(`[HealthService] Platform: ${this.platform}`);
    console.log(`[HealthService] Is Simulator: ${this.isSimulator}`);
    console.log(`[HealthService] Module Loaded: ${!!HealthConnectModule}`);
    console.log(`[HealthService] Is Available: ${this.isAvailable}`);
    console.log(`[HealthService] Is Initialized: ${this.isInitialized}`);

    if (this.platform === 'android' && HealthConnectModule) {
      try {
        // Check SDK status
        if (HealthConnectModule.getSdkStatus) {
          const status = await HealthConnectModule.getSdkStatus();
          const statusMap: { [key: number]: string } = {
            1: 'SDK_UNAVAILABLE - Not installed',
            2: 'SDK_UNAVAILABLE_PROVIDER_UPDATE_REQUIRED - Needs update',
            3: 'SDK_AVAILABLE - Ready'
          };
          console.log(`[HealthService] SDK Status: ${statusMap[status] || `Unknown (${status})`}`);
        }

        // Check granted permissions
        if (HealthConnectModule.getGrantedPermissions) {
          try {
            const granted = await HealthConnectModule.getGrantedPermissions();
            console.log(`[HealthService] Granted Permissions: ${granted?.length || 0}`);
            if (granted && granted.length > 0) {
              granted.forEach((p: any) => {
                console.log(`[HealthService]   - ${p.accessType || 'read'} ${p.recordType || p}`);
              });
            }
          } catch (e) {
            console.log('[HealthService] Could not check granted permissions');
          }
        }
      } catch (error: any) {
        console.error('[HealthService] Error getting debug info:', error?.message);
      }
    }

    console.log('================================================');
  }

  // Get Health Connect SDK status (Android only)
  async getHealthConnectStatus(): Promise<number> {
    if (this.platform !== 'android' || !HealthConnectModule) {
      throw new Error('Health Connect status check is only available on Android');
    }

    try {
      const status = await HealthConnectModule.getSdkStatus();
      console.log(`[HealthService] Health Connect SDK status: ${status}`);
      return status;
    } catch (error: any) {
      console.error('[HealthService] Error getting Health Connect status:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const healthService = new HealthService();