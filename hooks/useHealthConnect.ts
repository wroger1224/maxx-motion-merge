import { useState, useEffect } from 'react';
import { healthService } from '@/lib/healthService';

export function useHealthConnect() {
  const [isAvailable, setIsAvailable] = useState<boolean>(false);
  const [isPermissionGranted, setIsPermissionGranted] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<string>('');

  useEffect(() => {
    // Check if health service is available
    const checkAvailability = async () => {
      try {
        console.log('[useHealthConnect] Starting availability check...');
        setIsLoading(true);
        setError(null);
        
        // Wait for health service to initialize
        console.log('[useHealthConnect] Waiting for health service to initialize...');
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Log debug state
        if (healthService.debugHealthConnectState) {
          await healthService.debugHealthConnectState();
        }
        
        const available = healthService.isAvailable;
        console.log(`[useHealthConnect] Health service available: ${available}`);
        setIsAvailable(available);
        
        // Don't auto-request permissions on mount, let user trigger it
        if (available) {
          console.log('[useHealthConnect] Health service is available, ready for permission request');
          setDebugInfo('Health Connect is available. Tap "Connect Tracker" to grant permissions.');
        } else {
          console.log('[useHealthConnect] Health service not available');
          setDebugInfo('Health Connect is not available. Please install or update the Health Connect app.');
        }
      } catch (err: any) {
        const errorMsg = err?.message || 'Unknown error';
        console.error('[useHealthConnect] Error during availability check:', err);
        setError(`Error initializing health service: ${errorMsg}`);
        setDebugInfo(`Failed to initialize: ${errorMsg}`);
      } finally {
        setIsLoading(false);
      }
    };

    checkAvailability();
  }, []);

  // Function to request permissions
  const requestPermissions = async () => {
    try {
      console.log('[useHealthConnect] User initiated permission request');
      setIsLoading(true);
      setError(null);
      setDebugInfo('Requesting Health Connect permissions...');
      
      // Log current state before request
      if (healthService.debugHealthConnectState) {
        console.log('[useHealthConnect] Current state before permission request:');
        await healthService.debugHealthConnectState();
      }
      
      const granted = await healthService.requestPermissions();
      console.log(`[useHealthConnect] Permission request result: ${granted}`);
      
      setIsPermissionGranted(granted);
      
      if (granted) {
        setDebugInfo('✅ Permissions granted! You can now sync health data.');
        console.log('[useHealthConnect] ✅ Health permissions granted successfully');
      } else {
        setDebugInfo('⚠️ Permissions not granted. Please grant permissions in Health Connect settings.');
        console.log('[useHealthConnect] ⚠️ Health permissions were not granted');
      }
      
      return granted;
    } catch (err: any) {
      const errorMsg = err?.message || 'Unknown error';
      console.error('[useHealthConnect] Error requesting permissions:', err);
      setError(`Error requesting health permissions: ${errorMsg}`);
      setDebugInfo(`❌ Failed to request permissions: ${errorMsg}`);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Function to get step count for a date range
  const getStepCount = async (startDate: Date, endDate: Date) => {
    try {
      console.log(`[useHealthConnect] Getting step count from ${startDate.toLocaleDateString()} to ${endDate.toLocaleDateString()}`);
      setIsLoading(true);
      setError(null);
      const steps = await healthService.getStepCount(startDate, endDate);
      console.log(`[useHealthConnect] Retrieved ${steps || 0} steps`);
      return steps;
    } catch (err: any) {
      const errorMsg = err?.message || 'Unknown error';
      console.error('[useHealthConnect] Error getting step count:', err);
      setError(`Error getting step count: ${errorMsg}`);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Function to get heart rate for a date range
  const getHeartRate = async (startDate: Date, endDate: Date) => {
    try {
      console.log(`[useHealthConnect] Getting heart rate from ${startDate.toLocaleDateString()} to ${endDate.toLocaleDateString()}`);
      setIsLoading(true);
      setError(null);
      const heartRate = await healthService.getHeartRate(startDate, endDate);
      console.log(`[useHealthConnect] Retrieved heart rate: ${heartRate || 'N/A'} bpm`);
      return heartRate;
    } catch (err: any) {
      const errorMsg = err?.message || 'Unknown error';
      console.error('[useHealthConnect] Error getting heart rate:', err);
      setError(`Error getting heart rate: ${errorMsg}`);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Function to get distance for a date range
  const getDistance = async (startDate: Date, endDate: Date) => {
    try {
      console.log(`[useHealthConnect] Getting distance from ${startDate.toLocaleDateString()} to ${endDate.toLocaleDateString()}`);
      setIsLoading(true);
      setError(null);
      const distance = await healthService.getDistance(startDate, endDate);
      console.log(`[useHealthConnect] Retrieved distance: ${distance || 0} meters`);
      return distance;
    } catch (err: any) {
      const errorMsg = err?.message || 'Unknown error';
      console.error('[useHealthConnect] Error getting distance:', err);
      setError(`Error getting distance: ${errorMsg}`);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Function to get calories burned for a date range
  const getCaloriesBurned = async (startDate: Date, endDate: Date) => {
    try {
      console.log(`[useHealthConnect] Getting calories from ${startDate.toLocaleDateString()} to ${endDate.toLocaleDateString()}`);
      setIsLoading(true);
      setError(null);
      const calories = await healthService.getCaloriesBurned(startDate, endDate);
      console.log(`[useHealthConnect] Retrieved calories: ${calories || 0} kcal`);
      return calories;
    } catch (err: any) {
      const errorMsg = err?.message || 'Unknown error';
      console.error('[useHealthConnect] Error getting calories:', err);
      setError(`Error getting calories burned: ${errorMsg}`);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Function to get workouts for a date range
  const getWorkouts = async (startDate: Date, endDate: Date) => {
    try {
      console.log(`[useHealthConnect] Getting workouts from ${startDate.toLocaleDateString()} to ${endDate.toLocaleDateString()}`);
      setIsLoading(true);
      setError(null);
      const workouts = await healthService.getWorkouts(startDate, endDate);
      console.log(`[useHealthConnect] Retrieved ${workouts?.length || 0} workouts`);
      return workouts;
    } catch (err: any) {
      const errorMsg = err?.message || 'Unknown error';
      console.error('[useHealthConnect] Error getting workouts:', err);
      setError(`Error getting workouts: ${errorMsg}`);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isAvailable,
    isPermissionGranted,
    isLoading,
    error,
    debugInfo,
    requestPermissions,
    getStepCount,
    getHeartRate,
    getDistance,
    getCaloriesBurned,
    getWorkouts,
  };
} 