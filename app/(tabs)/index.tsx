import React from "react";
import {
  StyleSheet,
  View,
  TouchableOpacity,
  ScrollView,
  Text,
  ImageBackground,
} from "react-native";
import { useEffect, useState } from "react";
import { ThemedView } from "@/components/ThemedView";
import { ThemedText } from "@/components/ThemedText";
import { useAuth } from "@/lib/auth";
import { useUser } from "@/contexts/UserContext";
import { LinearGradient } from "expo-linear-gradient";
import { Colors } from "@/constants/Colors";
import { Layout, Spacing, CommonStyles } from "@/constants/Styles";
import { ResponsiveHeader } from '@/components/ui/responsiveHeader';
import { supabase } from '@/lib/supabase';
import { useIsFocused } from '@react-navigation/native';
import { FontAwesome5 } from '@expo/vector-icons';
import { Badge, UserBadge, fetchBadges, fetchUserBadges, calculateBadgeProgress } from '@/lib/services/badges';

// Team interface for leaderboard
interface Team {
  id: string;
  rank: number;
  name: string;
  members: number;
  totalMinutes: number;
  minutesPerMember: number;
  isUserTeam: boolean;
}

// Activity interface for recent activities
interface Activity {
  id: string;
  type: string;
  time: string;
  duration: number;
  source: string;
  color: string;
  initial: string;
}

export default function DashboardScreen() {
  const { user } = useAuth();
	const { signOut } = useAuth();
  const { userProfile } = useUser();
  const [userProgress, setUserProgress] = useState({ current: 0, progressMin: 0, progressMax: 0, currentMilestone: '', nextMilestone: '' });
  const [teams, setTeams] = useState<Team[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [userBadges, setUserBadges] = useState<UserBadge[]>([]);
  const isFocused = useIsFocused();

  const badgeList = [
    {
      id: '1', name: 'Step Starter', icon: 'shoe-prints', description: '5k Steps in one day', total: 5000, category: 'Steps', emoji: '👣', imageUrl: 'https://images.unsplash.com/photo-1571008887538-b36bb32f4571?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60'
    },
    {
      id: '2', name: 'Step Master', icon: 'walking', description: '10k Steps in one day', total: 10000, category: 'Steps', emoji: '👟', imageUrl: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60'
    },
    {
      id: '3', name: 'Step Champion', icon: 'running', description: '20k Steps in one day', total: 20000, category: 'Steps', emoji: '👟', imageUrl: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60'
    },
    {
      id: '4', name: 'Workout Beginner', icon: 'dumbbell', description: '10 Total Workouts', total: 10, category: 'Workouts', emoji: '🏋️', imageUrl: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60'
    },
    {
      id: '5', name: 'Workout Expert', icon: 'dumbbell', description: '50 Total Workouts', total: 50, category: 'Workouts', emoji: '🏋️', imageUrl: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60'
    },
    {
      id: '6', name: 'Workout Master', icon: 'award', description: '100 Total Workouts', total: 100, category: 'Workouts', emoji: '🏆', imageUrl: 'https://images.unsplash.com/photo-1549060279-7e168fcee0c2?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60'
    },
    {
      id: '7', name: 'Runner\'s Badge', icon: 'running', description: 'Complete a 5k Run', total: 5, category: 'Activities', emoji: '🏃', imageUrl: 'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60'
    },
    {
      id: '8', name: 'Cyclist\'s Badge', icon: 'bicycle', description: 'Bike 25 Miles', total: 25, category: 'Activities', emoji: '🚴', imageUrl: 'https://images.unsplash.com/photo-1517649763962-0c623066013b?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60'
    },
    {
      id: '9', name: 'Yogi\'s Badge', icon: 'pray', description: '10 Yoga Sessions', total: 10, category: 'Activities', emoji: '🧘‍♂️', imageUrl: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60'
    },
    {
      id: '10', name: 'Early Bird', icon: 'sun', description: 'Workout Before 7 AM', total: 5, category: 'Time', emoji: '🌅', imageUrl: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60'
    },
    {
      id: '11', name: 'Weekend Warrior', icon: 'calendar', description: '5 Weekend Workouts', total: 5, category: 'Time', emoji: '💪', imageUrl: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60'
    },
    {
      id: '12', name: 'Night Owl', icon: 'moon', description: 'Workout After 10 PM', total: 5, category: 'Time', emoji: '🌙', imageUrl: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60'
    }
  ];

  const [badgeProgress, setBadgeProgress] = useState<Record<string, number>>({});
  const [recentBadges, setRecentBadges] = useState<any[]>([]);

  useEffect(() => {
    if (user && userProfile && isFocused) {
      fetchDashboardData();
      fetchBadgeData();
    }
  }, [user, userProfile, isFocused]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      if (!user) {
        setLoading(false);
        return;
      }
      // 1. Get current event
      const today = new Date().toISOString().split('T')[0];
      const { data: eventData, error: eventError } = await supabase
        .from('events')
        .select('*')
        .lte('start_date', today)
        .gte('end_date', today)
        .order('start_date', { ascending: false })
        .limit(1);
      if (eventError) throw eventError;
      const currentEvent = eventData && eventData.length > 0 ? eventData[0] : null;
      if (!currentEvent) {
        setLoading(false);
        return;
      }
      // 2. User Progress & Milestones
      const { data: userActivities } = await supabase
        .from('activities')
        .select('activity_minutes')
        .eq('user_id', user.id)
        .eq('event_id', currentEvent.id);
      const totalMinutes = userActivities?.reduce((sum, a) => sum + a.activity_minutes, 0) || 0;
      const { data: milestones } = await supabase
        .from('milestones')
        .select('milestone_minutes, milestone_name')
        .eq('event_id', currentEvent.id)
        .order('milestone_minutes', { ascending: true });
      let currentMilestone = 'None';
      let nextMilestone = 'None';
      let progressMin = 0;
      let progressMax = 0;
      if (milestones && milestones.length > 0) {
        let prev = { milestone_minutes: 0, milestone_name: 'Start' };
        let found = false;
        for (let i = 0; i < milestones.length; i++) {
          if (totalMinutes < milestones[i].milestone_minutes) {
            currentMilestone = prev.milestone_name + ` (${prev.milestone_minutes} min)`;
            nextMilestone = milestones[i].milestone_name + ` (${milestones[i].milestone_minutes} min)`;
            progressMin = prev.milestone_minutes;
            progressMax = milestones[i].milestone_minutes;
            found = true;
            break;
          }
          prev = milestones[i];
        }
        if (!found) {
          // User has surpassed all milestones
          currentMilestone = milestones[milestones.length - 1].milestone_name + ` (${milestones[milestones.length - 1].milestone_minutes} min)`;
          nextMilestone = 'All milestones achieved!';
          progressMin = milestones[milestones.length - 1].milestone_minutes;
          progressMax = milestones[milestones.length - 1].milestone_minutes;
        }
      }
      setUserProgress({
        current: totalMinutes,
        progressMin,
        progressMax,
        currentMilestone,
        nextMilestone
      });
      // 3. Team Leaderboard
      const { data: allTeams } = await supabase
        .from('teams')
        .select('id, team_name')
        .eq('event_id', currentEvent.id);
      const leaderboard: Team[] = [];
      for (const team of allTeams || []) {
        // Get members
        const { data: members } = await supabase
          .from('team_members')
          .select('user_id')
          .eq('team_id', team.id);
        const memberIds = members?.map(m => m.user_id) || [];
        // Get activities for this team in the current event
        const { data: teamActivities } = await supabase
          .from('activities')
          .select('activity_minutes')
          .eq('event_id', currentEvent.id)
          .in('user_id', memberIds);
        const teamMinutes = teamActivities?.reduce((sum, a) => sum + a.activity_minutes, 0) || 0;
        leaderboard.push({
          id: team.id,
          rank: 0, // will be set after sorting
          name: team.team_name,
          members: memberIds.length,
          totalMinutes: teamMinutes,
          minutesPerMember: memberIds.length > 0 ? Math.round(teamMinutes / memberIds.length) : 0,
          isUserTeam: !!members?.find(m => m.user_id === user.id)
        });
      }
      leaderboard.sort((a, b) => b.totalMinutes - a.totalMinutes);
      leaderboard.forEach((team, idx) => (team.rank = idx + 1));
      setTeams(leaderboard);
      // 4. Recent Activities (user only)
      const { data: recentActs } = await supabase
        .from('activities')
        .select('id, activity_type, activity_date, activity_minutes, activity_source')
        .eq('user_id', user.id)
        .eq('event_id', currentEvent.id)
        .order('activity_date', { ascending: false })
        .limit(5);
      setActivities((recentActs || []).map(a => ({
        id: a.id,
        type: a.activity_type,
        time: new Date(a.activity_date).toLocaleDateString(),
        duration: a.activity_minutes,
        source: a.activity_source,
        color: '#4CAF50', // You can enhance this by mapping activity types to colors
        initial: a.activity_type ? a.activity_type[0] : '?'
      })));
    } catch (err) {
      console.error('Error loading dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchBadgeData = async () => {
    if (!userProfile?.id) return;

    // Fetch all badges and user badges
    const [allBadges, userBadgeData] = await Promise.all([
      fetchBadges(),
      fetchUserBadges(userProfile.id)
    ]);

    setBadges(allBadges);
    setUserBadges(userBadgeData);

    // Calculate badge progress
    await calculateBadgeProgress(userProfile.id);
  };

  const renderRecentBadges = () => {
    const unlockedBadges = userBadges
      .filter(ub => ub.is_unlocked)
      .map(ub => ub.badge)
      .filter((badge): badge is Badge => badge !== undefined)
      .sort((a, b) => {
        const badgeA = userBadges.find(ub => ub.badge_id === a.id);
        const badgeB = userBadges.find(ub => ub.badge_id === b.id);
        return new Date(badgeB?.unlocked_at || '').getTime() - new Date(badgeA?.unlocked_at || '').getTime();
      })
      .slice(0, 3);

    if (unlockedBadges.length === 0) {
      return (
        <Text style={{ color: '#888', fontStyle: 'italic', textAlign: 'center', marginTop: 8 }}>
          You have not yet earned any achievement badges.
        </Text>
      );
    }

    return (
      <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 8 }}>
        {unlockedBadges.map(badge => (
          <View key={badge.id} style={{ alignItems: 'center', marginHorizontal: 8 }}>
            <View style={{ width: 56, height: 56, borderRadius: 28, overflow: 'hidden', backgroundColor: '#eee', marginBottom: 4 }}>
              <FontAwesome5 name={badge.icon} size={32} color="#C41E3A" style={{ textAlign: 'center', marginTop: 12 }} />
            </View>
            <Text style={{ fontSize: 12, fontWeight: '600', color: '#333', textAlign: 'center' }}>{badge.name}</Text>
          </View>
        ))}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <ResponsiveHeader
        source={require('@/assets/images/gym-equipment.png')}
      >
          <LinearGradient
            colors={[Colors.light.blue, "rgba(0, 0, 0, 0.7)"]}
            style={styles.headerOverlay}
          >
            <View style={styles.header}>
              <ThemedText style={styles.headerTitle}>Dashboard</ThemedText>
              <TouchableOpacity onPress={signOut}>
                <ThemedText style={styles.headerTitle}>Sign Out</ThemedText>
              </TouchableOpacity>
            </View>
            <View style={styles.headerContent}>
              <ThemedText variant="h1" style={styles.pageTitle}>
                Welcome back!
              </ThemedText>
              <ThemedText style={styles.tagline}>
                Keep moving, keep competing
              </ThemedText>
            </View>
          </LinearGradient>
      </ResponsiveHeader>

			<ScrollView style={styles.scrollContent}>
        {/* Progress Section */}
        <View style={styles.section}>
          <ThemedText variant="h2" style={styles.sectionTitle}>
            Your Progress
          </ThemedText>
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${userProgress.progressMax > userProgress.progressMin ? ((userProgress.current - userProgress.progressMin) / (userProgress.progressMax - userProgress.progressMin)) * 100 : 100}%` }
                ]}
              />
            </View>
            <ThemedText style={styles.progressText}>
              {userProgress.current} / {userProgress.progressMax} min
            </ThemedText>
            <ThemedText style={styles.milestoneText}>
              Current: {userProgress.currentMilestone}
            </ThemedText>
            <ThemedText style={styles.milestoneText}>
              Next: {userProgress.nextMilestone}
            </ThemedText>
          </View>
          <TouchableOpacity style={styles.shareButton}>
            <ThemedText style={styles.shareButtonText}>
              Share Progress
            </ThemedText>
          </TouchableOpacity>
        </View>

        {/* Team Leaderboard Section */}
        <View style={styles.section}>
          <ThemedText variant="h2" style={styles.sectionTitle}>
            Team Leaderboard
          </ThemedText>
          {teams.map((team, index) => (
            <View
              key={team.id}
              style={[styles.teamItem, team.isUserTeam && styles.userTeamItem]}
            >
              <View
                style={[
                  styles.rankContainer,
                  { backgroundColor: getRankColor(team.rank) },
                ]}
              >
                <ThemedText style={styles.rankText}>{team.rank}</ThemedText>
              </View>
              <View style={styles.teamDetails}>
                <ThemedText style={styles.teamName}>{team.name}</ThemedText>
                <ThemedText style={styles.teamSubtext}>
                  {team.members} members • {team.totalMinutes} total minutes
                </ThemedText>
              </View>
              <ThemedText style={styles.teamMetric}>
                {team.minutesPerMember} min/member
              </ThemedText>
            </View>
          ))}
        </View>

        {/* Recent Activities Section */}
        <View style={styles.section}>
          <ThemedText variant="h2" style={styles.sectionTitle}>
            Recent Activities
          </ThemedText>
          {activities.map((activity) => (
            <View key={activity.id} style={styles.activityItem}>
              <View
                style={[
                  styles.activityIcon,
                  { backgroundColor: activity.color },
                ]}
              >
                <ThemedText style={styles.activityInitial}>
                  {activity.initial}
                </ThemedText>
              </View>
              <View style={styles.activityDetails}>
                <ThemedText style={styles.activityType}>
                  {activity.type}
                </ThemedText>
                <ThemedText style={styles.activityTime}>
                  {activity.time} • {activity.duration} minutes
                </ThemedText>
                <ThemedText style={styles.activitySource}>
                  {activity.source}
                </ThemedText>
              </View>
            </View>
          ))}
        </View>
        <ThemedView style={[styles.section, styles.sectionLast]}>
          <ThemedText variant="h2" style={styles.sectionTitle}>
            Achievements
          </ThemedText>
          <ThemedText>
						{renderRecentBadges()}
          </ThemedText>
        </ThemedView>
      </ScrollView>
    </View>
  );
}

// Helper function to get color based on rank
function getRankColor(rank: number): string {
  switch (rank) {
    case 1:
      return Colors.light.redOrange; // Red Orange for first place
    case 2:
      return Colors.light.orange; // Orange for second place
    case 3:
      return Colors.light.mimosa; // Mimosa for third place
    case 4:
      return Colors.light.chartreuse; // Chartreuse for fourth place
    default:
      return Colors.light.blue; // Blue for other places
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  scrollContent: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  headerOverlay: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
		paddingLeft: 16,
		paddingTop: 16,
		paddingRight: 16,
    zIndex: 1,
  },
  headerTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "600",
  },
  headerContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
  pageTitle: {
    fontSize: 32,
    fontWeight: "700",
    color: "#fff",
    textAlign: "center",
    marginBottom: 8,
  },
  tagline: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.8)",
    textAlign: "center",
  },
  section: {
    padding: Spacing.md,
    marginTop: Spacing.md,
    backgroundColor: "#fff",
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    marginHorizontal: Spacing.md,
  },
	sectionLast: {
		marginBottom: Spacing.md
	},
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: Spacing.md,
    color: Colors.light.text,
  },
  progressContainer: {
    marginBottom: 12,
  },
  progressBar: {
    height: 24,
    backgroundColor: "#E0E0E0",
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 8,
  },
  progressFill: {
    height: "100%",
    backgroundColor: Colors.light.mimosa, // Updated to use Hackathon colors
    borderRadius: 12,
  },
  progressText: {
    textAlign: "center",
    fontWeight: "600",
    color: Colors.light.text,
  },
  milestoneText: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  shareButton: {
    alignSelf: "flex-end",
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: Colors.light.chartreuse, // Updated to use Hackathon colors
    borderRadius: 16,
    marginTop: 8,
  },
  shareButtonText: {
    fontSize: 12,
    color: "#000", // Dark text on light background
    fontWeight: "600",
  },
  teamItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 0,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  userTeamItem: {
    backgroundColor: "#F9F9F9",
  },
  rankContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  rankText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 14,
  },
  teamDetails: {
    flex: 1,
  },
  teamName: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.light.text,
  },
  teamSubtext: {
    fontSize: 12,
    color: "#666",
  },
  teamMetric: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.light.blue, // Updated to use Hackathon colors
  },
  activityItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  activityIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  activityInitial: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  activityDetails: {
    flex: 1,
  },
  activityType: {
    fontSize: 15,
    fontWeight: "500",
    color: Colors.light.text,
  },
  activityTime: {
    fontSize: 12,
    color: "#666",
  },
  activitySource: {
    fontSize: 12,
    color: "#757575",
  },
  fab: {
    position: "absolute",
    right: 16,
    bottom: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.light.redOrange, // Updated to use Hackathon colors
    justifyContent: "center",
    alignItems: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  fabIcon: {
    fontSize: 24,
    color: "#fff",
    fontWeight: "600",
  },
  comingSoon: {
    fontSize: 14,
    color: "#888",
    fontStyle: "italic",
    textAlign: "center",
    marginTop: 8,
  },
});
