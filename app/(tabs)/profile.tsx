import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  ActivityIndicator,
  Alert,
  View,
  ScrollView,
  ImageBackground,
  Text,
  TouchableOpacity,
  Platform,
} from "react-native";
import { supabase } from "@/lib/supabase";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useAuth } from "@/lib/auth";
import { useIsFocused } from "@react-navigation/native";
import { Colors } from "@/constants/Colors";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { Image } from "react-native";

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
  const { user, signOut } = useAuth();
  const isFocused = useIsFocused();
  const [loading, setLoading] = useState(false);
  const [activities, setActivities] = useState<UserActivity[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [activeTab, setActiveTab] = useState<"activities" | "teams" | "events">(
    "activities"
  );

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
      .from("profiles")
      .select("id, full_name, avatar_url, created_at")
      .eq("id", user.id)
      .single();
    if (!error && data) setProfile(data);
    setLoading(false);
  };

  const fetchUserTeams = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("team_members")
      .select("joined_at, teams(id, team_name)")
      .eq("user_id", user.id);
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
      .from("events")
      .select("id, name, status, start_date, end_date")
      .eq("status", "Active");
    if (!error && data) {
      setEvents(data);
    }
  };

  const fetchUserActivities = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("activities")
      .select("id, activity_type, activity_date, activity_minutes")
      .eq("user_id", user.id)
      .order("activity_date", { ascending: false })
      .limit(10);
    if (!error && data) {
      setActivities(data);
    }
  };

  const handleLogout = async () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          try {
            await supabase.auth.signOut();
            router.replace("/login");
          } catch (error) {
            console.error("Error signing out:", error);
          }
        },
      },
    ]);
  };

  const ActivityCard = ({ activity }: { activity: UserActivity }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <ThemedText variant="h4" style={styles.cardTitle}>
          {activity.activity_type}
        </ThemedText>
        <ThemedText style={styles.cardDate}>
          {new Date(activity.activity_date).toLocaleDateString()}
        </ThemedText>
      </View>
      <View style={styles.cardContent}>
        <ThemedText style={styles.cardMinutes}>
          {activity.activity_minutes} minutes
        </ThemedText>
      </View>
    </View>
  );

  const TeamCard = ({ team }: { team: Team }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <ThemedText variant="h4" style={styles.cardTitle}>
          {team.team_name}
        </ThemedText>
        <ThemedText style={styles.cardDate}>
          Joined {new Date(team.joined_at).toLocaleDateString()}
        </ThemedText>
      </View>
    </View>
  );

  const EventCard = ({ event }: { event: Event }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <ThemedText variant="h4" style={styles.cardTitle}>
          {event.name}
        </ThemedText>
        <View
          style={[styles.statusBadge, { backgroundColor: Colors.light.mimosa }]}
        >
          <ThemedText style={styles.statusText}>{event.status}</ThemedText>
        </View>
      </View>
      <View style={styles.cardContent}>
        <ThemedText style={styles.cardDate}>
          {new Date(event.start_date).toLocaleDateString()} -{" "}
          {new Date(event.end_date).toLocaleDateString()}
        </ThemedText>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.light.redOrange} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
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
            <ThemedText variant="h1" style={styles.headerTitle}>
              Profile
            </ThemedText>
            <TouchableOpacity
              onPress={signOut}
              style={styles.logoutButton}
            >
              <ThemedText style={styles.logoutText}>Sign Out</ThemedText>
            </TouchableOpacity>
          </View>
          <View style={styles.profileSection}>
            <View style={styles.avatarContainer}>
              {profile?.avatar_url ? (
                <Image
                  source={{ uri: profile.avatar_url }}
                  style={styles.avatar}
                />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <ThemedText style={styles.avatarText}>
                    {profile?.full_name?.charAt(0) || "U"}
                  </ThemedText>
                </View>
              )}
            </View>
            <ThemedText variant="h2" style={styles.userName}>
              {profile?.full_name || "User"}
            </ThemedText>
            <ThemedText style={styles.userEmail}>{user?.email}</ThemedText>
          </View>
        </LinearGradient>
      </ImageBackground>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "activities" && styles.activeTab]}
          onPress={() => setActiveTab("activities")}
        >
          <ThemedText
            style={[
              styles.tabText,
              activeTab === "activities" && styles.activeTabText,
            ]}
          >
            Activities
          </ThemedText>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "teams" && styles.activeTab]}
          onPress={() => setActiveTab("teams")}
        >
          <ThemedText
            style={[
              styles.tabText,
              activeTab === "teams" && styles.activeTabText,
            ]}
          >
            Teams
          </ThemedText>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "events" && styles.activeTab]}
          onPress={() => setActiveTab("events")}
        >
          <ThemedText
            style={[
              styles.tabText,
              activeTab === "events" && styles.activeTabText,
            ]}
          >
            Events
          </ThemedText>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {activeTab === "activities" && (
          <View style={styles.tabContent}>
            {activities.length > 0 ? (
              activities.map((activity) => (
                <ActivityCard key={activity.id} activity={activity} />
              ))
            ) : (
              <View style={styles.emptyState}>
                <ThemedText style={styles.emptyStateText}>
                  No activities yet
                </ThemedText>
              </View>
            )}
          </View>
        )}

        {activeTab === "teams" && (
          <View style={styles.tabContent}>
            {teams.length > 0 ? (
              teams.map((team) => <TeamCard key={team.id} team={team} />)
            ) : (
              <View style={styles.emptyState}>
                <ThemedText style={styles.emptyStateText}>
                  No teams joined yet
                </ThemedText>
              </View>
            )}
          </View>
        )}

        {activeTab === "events" && (
          <View style={styles.tabContent}>
            {events.length > 0 ? (
              events.map((event) => <EventCard key={event.id} event={event} />)
            ) : (
              <View style={styles.emptyState}>
                <ThemedText style={styles.emptyStateText}>
                  No active events
                </ThemedText>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
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
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    paddingTop: Platform.OS === "ios" ? 60 : 16,
  },
  headerTitle: {
    color: "#fff",
    fontSize: 32,
    fontWeight: "700",
  },
  logoutButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: Colors.light.redOrange,
    borderRadius: 8,
  },
  logoutText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  profileSection: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 20,
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.light.orange,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    fontSize: 32,
    fontWeight: "600",
    color: "#000",
  },
  userName: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "600",
    marginBottom: 4,
  },
  userEmail: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 16,
  },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingVertical: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: Colors.light.redOrange,
  },
  tabText: {
    fontSize: 14,
    fontWeight: "500",
    color: Colors.light.text,
  },
  activeTabText: {
    color: "#fff",
    fontWeight: "600",
  },
  content: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  tabContent: {
    padding: 16,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.light.text,
  },
  cardDate: {
    fontSize: 12,
    color: "#666",
  },
  cardContent: {
    marginTop: 8,
  },
  cardMinutes: {
    fontSize: 14,
    color: Colors.light.redOrange,
    fontWeight: "500",
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#000",
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
});
