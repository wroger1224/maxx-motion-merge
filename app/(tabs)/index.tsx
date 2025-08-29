import React from "react";
import {
  StyleSheet,
  View,
  TouchableOpacity,
  ScrollView,
  Text,
  ImageBackground,
} from "react-native";
import { useEffect } from "react";
import { ThemedView } from "@/components/ThemedView";
import { ThemedText } from "@/components/ThemedText";
import { useAuth } from "@/lib/auth";
import { useUser } from "@/contexts/UserContext";
import { LinearGradient } from "expo-linear-gradient";
import { Colors } from "@/constants/Colors";
import { Layout, Spacing, CommonStyles } from "@/constants/Styles";
import { AdminMenu } from "@/components/AdminMenu";

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
  // Dummy data for user progress
  const userProgress = {
    current: 310,
    target: 500,
    currentMilestone: "Silver (250 min)",
    nextMilestone: "Gold (500 min)",
  };

  // Dummy data for team leaderboard
  const teams: Team[] = [
    {
      id: "fw1",
      rank: 1,
      name: "Fitness Warriors",
      members: 15,
      totalMinutes: 3450,
      minutesPerMember: 230,
      isUserTeam: false,
    },
    {
      id: "mm2",
      rank: 2,
      name: "Move Masters",
      members: 12,
      totalMinutes: 2640,
      minutesPerMember: 220,
      isUserTeam: true,
    },
    {
      id: "hh3",
      rank: 3,
      name: "Health Heroes",
      members: 18,
      totalMinutes: 3240,
      minutesPerMember: 180,
      isUserTeam: false,
    },
    {
      id: "ww4",
      rank: 4,
      name: "Wellness Warriors",
      members: 10,
      totalMinutes: 1650,
      minutesPerMember: 165,
      isUserTeam: false,
    },
  ];

  // Dummy data for recent activities
  const activities: Activity[] = [
    {
      id: "1",
      type: "Running",
      time: "Today",
      duration: 45,
      source: "Strava",
      color: Colors.light.mimosa, // Updated to use Hackathon colors
      initial: "R",
    },
    {
      id: "2",
      type: "Cycling",
      time: "Yesterday",
      duration: 60,
      source: "Strava",
      color: Colors.light.chartreuse, // Updated to use Hackathon colors
      initial: "C",
    },
    {
      id: "3",
      type: "Swimming",
      time: "2 days ago",
      duration: 30,
      source: "Apple Health",
      color: Colors.light.orange, // Updated to use Hackathon colors
      initial: "S",
    },
  ];

  const { user } = useUser();
  const { signOut } = useAuth();

  useEffect(() => {
    // Any initialization logic
  }, []);

  const progressPercentage = (userProgress.current / userProgress.target) * 100;

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header with gradient background */}
        <ImageBackground
          source={require("../../assets/images/gym-equipment.png")}
          style={styles.headerBackground}
          resizeMode="cover"
        >
          <LinearGradient
            colors={[Colors.light.blue, "rgba(0, 0, 0, 0.7)"]}
            style={styles.headerOverlay}
          >
            <View style={styles.header}>
              <ThemedText style={styles.headerTitle}>Dashboard</ThemedText>
              <TouchableOpacity onPress={signOut}>
                <ThemedText style={styles.headerButton}>Sign Out</ThemedText>
              </TouchableOpacity>
              <AdminMenu position="topRight" />
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
        </ImageBackground>

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
                  { width: `${progressPercentage}%` },
                ]}
              />
            </View>
            <ThemedText style={styles.progressText}>
              {userProgress.current} / {userProgress.target} minutes
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

        {/* Coming Soon Section */}
        <ThemedView style={styles.section}>
          <ThemedText variant="h2" style={styles.sectionTitle}>
            Achievements
          </ThemedText>
          <ThemedText style={styles.comingSoon}>
            Achievements coming soon
          </ThemedText>
        </ThemedView>

        {/* Floating Action Button */}
        <TouchableOpacity style={styles.fab}>
          <ThemedText style={styles.fabIcon}>+</ThemedText>
        </TouchableOpacity>
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
  headerBackground: {
    height: 300,
  },
  headerOverlay: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Spacing.md,
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
  headerButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: Colors.light.redOrange,
    borderRadius: 8,
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
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
    marginBottom: Spacing.md,
    backgroundColor: "#fff",
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    marginHorizontal: Spacing.md,
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
