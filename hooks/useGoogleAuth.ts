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

  // Get the proper redirect URI
  const getRedirectUri = () => {
    // For web, we need the full origin URL
    if (Platform.OS === 'web') {
      return window.location.origin;
    }
    
    // For iOS/Android
    const scheme = Constants.expoConfig?.scheme || 'maxx-motion';
    // return `${scheme}://`;
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
              createTask: true
            }
          );
          
          console.log('Auth result type:', result.type);
          
          // The browser was closed without completing auth
          if (result.type === 'cancel' || result.type === 'dismiss') {
            throw new Error('Authentication cancelled');
          }
          
          // If successful, we need to process the OAuth tokens from the URL
          if (result.type === 'success' && result.url) {
            console.log('Processing OAuth response URL...');
            
            // Extract the hash fragment from the URL
            const urlParts = result.url.split('#');
            if (urlParts.length > 1) {
              const hashParams = new URLSearchParams(urlParts[1]);
              const accessToken = hashParams.get('access_token');
              const refreshToken = hashParams.get('refresh_token');
              
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
                  return true;
                }
              }
            }
          }
          
          // If we get here, something went wrong
          console.warn('Failed to process OAuth response');
          throw new Error('Authentication failed - could not process OAuth response');
        }
      } catch (e) {
        console.error('Authentication error:', e);
        setError((e as Error).message);
        return false;
      } finally {
        setLoading(false);
      }
    },
    request,
    loading,
    error
  };
} 