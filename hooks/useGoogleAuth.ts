import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as Linking from 'expo-linking';

// Make sure auth sessions know how to complete properly
WebBrowser.maybeCompleteAuthSession();

export function useGoogleAuth() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [request, setRequest] = useState(true);
  const [retryCount, setRetryCount] = useState(0);

  // Get the proper redirect URI
  const getRedirectUri = () => {
    // For web, we need the full origin URL
    if (Platform.OS === 'web') {
      return window.location.origin;
    }
    
    // For Android, use the package name as the scheme for better compatibility
    if (Platform.OS === 'android') {
      const androidPackage = Constants.expoConfig?.android?.package || 'com.maxxpotential.maxxmotion2';
      return `${androidPackage}://auth-callback`;
    }
    
    // For iOS, use the regular scheme
    const scheme = Constants.expoConfig?.scheme || 'maxx-motion';
    return `${scheme}://auth-callback`;
  };

  // Check for auth state on mount for web platforms
  useEffect(() => {
    if (Platform.OS === 'web') {
      // For web, check if we're coming back from an authentication redirect
      const hasAuthParams = window.location.hash && 
        (window.location.hash.includes('access_token') || 
         window.location.hash.includes('error'));
         
      if (hasAuthParams) {
        console.log('Auth params detected in URL');
        // Let Supabase handle the token extraction
        supabase.auth.getSession();
      }
    }
  }, []);

  return {
    promptAsync: async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log('Starting Google auth flow on', Platform.OS);
        console.log('Using redirect URI:', getRedirectUri());
        
        // Warm up the browser on Android for better performance
        if (Platform.OS === 'android') {
          console.log('Warming up browser for Android...');
          await WebBrowser.warmUpAsync();
        }
        
        // Generate the OAuth URL with Supabase
        const { data, error: authError } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: getRedirectUri(),
            // Only skip browser redirect for native platforms
            skipBrowserRedirect: Platform.OS !== 'web',
            queryParams: {
              // Ensure we get a refresh token
              access_type: 'offline',
              prompt: 'consent', // Force consent screen to ensure we get tokens
            }
          }
        });
        
        if (authError) {
          console.error('Auth error:', authError.message);
          throw authError;
        }
        
        if (!data?.url) {
          throw new Error('No OAuth URL returned from Supabase');
        }
        
        console.log('OAuth URL generated, opening browser...');
        
        // Handle differently for web vs native
        if (Platform.OS === 'web') {
          // For web, open in the same window or a popup
          window.location.href = data.url;
          return true; // This will not actually return on web as the page redirects
        } else {
          // For native platforms, use WebBrowser
          const result = await WebBrowser.openAuthSessionAsync(
            data.url,
            getRedirectUri(),
            {
              showInRecents: true,
              createTask: Platform.OS === 'android', // Only use createTask on Android
              preferEphemeralSession: false // Keep session for better Android compatibility
            }
          );
          
          console.log('Auth result:', { type: result.type, url: 'url' in result ? result.url : undefined });
          
          // On Android, dismiss might still contain valid auth data
          if (result.type === 'cancel') {
            // Check if this is a first-time failure on Android (common issue)
            if (Platform.OS === 'android' && retryCount === 0) {
              console.log('First-time Android auth failure, checking for session...');
              // Sometimes the session is created despite the cancel
              const { data: sessionData } = await supabase.auth.getSession();
              if (sessionData?.session) {
                console.log('Session found despite cancel response!');
                setRetryCount(0);
                return true;
              }
              // Suggest retry for first-time Android failures
              throw new Error('Authentication cancelled. This is common on first attempt - please try again.');
            }
            throw new Error('Authentication cancelled');
          }
          
          // Handle dismiss case - on Android this might still have auth data
          if (result.type === 'dismiss') {
            console.log('Auth dismissed, checking for existing session...');
            // Check if session was created despite dismiss
            const { data: sessionData } = await supabase.auth.getSession();
            if (sessionData?.session) {
              console.log('Session found despite dismiss response!');
              return true;
            }
            
            // On Android, dismiss with URL might still contain tokens
            if (Platform.OS === 'android' && result.type === 'dismiss' && 'url' in result && result.url) {
              console.log('Android dismiss with URL, attempting to extract tokens...');
              // Continue to process the URL below
            } else {
              throw new Error('Authentication cancelled');
            }
          }
          
          // Process OAuth tokens from the URL (for both success and Android dismiss with URL)
          if ((result.type === 'success' || (result.type === 'dismiss' && Platform.OS === 'android')) && 'url' in result && result.url) {
            console.log('Processing OAuth response URL...');
            
            // Try multiple URL parsing strategies
            let accessToken: string | null = null;
            let refreshToken: string | null = null;
            
            // Strategy 1: Hash fragment parsing
            const urlString = result.url;
            const hashIndex = urlString.indexOf('#');
            if (hashIndex !== -1) {
              const hashFragment = urlString.substring(hashIndex + 1);
              const hashParams = new URLSearchParams(hashFragment);
              accessToken = hashParams.get('access_token');
              refreshToken = hashParams.get('refresh_token');
            }
            
            // Strategy 2: Query parameter parsing (some Android responses)
            if (!accessToken) {
              const queryIndex = urlString.indexOf('?');
              if (queryIndex !== -1) {
                const queryFragment = urlString.substring(queryIndex + 1);
                const queryParams = new URLSearchParams(queryFragment);
                accessToken = queryParams.get('access_token');
                refreshToken = queryParams.get('refresh_token');
              }
            }
            
            if (accessToken) {
              console.log('Access token found, setting session...');
              
              // Set the session with the tokens
              const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
                access_token: accessToken,
                refresh_token: refreshToken || ''
              });
              
              if (sessionError) {
                console.error('Error setting session:', sessionError);
                throw sessionError;
              }
              
              if (sessionData?.session) {
                console.log('Authentication successful, session established');
                setRetryCount(0); // Reset retry count on success
                return true;
              }
            } else {
              // No tokens found, check if session exists anyway
              console.log('No tokens in URL, checking for existing session...');
              const { data: sessionData } = await supabase.auth.getSession();
              if (sessionData?.session) {
                console.log('Session found despite no tokens in URL!');
                setRetryCount(0);
                return true;
              }
            }
          }
          
          // If we get here, something went wrong
          console.warn('Failed to process OAuth response');
          
          // One final check for session on Android
          if (Platform.OS === 'android') {
            const { data: finalCheck } = await supabase.auth.getSession();
            if (finalCheck?.session) {
              console.log('Final check: Session found!');
              setRetryCount(0);
              return true;
            }
          }
          
          setRetryCount(retryCount + 1);
          throw new Error('Authentication failed - could not process OAuth response');
        }
      } catch (e) {
        console.error('Authentication error:', e);
        setError((e as Error).message);
        return false;
      } finally {
        setLoading(false);
        // Cool down the browser on Android
        if (Platform.OS === 'android') {
          await WebBrowser.coolDownAsync();
        }
      }
    },
    request,
    loading,
    error
  };
} 