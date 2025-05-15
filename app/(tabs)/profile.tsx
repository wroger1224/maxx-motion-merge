import React, { useState, useEffect } from 'react';
import { StyleSheet, ActivityIndicator, Alert, View, ScrollView, Text, TouchableOpacity, Platform } from 'react-native';
import { supabase } from '@/lib/supabase';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/lib/auth';
import { useIsFocused } from '@react-navigation/native';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Image } from 'react-native';
import { ResponsiveHeader } from '@/components/ui/responsiveHeader';

type UserActivity = {
  id: string;
  activity_type: string;
  activity_date: string;
  activity_minutes: number;
  activity_type_emoji?: string;
};

type Team = {
  id: string;
  team_name: string;
  joined_at: string;
  role?: string;
};

type Event = {
  id: string;
  name: string;
  status: string;
  start_date: string;
  end_date: string;
  progress?: string;
};

type UserProfile = {
  id: string;
  full_name: string;
  avatar_url: string | null;
  created_at: string;
};

export default function ProfileScreen() {
  const { user } = useAuth();
  const isFocused = useIsFocused();
  const [loading, setLoading] = useState(false);
  const [activities, setActivities] = useState<UserActivity[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [activeTab, setActiveTab] = useState<'activities' | 'teams' | 'events'>('activities');

  useEffect(() => {
    if (user) {
      fetchUserProfile();
      fetchUserTeams();
      fetchUserEvents();
    }
  }, [user]);

  useEffect(() => {
    if (user && isFocused) {
      fetchUserActivities();
    }
  }, [user, isFocused]);

  const fetchUserProfile = async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, avatar_url, created_at')
      .eq('id', user.id)
      .single();
    if (!error && data) setProfile(data);
    setLoading(false);
  };

  const fetchUserTeams = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('team_members')
      .select('joined_at, teams(id, team_name)')
      .eq('user_id', user.id);
    if (!error && data) {
      setTeams(
        data.map((tm: any) => ({
          id: tm.teams.id,
          team_name: tm.teams.team_name,
          joined_at: tm.joined_at,
        }))
      );
    }
  };

  const fetchUserEvents = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('event_registrations')
      .select('events(id, name, status, start_date, end_date)')
      .eq('user_id', user.id);
    if (!error && data) {
      setEvents(
        data.map((er: any) => ({
          id: er.events.id,
          name: er.events.name,
          status: er.events.status,
          start_date: er.events.start_date,
          end_date: er.events.end_date,
        }))
      );
    }
  };

  const fetchUserActivities = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('activities')
        .select(`
          *,
          event:event_id (
            name
          )
        `)
        .eq('user_id', user.id)
        .order('activity_date', { ascending: false });
      console.log('Profile activities:', data, error);
      if (error) throw error;
      setActivities(data || []);
    } catch (err) {
      console.error('Error fetching user activities:', err);
      Alert.alert('Error', 'Failed to load your activities');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      setLoading(true);

      // Force navigation to home page before signing out
      setTimeout(() => {
        // Navigate using window.location for a full reset of the app state
        if (typeof window !== 'undefined') {
          window.location.href = '/';
        } else {
          // Fallback for native
          router.replace('/');
        }
      }, 100);

      // Sign out
      const { error } = await supabase.auth.signOut();

      if (error) {
        Alert.alert('Error', error.message);
      }
    } catch (error: any) {
      Alert.alert('Error', error.message);
      setLoading(false);
    }
  };

  const ActivityCard = ({ activity }: { activity: UserActivity }) => (
    <ThemedView style={styles.activityCard}>
      <View style={styles.activityIconContainer}>
        <ThemedText style={styles.activityIcon}>
          {activity.activity_type_emoji || activity.activity_type.charAt(0)}
        </ThemedText>
      </View>
      <View style={styles.activityInfo}>
        <ThemedText style={styles.activityTitle}>{activity.activity_type}</ThemedText>
        <ThemedText style={styles.activityDetails}>
          {new Date(activity.activity_date).toLocaleDateString()} • {activity.activity_minutes} minutes
        </ThemedText>
      </View>
      <TouchableOpacity style={styles.editButton}>
        <IconSymbol name="pencil" size={18} color="#666666" />
      </TouchableOpacity>
    </ThemedView>
  );

  const TeamCard = ({ team }: { team: Team }) => (
    <ThemedView style={styles.teamCard}>
      <View style={styles.teamIconContainer}>
        <ThemedText style={styles.teamIcon}>
          {team.team_name.split(' ').map((n: string) => n[0]).join('')}
        </ThemedText>
      </View>
      <View style={styles.teamInfo}>
        <ThemedText style={styles.teamName}>{team.team_name}</ThemedText>
        <ThemedText style={styles.teamDetails}>
          Joined {new Date(team.joined_at).toLocaleDateString()}
        </ThemedText>
      </View>
    </ThemedView>
  );

  const EventCard = ({ event }: { event: Event }) => (
    <ThemedView style={styles.eventCard}>
      <View style={styles.eventHeader}>
        <ThemedText style={styles.eventTitle}>{event.name}</ThemedText>
        <View style={[
          styles.eventStatusBadge,
          event.status === 'Active' ? styles.activeEventBadge : styles.upcomingEventBadge
        ]}>
          <ThemedText style={styles.eventStatusText}>{event.status}</ThemedText>
        </View>
      </View>
      <ThemedText style={styles.eventDetails}>
        {`From ${new Date(event.start_date).toLocaleDateString()} to ${new Date(event.end_date).toLocaleDateString()}`}
      </ThemedText>
    </ThemedView>
  );

  return (
    <View style={styles.container}>
      <ResponsiveHeader
        source={require('@/assets/images/gym-equipment.png')}
      >
        <LinearGradient
          colors={['rgba(196, 30, 58, 0.9)', 'rgba(128, 128, 128, 0.85)']}
          locations={[0, 0.5]}
          style={styles.headerOverlay}
        >
          <View style={styles.header}>
            <Text style={styles.headerTitle}>MAXX Motion</Text>
            <View style={styles.userIcon}>
              <Text style={styles.userIconText}>U</Text>
            </View>
          </View>
          <View style={styles.headerContent}>
            <Text style={styles.pageTitle}>My Profile</Text>
            <Text style={styles.tagline}>Track your motion. Reach your potential.</Text>
          </View>
        </LinearGradient>
      </ResponsiveHeader>

      <ThemedView style={styles.profileCard}>
        <View style={styles.profileHeader}>
          <Image
            source={{
              uri:
                (profile && (profile.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.full_name)}&background=random`)) ||
                'https://ui-avatars.com/api/?name=User&background=random'
            }}
            style={styles.profileAvatar}
          />
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{profile?.full_name || 'User'}</Text>
            <Text style={styles.profileDetails}>
              Member since {profile ? new Date(profile.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : ''}
            </Text>
          </View>
        </View>
      </ThemedView>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'activities' && styles.activeTab]}
          onPress={() => setActiveTab('activities')}
        >
          <Text style={[styles.tabText, activeTab === 'activities' && styles.activeTabText]}>
            ACTIVITIES
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'teams' && styles.activeTab]}
          onPress={() => setActiveTab('teams')}
        >
          <Text style={[styles.tabText, activeTab === 'teams' && styles.activeTabText]}>
            TEAMS
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'events' && styles.activeTab]}
          onPress={() => setActiveTab('events')}
        >
          <Text style={[styles.tabText, activeTab === 'events' && styles.activeTabText]}>
            EVENTS
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.contentContainer}>
          {activeTab === 'activities' && (
            <View>
              <View style={styles.sectionHeader}>
                <ThemedText style={styles.sectionTitle}>Activity History</ThemedText>
              </View>

              {loading ? (
                <ActivityIndicator size="large" color="#2196F3" />
              ) : activities.length === 0 ? (
                <ThemedText style={styles.emptyStateText}>No activities logged yet</ThemedText>
              ) : (
                activities.map(activity => (
                  <ActivityCard key={activity.id} activity={activity} />
                ))
              )}
            </View>
          )}

          {activeTab === 'teams' && (
            <View>
              <View style={styles.sectionHeader}>
                <ThemedText style={styles.sectionTitle}>My Teams</ThemedText>
              </View>

              {teams.length === 0 ? (
                <ThemedText style={styles.emptyStateText}>No teams joined yet</ThemedText>
              ) : (
                teams.map(team => (
                  <TeamCard key={team.id} team={team} />
                ))
              )}
            </View>
          )}

          {activeTab === 'events' && (
            <View>
              <View style={styles.sectionHeader}>
                <ThemedText style={styles.sectionTitle}>Events</ThemedText>
              </View>

              {events.length === 0 ? (
                <ThemedText style={styles.emptyStateText}>No events registered yet</ThemedText>
              ) : (
                events.map(event => (
                  <EventCard key={event.id} event={event} />
                ))
              )}
            </View>
          )}
        </View>

        <View style={styles.logoutContainer}>
          <TouchableOpacity 
            style={styles.logoutButton} 
            onPress={handleLogout}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <View style={styles.logoutButtonContent}>
                <IconSymbol name="rectangle.portrait.and.arrow.right" color="#FFFFFF" size={18} />
                <Text style={styles.logoutText}>Sign Out</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  headerOverlay: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    zIndex: 1,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
  },
  userIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userIconText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#C41E3A',
  },
  headerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  pageTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 8,
  },
  tagline: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  profileCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    margin: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  profileDetails: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    backgroundColor: '#fff',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#2196F3',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#757575',
  },
  activeTabText: {
    color: '#2196F3',
  },
  content: {
    flex: 1,
    backgroundColor: '#fff',
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
  },
  activityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 14,
    borderRadius: 10,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  activityIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2196F3',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  activityIcon: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  activityInfo: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 2,
  },
  activityDetails: {
    fontSize: 14,
    color: '#666666',
  },
  editButton: {
    padding: 8,
  },
  teamCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 14,
    borderRadius: 10,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  teamIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  teamIcon: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  teamInfo: {
    flex: 1,
  },
  teamName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 2,
  },
  teamDetails: {
    fontSize: 14,
    color: '#666666',
  },
  eventCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 10,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
  },
  eventStatusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  activeEventBadge: {
    backgroundColor: '#4CAF50',
  },
  upcomingEventBadge: {
    backgroundColor: '#FFC107',
  },
  eventStatusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  eventDetails: {
    fontSize: 14,
    color: '#666666',
  },
  logoutContainer: {
    padding: 16,
    marginBottom: 40,
  },
  logoutButton: {
    backgroundColor: '#C41E3A',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    marginLeft: 8,
  },
  emptyStateText: {
    color: '#666',
    fontSize: 16,
    textAlign: 'center',
  },
}); 