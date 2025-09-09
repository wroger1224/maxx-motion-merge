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

// Import platform-specific health libraries
let AppleHealthKit: any;
let HealthConnect: any;

// Initialize Apple HealthKit for iOS
if (Platform.OS === 'ios') {
  try {
    AppleHealthKit = require('react-native-health').default;
    if (!AppleHealthKit || !AppleHealthKit.initHealthKit) {
      AppleHealthKit = require('react-native-health');
    }
  } catch (e) {
    console.log('Apple HealthKit not available');
  }
}

// Initialize Health Connect for Android
if (Platform.OS === 'android') {
  try {
    HealthConnect = require('react-native-health-connect');
  } catch (e) {
    console.log('Health Connect not available');
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
    if (this.platform === 'ios' && !this.isSimulator && AppleHealthKit) {
      this.isAvailable = true;
    } else if (this.platform === 'android' && HealthConnect) {
      // Check if Health Connect is available on the device
      try {
        const isAvailable = await HealthConnect.getSdkStatus();
        this.isAvailable = isAvailable === HealthConnect.SdkAvailabilityStatus.SDK_AVAILABLE;
      } catch (e) {
        this.isAvailable = true; // Assume available if check fails
      }
    } else {
      this.isAvailable = false;
    }
  }

  async initialize(): Promise<boolean> {
    if (!this.isAvailable) {
      console.log('Health service not available on this platform/device');
      return false;
    }

    if (this.platform === 'ios') {
      return this.initializeAppleHealth();
    } else if (this.platform === 'android') {
      return this.initializeHealthConnect();
    }

    return false;
  }

  private initializeAppleHealth(): Promise<boolean> {
    return new Promise((resolve) => {
      if (!AppleHealthKit || !AppleHealthKit.initHealthKit) {
        console.error('Apple HealthKit not available');
        resolve(false);
        return;
      }

      const permissions = {
        permissions: {
          read: [
            AppleHealthKit.Constants?.Permissions?.Steps,
            AppleHealthKit.Constants?.Permissions?.DistanceWalkingRunning,
            AppleHealthKit.Constants?.Permissions?.DistanceCycling,
            AppleHealthKit.Constants?.Permissions?.Workout,
            AppleHealthKit.Constants?.Permissions?.ActiveEnergyBurned,
            AppleHealthKit.Constants?.Permissions?.HeartRate,
          ].filter(Boolean), // Filter out any undefined permissions
          write: []
        }
      };

      AppleHealthKit.initHealthKit(permissions, (error: string) => {
        if (error) {
          console.error('Error initializing HealthKit:', error);
          resolve(false);
        } else {
          console.log('HealthKit initialized successfully');
          this.isInitialized = true;
          resolve(true);
        }
      });
    });
  }

  private async initializeHealthConnect(): Promise<boolean> {
    try {
      if (!HealthConnect) {
        console.error('Health Connect not available');
        return false;
      }

      // Initialize Health Connect
      const isInitialized = await HealthConnect.initialize();
      
      if (!isInitialized) {
        console.error('Failed to initialize Health Connect');
        return false;
      }

      console.log('Health Connect initialized successfully');
      this.isInitialized = true;
      return true;
    } catch (error) {
      console.error('Error initializing Health Connect:', error);
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

    if (this.platform === 'ios') {
      // Permissions are requested during initialization for iOS
      return this.isInitialized;
    } else if (this.platform === 'android') {
      return this.requestHealthConnectPermissions();
    }

    return false;
  }

  private async requestHealthConnectPermissions(): Promise<boolean> {
    try {
      if (!HealthConnect) {
        console.error('Health Connect module not available');
        return false;
      }

      // First check if Health Connect is installed and available
      if (HealthConnect.getSdkStatus) {
        const status = await HealthConnect.getSdkStatus();
        console.log('Health Connect SDK Status:', status);
        
        if (status !== HealthConnect.SdkAvailabilityStatus.SDK_AVAILABLE) {
          console.error('Health Connect not available. Status:', status);
          if (status === HealthConnect.SdkAvailabilityStatus.SDK_UNAVAILABLE_PROVIDER_UPDATE_REQUIRED) {
            console.error('Health Connect app needs to be updated');
          } else if (status === HealthConnect.SdkAvailabilityStatus.SDK_UNAVAILABLE) {
            console.error('Health Connect app needs to be installed');
          }
          return false;
        }
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

      console.log('Requesting Health Connect permissions...');
      const grantedPermissions = await HealthConnect.requestPermission(permissions);
      
      console.log('Permission response:', grantedPermissions);
      
      // Check if at least some permissions were granted
      const hasPermissions = grantedPermissions && grantedPermissions.length > 0;
      
      if (hasPermissions) {
        console.log('Health Connect permissions granted:', grantedPermissions);
      } else {
        console.log('No Health Connect permissions granted. You may need to manually open Health Connect settings.');
        
        // Try to open Health Connect settings if available
        if (HealthConnect.openHealthConnectSettings) {
          console.log('Opening Health Connect settings...');
          await HealthConnect.openHealthConnectSettings();
        }
      }

      return hasPermissions;
    } catch (error) {
      console.error('Error requesting Health Connect permissions:', error);
      
      // Try to provide more specific error information
      if (error && typeof error === 'object' && 'message' in error) {
        console.error('Error message:', error.message);
      }
      
      return false;
    }
  }

  async getStepCount(startDate: Date, endDate: Date): Promise<number | null> {
    if (!this.isAvailable || !this.isInitialized) {
      return null;
    }

    if (this.platform === 'ios') {
      return this.getAppleHealthSteps(startDate, endDate);
    } else if (this.platform === 'android') {
      return this.getHealthConnectSteps(startDate, endDate);
    }

    return null;
  }

  private getAppleHealthSteps(startDate: Date, endDate: Date): Promise<number | null> {
    return new Promise((resolve) => {
      if (!AppleHealthKit?.getDailyStepCountSamples) {
        resolve(null);
        return;
      }

      const options = {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        period: 1440 // Daily aggregation
      };

      AppleHealthKit.getDailyStepCountSamples(options, (err: any, results: any[]) => {
        if (err) {
          console.error('Error fetching steps from HealthKit:', err);
          resolve(null);
          return;
        }

        const totalSteps = results.reduce((sum, day) => sum + (day.value || 0), 0);
        resolve(totalSteps);
      });
    });
  }

  private async getHealthConnectSteps(startDate: Date, endDate: Date): Promise<number | null> {
    try {
      if (!HealthConnect) {
        return null;
      }

      const result = await HealthConnect.readRecords('Steps', {
        timeRangeFilter: {
          operator: 'between',
          startTime: startDate.toISOString(),
          endTime: endDate.toISOString(),
        },
      });

      if (!result || !result.records) {
        return null;
      }

      // Sum up all step counts
      const totalSteps = result.records.reduce((sum: number, record: any) => {
        return sum + (record.count || 0);
      }, 0);

      return totalSteps;
    } catch (error) {
      console.error('Error fetching steps from Health Connect:', error);
      return null;
    }
  }

  async getHeartRate(startDate: Date, endDate: Date): Promise<number | null> {
    if (!this.isAvailable || !this.isInitialized) {
      return null;
    }

    if (this.platform === 'ios') {
      return this.getAppleHealthHeartRate(startDate, endDate);
    } else if (this.platform === 'android') {
      return this.getHealthConnectHeartRate(startDate, endDate);
    }

    return null;
  }

  private getAppleHealthHeartRate(startDate: Date, endDate: Date): Promise<number | null> {
    return new Promise((resolve) => {
      if (!AppleHealthKit?.getSamples) {
        resolve(null);
        return;
      }

      const options = {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        type: 'HeartRate'
      };

      AppleHealthKit.getSamples(options, (err: any, results: any[]) => {
        if (err || !results || results.length === 0) {
          resolve(null);
          return;
        }

        // Calculate average heart rate
        const avgHeartRate = results.reduce((sum, sample) => sum + sample.value, 0) / results.length;
        resolve(Math.round(avgHeartRate));
      });
    });
  }

  private async getHealthConnectHeartRate(startDate: Date, endDate: Date): Promise<number | null> {
    try {
      if (!HealthConnect) {
        return null;
      }

      const result = await HealthConnect.readRecords('HeartRate', {
        timeRangeFilter: {
          operator: 'between',
          startTime: startDate.toISOString(),
          endTime: endDate.toISOString(),
        },
      });

      if (!result || !result.records || result.records.length === 0) {
        return null;
      }

      // Calculate average heart rate
      const avgHeartRate = result.records.reduce((sum: number, record: any) => {
        const samples = record.samples || [];
        const recordAvg = samples.reduce((s: number, sample: any) => s + (sample.beatsPerMinute || 0), 0) / samples.length;
        return sum + recordAvg;
      }, 0) / result.records.length;

      return Math.round(avgHeartRate);
    } catch (error) {
      console.error('Error fetching heart rate from Health Connect:', error);
      return null;
    }
  }

  async getDistance(startDate: Date, endDate: Date): Promise<number | null> {
    if (!this.isAvailable || !this.isInitialized) {
      return null;
    }

    if (this.platform === 'ios') {
      return this.getAppleHealthDistance(startDate, endDate);
    } else if (this.platform === 'android') {
      return this.getHealthConnectDistance(startDate, endDate);
    }

    return null;
  }

  private getAppleHealthDistance(startDate: Date, endDate: Date): Promise<number | null> {
    return new Promise((resolve) => {
      if (!AppleHealthKit?.getSamples) {
        resolve(null);
        return;
      }

      const options = {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        type: 'DistanceWalkingRunning'
      };

      AppleHealthKit.getSamples(options, (err: any, results: any[]) => {
        if (err) {
          console.error('Error fetching distance from HealthKit:', err);
          resolve(null);
          return;
        }

        const totalDistance = results.reduce((sum, sample) => sum + (sample.value || 0), 0);
        resolve(totalDistance);
      });
    });
  }

  private async getHealthConnectDistance(startDate: Date, endDate: Date): Promise<number | null> {
    try {
      if (!HealthConnect) {
        return null;
      }

      const result = await HealthConnect.readRecords('Distance', {
        timeRangeFilter: {
          operator: 'between',
          startTime: startDate.toISOString(),
          endTime: endDate.toISOString(),
        },
      });

      if (!result || !result.records) {
        return null;
      }

      // Sum up all distances (in meters)
      const totalDistance = result.records.reduce((sum: number, record: any) => {
        return sum + (record.distance?.inMeters || 0);
      }, 0);

      return totalDistance;
    } catch (error) {
      console.error('Error fetching distance from Health Connect:', error);
      return null;
    }
  }

  async getCaloriesBurned(startDate: Date, endDate: Date): Promise<number | null> {
    if (!this.isAvailable || !this.isInitialized) {
      return null;
    }

    if (this.platform === 'ios') {
      return this.getAppleHealthCalories(startDate, endDate);
    } else if (this.platform === 'android') {
      return this.getHealthConnectCalories(startDate, endDate);
    }

    return null;
  }

  private getAppleHealthCalories(startDate: Date, endDate: Date): Promise<number | null> {
    return new Promise((resolve) => {
      if (!AppleHealthKit?.getSamples) {
        resolve(null);
        return;
      }

      const options = {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        type: 'ActiveEnergyBurned'
      };

      AppleHealthKit.getSamples(options, (err: any, results: any[]) => {
        if (err) {
          console.error('Error fetching calories from HealthKit:', err);
          resolve(null);
          return;
        }

        const totalCalories = results.reduce((sum, sample) => sum + (sample.value || 0), 0);
        resolve(Math.round(totalCalories));
      });
    });
  }

  private async getHealthConnectCalories(startDate: Date, endDate: Date): Promise<number | null> {
    try {
      if (!HealthConnect) {
        return null;
      }

      const result = await HealthConnect.readRecords('ActiveCaloriesBurned', {
        timeRangeFilter: {
          operator: 'between',
          startTime: startDate.toISOString(),
          endTime: endDate.toISOString(),
        },
      });

      if (!result || !result.records) {
        return null;
      }

      // Sum up all calories
      const totalCalories = result.records.reduce((sum: number, record: any) => {
        return sum + (record.energy?.inKilocalories || 0);
      }, 0);

      return Math.round(totalCalories);
    } catch (error) {
      console.error('Error fetching calories from Health Connect:', error);
      return null;
    }
  }

  async getWorkouts(startDate: Date, endDate: Date): Promise<WorkoutData[] | null> {
    if (!this.isAvailable || !this.isInitialized) {
      return null;
    }

    if (this.platform === 'ios') {
      return this.getAppleHealthWorkouts(startDate, endDate);
    } else if (this.platform === 'android') {
      return this.getHealthConnectWorkouts(startDate, endDate);
    }

    return null;
  }

  private getAppleHealthWorkouts(startDate: Date, endDate: Date): Promise<WorkoutData[] | null> {
    return new Promise((resolve) => {
      if (!AppleHealthKit?.getSamples) {
        resolve(null);
        return;
      }

      const options = {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        type: 'Workout'
      };

      AppleHealthKit.getSamples(options, (err: any, results: any[]) => {
        if (err) {
          console.error('Error fetching workouts from HealthKit:', err);
          resolve(null);
          return;
        }

        const workouts = results.map(workout => ({
          type: workout.activityName || 'Other',
          duration: Math.round(workout.duration / 60), // Convert to minutes
          calories: workout.calories || 0,
          distance: workout.distance || 0,
          startDate: new Date(workout.start),
          endDate: new Date(workout.end)
        }));

        resolve(workouts);
      });
    });
  }

  private async getHealthConnectWorkouts(startDate: Date, endDate: Date): Promise<WorkoutData[] | null> {
    try {
      if (!HealthConnect) {
        return null;
      }

      const result = await HealthConnect.readRecords('ExerciseSession', {
        timeRangeFilter: {
          operator: 'between',
          startTime: startDate.toISOString(),
          endTime: endDate.toISOString(),
        },
      });

      if (!result || !result.records) {
        return null;
      }

      const workouts = result.records.map((session: any) => {
        const start = new Date(session.startTime);
        const end = new Date(session.endTime);
        const durationMinutes = Math.round((end.getTime() - start.getTime()) / 60000);

        return {
          type: this.mapExerciseType(session.exerciseType),
          duration: durationMinutes,
          calories: session.totalEnergyBurned?.inKilocalories || 0,
          distance: session.distance?.inMeters || 0,
          startDate: start,
          endDate: end
        };
      });

      return workouts;
    } catch (error) {
      console.error('Error fetching workouts from Health Connect:', error);
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
}

// Export singleton instance
export const healthService = new HealthService();