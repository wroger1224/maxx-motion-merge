import React, { useState, useEffect, useRef } from "react";
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  Animated,
  TouchableOpacity,
  Modal,
  Dimensions,
  Platform,
  Image,
  ImageBackground,
  ScrollView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import Constants from "expo-constants";
import { FontAwesome5 } from "@expo/vector-icons";
import { supabase } from "@/lib/supabase";
import { useUser } from "@/contexts/UserContext";
import { useRouter } from "expo-router";
import { Colors } from "@/constants/Colors";
import { ThemedText } from "@/components/ThemedText";
import { ResponsiveHeader } from "@/components/ui/responsiveHeader";
import { useAuth } from "@/lib/auth";
import { Header } from "@/components/ui/header";
import {
  parseDateFromStorage,
  getDayOfWeek,
  isWeekend,
  getHourFromTimestamp
} from '../utils/dateUtils';

const WIDTH = Dimensions.get("window").width;
const BADGE_SIZE = WIDTH > 768 ? (WIDTH - 48) / 3 : WIDTH - 48;
const NUM_COLUMNS = WIDTH > 768 ? 3 : 1;
const BADGE_PADDING = 6;
const GRID_PADDING = 16;

interface Badge {
  id: string;
  name: string;
  icon: string;
  description: string;
  isUnlocked: boolean;
  progress: number;
  total: number;
  category: string;
  emoji: string;
  imageUrl: string;
}

// Keep the hardcoded badges array as a fallback
const defaultBadges: Badge[] = [
  // Step-Based Goals
  {
    id: "1",
    name: "Step Starter",
    icon: "shoe-prints",
    description: "5k Steps in one day",
    isUnlocked: true,
    progress: 5000,
    total: 5000,
    category: "Steps",
    emoji: "👣",
    imageUrl:
      "https://images.unsplash.com/photo-1571008887538-b36bb32f4571?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60",
  },
  {
    id: "2",
    name: "Step Master",
    icon: "walking",
    description: "10k Steps in one day",
    isUnlocked: false,
    progress: 7500,
    total: 10000,
    category: "Steps",
    emoji: "👟",
    imageUrl:
      "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60",
  },
  {
    id: "3",
    name: "Step Champion",
    icon: "running",
    description: "20k Steps in one day",
    isUnlocked: false,
    progress: 12000,
    total: 20000,
    category: "Steps",
    emoji: "👟",
    imageUrl:
      "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60",
  },

  // Workout Milestones
  {
    id: "4",
    name: "Workout Beginner",
    icon: "dumbbell",
    description: "10 Total Workouts",
    isUnlocked: true,
    progress: 10,
    total: 10,
    category: "Workouts",
    emoji: "🏋️",
    imageUrl:
      "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60",
  },
  {
    id: "5",
    name: "Workout Expert",
    icon: "dumbbell",
    description: "50 Total Workouts",
    isUnlocked: false,
    progress: 25,
    total: 50,
    category: "Workouts",
    emoji: "🏋️",
    imageUrl:
      "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60",
  },
  {
    id: "6",
    name: "Workout Master",
    icon: "award",
    description: "100 Total Workouts",
    isUnlocked: false,
    progress: 45,
    total: 100,
    category: "Workouts",
    emoji: "🏋️",
    imageUrl:
      "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60",
  },

  // Activity Goals
  {
    id: "7",
    name: "Activity Explorer",
    icon: "route",
    description: "5 Different Activities",
    isUnlocked: true,
    progress: 5,
    total: 5,
    category: "Activities",
    emoji: "🚴",
    imageUrl:
      "https://images.unsplash.com/photo-1544551763-46a013bb70d5?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60",
  },
  {
    id: "8",
    name: "Activity Adventurer",
    icon: "mountain",
    description: "10 Different Activities",
    isUnlocked: false,
    progress: 7,
    total: 10,
    category: "Activities",
    emoji: "🏔️",
    imageUrl:
      "https://images.unsplash.com/photo-1551632811-561732d1e306?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60",
  },
  {
    id: "9",
    name: "Activity Pioneer",
    icon: "compass",
    description: "15 Different Activities",
    isUnlocked: false,
    progress: 12,
    total: 15,
    category: "Activities",
    emoji: "🧭",
    imageUrl:
      "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60",
  },

  // Time-Based Goals
  {
    id: "10",
    name: "Time Tracker",
    icon: "clock",
    description: "30 Days of Tracking",
    isUnlocked: true,
    progress: 30,
    total: 30,
    category: "Time",
    emoji: "⏰",
    imageUrl:
      "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60",
  },
  {
    id: "11",
    name: "Time Master",
    icon: "calendar-alt",
    description: "90 Days of Tracking",
    isUnlocked: false,
    progress: 65,
    total: 90,
    category: "Time",
    emoji: "📅",
    imageUrl:
      "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60",
  },
  {
    id: "12",
    name: "Time Legend",
    icon: "trophy",
    description: "365 Days of Tracking",
    isUnlocked: false,
    progress: 120,
    total: 365,
    category: "Time",
    emoji: "🏆",
    imageUrl:
      "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60",
  },
];

type Milestone = {
  id: string;
  milestone_name: string;
  milestone_minutes: number;
  achieved: boolean;
  achieved_at?: string;
  rewarded: boolean;
  rewarded_at?: string;
};

export default function AchievementsScreen() {
  const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [badgeProgress, setBadgeProgress] = useState<Record<string, number>>(
    {}
  );
  const [badges, setBadges] = useState<Badge[]>(defaultBadges);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [totalMinutes, setTotalMinutes] = useState(0);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [showAchievement, setShowAchievement] = useState(false);
  const [achievementBadge, setAchievementBadge] = useState<Badge | null>(null);
  const { user, signOut } = useAuth();
  const { userProfile } = useUser();
  const router = useRouter();
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    fetchMilestones();
    fetchBadgeProgress();
    fetchStreak();
    fetchBadges();
  }, []);

  const fetchMilestones = async () => {
    try {
      // Get the current active event
      const { data: activeEvent, error: eventError } = await supabase
        .from("events")
        .select("id")
        .eq("status", "Active")
        .single();

      if (eventError) {
        console.error("Error fetching active event:", eventError);
        return;
      }

      // Fetch milestones for this event
      const { data: eventMilestones, error: milestonesError } = await supabase
        .from("milestones")
        .select("id, milestone_name, milestone_minutes, users_rewarded")
        .eq("event_id", activeEvent.id)
        .order("milestone_minutes", { ascending: true });

      if (milestonesError) {
        console.error("Error fetching milestones:", milestonesError);
        return;
      }

      // Fetch user's activities
      const { data: activities, error: activitiesError } = await supabase
        .from("activities")
        .select("activity_minutes, activity_date")
        .eq("event_id", activeEvent.id)
        .eq("user_id", userProfile?.id);

      if (activitiesError) {
        console.error("Error fetching activities:", activitiesError);
        return;
      }

      // Calculate total minutes
      const total =
        activities?.reduce(
          (sum, activity) => sum + activity.activity_minutes,
          0
        ) || 0;
      setTotalMinutes(total);

      // Process milestones
      const processedMilestones = eventMilestones.map((milestone) => {
        const achieved = total >= milestone.milestone_minutes;
        const achievedDate = achieved
          ? activities?.sort(
              (a, b) =>
                parseDateFromStorage(b.activity_date).getTime() -
                parseDateFromStorage(a.activity_date).getTime()
            )[0]?.activity_date
          : undefined;

        const usersRewarded = milestone.users_rewarded || [];
        const userReward = Array.isArray(usersRewarded)
          ? usersRewarded.find((r: any) => r.user_id === userProfile?.id)
          : null;

        return {
          id: milestone.id,
          milestone_name: milestone.milestone_name,
          milestone_minutes: milestone.milestone_minutes,
          achieved,
          achieved_at: achievedDate,
          rewarded: !!userReward,
          rewarded_at: userReward?.rewarded_at,
        };
      });

      setMilestones(processedMilestones);
    } catch (error) {
      console.error("Error in fetchMilestones:", error);
    }
  };

  const fetchBadges = async () => {
    try {
      if (!userProfile?.id) return;

      // Get the current active event
      const { data: activeEvent, error: eventError } = await supabase
        .from("events")
        .select("id")
        .eq("status", "Active")
        .single();

      if (eventError) {
        console.error("Error fetching active event:", eventError);
        return;
      }

      // Fetch badges from the database
      const { data: badgesData, error: badgesError } = await supabase
        .from("badges")
        .select("*")
        .eq("event_id", activeEvent.id);

      if (badgesError) {
        console.error("Error fetching badges:", badgesError);
        return;
      }

      if (badgesData && badgesData.length > 0) {
        // Transform the database badges into the format we need
        const transformedBadges = badgesData.map((badge) => ({
          id: badge.id,
          name: badge.name,
          icon: badge.icon,
          description: badge.description,
          isUnlocked: false, // This will be updated by fetchBadgeProgress
          progress: 0, // This will be updated by fetchBadgeProgress
          total: badge.total,
          category: badge.category,
          emoji: badge.emoji,
          imageUrl: badge.image_url,
        }));

        setBadges(transformedBadges);
      }
    } catch (error) {
      console.error("Error in fetchBadges:", error);
    }
  };

  const fetchBadgeProgress = async () => {
    try {
      if (!userProfile?.id) return;

      // Get the current active event
      const { data: activeEvent, error: eventError } = await supabase
        .from("events")
        .select("id")
        .eq("status", "Active")
        .single();

      if (eventError) {
        console.error("Error fetching active event:", eventError);
        return;
      }

      // Fetch user's activities
      const { data: activities, error: activitiesError } = await supabase
        .from("activities")
        .select("activity_minutes, activity_date, activity_type")
        .eq("event_id", activeEvent.id)
        .eq("user_id", userProfile.id);

      if (activitiesError) {
        console.error("Error fetching activities:", activitiesError);
        return;
      }

      // Calculate progress for each badge type
      const progress: Record<string, number> = {};

      // Step-based badges - Convert minutes to steps (100 steps per minute)
      const stepsPerMinute = 100;
      const maxSteps = Math.max(
        ...activities.map((a) => (a.activity_minutes || 0) * stepsPerMinute)
      );
      progress["1"] = maxSteps; // Step Starter
      progress["2"] = maxSteps; // Step Master
      progress["3"] = maxSteps; // Step Champion

      // Workout badges
      const workoutCount = activities.filter(
        (a) => a.activity_type === "workout"
      ).length;
      progress["4"] = Math.min(10, workoutCount); // Workout Beginner
      progress["5"] = Math.min(50, workoutCount); // Workout Expert
      progress["6"] = Math.min(100, workoutCount); // Workout Master

      // Activity-specific badges
      const runningCount = activities.filter(
        (a) => a.activity_type?.toLowerCase() === "running"
      ).length;
      const cyclingCount = activities.filter(
        (a) => a.activity_type?.toLowerCase() === "cycling"
      ).length;
      const yogaCount = activities.filter(
        (a) => a.activity_type?.toLowerCase() === "yoga"
      ).length;

      progress["7"] = Math.min(5, runningCount); // Runner's Badge
      progress["8"] = Math.min(25, cyclingCount); // Cyclist's Badge
      progress["9"] = Math.min(10, yogaCount); // Yogi's Badge

      // Time-based badges
      // Note: activity_date doesn't include time, so time-based badges won't work properly
      // These would need an activity_timestamp field to work correctly
      // For now, this will always return 0
      const earlyWorkouts = 0;

      const weekendWorkouts = activities.filter((a) => {
        return isWeekend(a.activity_date);
      }).length;

      // Note: activity_date doesn't include time, so time-based badges won't work properly
      // For now, this will always return 0
      const nightWorkouts = 0;

      progress["10"] = Math.min(5, earlyWorkouts); // Early Bird
      progress["11"] = Math.min(5, weekendWorkouts); // Weekend Warrior
      progress["12"] = Math.min(5, nightWorkouts); // Night Owl

      setBadgeProgress(progress);

      // Update badges with progress and unlocked status
      setBadges((prevBadges) =>
        prevBadges.map((badge) => ({
          ...badge,
          progress: progress[badge.id] || 0,
          isUnlocked: (progress[badge.id] || 0) >= badge.total,
        }))
      );
    } catch (error) {
      console.error("Error in fetchBadgeProgress:", error);
    }
  };

  const fetchStreak = async () => {
    try {
      if (!userProfile?.id) {
        console.error("No user profile ID found");
        return;
      }

      // Get the current active event
      const { data: activeEvent, error: eventError } = await supabase
        .from("events")
        .select("id")
        .eq("status", "Active")
        .single();

      if (eventError) {
        console.error("Error fetching active event:", eventError.message);
        return;
      }

      if (!activeEvent) {
        console.error("No active event found");
        return;
      }

      // Fetch user's activities
      const { data: activities, error: activitiesError } = await supabase
        .from("activities")
        .select("activity_date")
        .eq("event_id", activeEvent.id)
        .eq("user_id", userProfile.id)
        .order("activity_date", { ascending: false });

      if (activitiesError) {
        console.error("Error fetching activities:", activitiesError.message);
        setCurrentStreak(0);
        return;
      }

      if (!activities || activities.length === 0) {
        console.log("No activities found for user");
        setCurrentStreak(0);
        return;
      }

      // Get today's date at midnight in local time
      const today = new Date();
      const todayStart = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate()
      );
      const todayEnd = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate() + 1
      );

      // Get the most recent activity date
      const mostRecentActivity = parseDateFromStorage(activities[0].activity_date);

      // Debug logging for date comparison
      console.log("Date Comparison Details:", {
        today: {
          full: today.toISOString(),
          start: todayStart.toISOString(),
          end: todayEnd.toISOString(),
        },
        mostRecentActivity: {
          full: mostRecentActivity.toISOString(),
          year: mostRecentActivity.getFullYear(),
          month: mostRecentActivity.getMonth(),
          date: mostRecentActivity.getDate(),
          hours: mostRecentActivity.getHours(),
        },
        comparison: {
          isAfterStart: mostRecentActivity >= todayStart,
          isBeforeEnd: mostRecentActivity < todayEnd,
          isToday:
            mostRecentActivity >= todayStart && mostRecentActivity < todayEnd,
        },
      });

      // Check if the most recent activity is from today
      const isToday =
        mostRecentActivity >= todayStart && mostRecentActivity < todayEnd;

      if (!isToday) {
        console.log("No activity today, streak is 0");
        setCurrentStreak(0);
        return;
      }

      // Start counting streak from today
      let streak = 1;
      let currentDate = new Date(todayStart);
      currentDate.setDate(currentDate.getDate() - 1); // Move to yesterday

      // Check consecutive days
      for (let i = 1; i < activities.length; i++) {
        const activityDate = parseDateFromStorage(activities[i].activity_date);
        const dayStart = new Date(
          currentDate.getFullYear(),
          currentDate.getMonth(),
          currentDate.getDate()
        );
        const dayEnd = new Date(
          currentDate.getFullYear(),
          currentDate.getMonth(),
          currentDate.getDate() + 1
        );

        console.log(`Checking day ${i}:`, {
          activityDate: {
            full: activityDate.toISOString(),
            year: activityDate.getFullYear(),
            month: activityDate.getMonth(),
            date: activityDate.getDate(),
          },
          dayRange: {
            start: dayStart.toISOString(),
            end: dayEnd.toISOString(),
          },
          isMatch: activityDate >= dayStart && activityDate < dayEnd,
        });

        if (activityDate >= dayStart && activityDate < dayEnd) {
          streak++;
          currentDate.setDate(currentDate.getDate() - 1);
        } else {
          break;
        }
      }

      console.log("Final streak:", streak);
      setCurrentStreak(streak);
    } catch (error) {
      console.error("Unexpected error in fetchStreak:", error);
      setCurrentStreak(0);
    }
  };

  const renderStreak = () => {
    return (
      <View style={styles.streakContainer}>
        <View style={styles.streakIconContainer}>
          <FontAwesome5 name="crown" size={32} color="#FFCD58" />
        </View>
        <View style={styles.streakInfo}>
          <Text style={styles.streakTitle}>{currentStreak} Day Streak!</Text>
          <View style={styles.streakFlamesContainer}>
            {renderStreakFlames()}
          </View>
          <Text style={styles.streakSubtitle}>
            {7 - currentStreak} days until next reward
          </Text>
        </View>
      </View>
    );
  };

  const renderStreakFlames = () => {
    const flames = [];
    for (let i = 0; i < 30; i++) {
      flames.push(
        <FontAwesome5
          key={i}
          name="fire"
          size={16}
          color={i < currentStreak ? Colors.light.redOrange : "#E0E0E0"} // Updated to use Hackathon colors
          style={styles.streakFlame}
        />
      );
    }
    return flames;
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "Steps":
        return Colors.light.mimosa; // Updated to use Hackathon colors
      case "Workouts":
        return Colors.light.orange; // Updated to use Hackathon colors
      case "Activities":
        return Colors.light.chartreuse; // Updated to use Hackathon colors
      case "Time":
        return Colors.light.blue; // Updated to use Hackathon colors
      default:
        return Colors.light.redOrange; // Updated to use Hackathon colors
    }
  };

  const renderProgressEmojis = (badge: Badge) => {
    const totalEmojis = 5;
    const progress = badgeProgress[badge.id] || 0;
    const filledEmojis = Math.floor((progress / badge.total) * totalEmojis);

    return (
      <View style={styles.emojiContainer}>
        {[...Array(totalEmojis)].map((_, index) => (
          <Text key={index} style={styles.emoji}>
            {index < filledEmojis ? badge.emoji : "⚪️"}
          </Text>
        ))}
      </View>
    );
  };

  const renderBadge = ({ item, index }: { item: Badge; index: number }) => {
    const progress = badgeProgress[item.id] || 0;
    const isUnlocked = progress >= item.total;
    const categoryColor = getCategoryColor(item.category);

    const onPress = () => {
      setSelectedBadge({ ...item, isUnlocked, progress });
      setModalVisible(true);
    };

    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.8}
        style={styles.badgeContainer}
      >
        <View
          style={[
            styles.badge,
            isUnlocked ? styles.badgeUnlocked : styles.badgeLocked,
          ]}
        >
          {isUnlocked && (
            <View style={styles.unlockedOverlay}>
              <View style={styles.unlockedIndicator}>
                <FontAwesome5
                  name="check-circle"
                  size={24}
                  color={Colors.light.mimosa}
                />{" "}
                {/* Updated to use Hackathon colors */}
              </View>
            </View>
          )}

          <Image
            source={{ uri: item.imageUrl }}
            style={styles.badgeImage}
            resizeMode="cover"
          />

          <View style={styles.badgeContent}>
            <ThemedText variant="h4" style={styles.badgeName}>
              {item.name}
            </ThemedText>
            <ThemedText style={styles.badgeDescription}>
              {item.description}
            </ThemedText>
            {renderProgressEmojis(item)}
            <ThemedText style={styles.badgeProgress}>
              {progress} / {item.total}
            </ThemedText>
          </View>

          <View
            style={[
              styles.categoryIndicator,
              { backgroundColor: categoryColor },
            ]}
          />
        </View>
      </TouchableOpacity>
    );
  };

  const renderBadgeModal = (badge: Badge) => {
    const progress = badgeProgress[badge.id] || 0;
    const isUnlocked = progress >= badge.total;
    const categoryColor = getCategoryColor(badge.category);

    return (
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <ThemedText variant="h2" style={styles.modalTitle}>
                {badge.name}
              </ThemedText>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setModalVisible(false)}
              >
                <ThemedText style={styles.modalCloseText}>×</ThemedText>
              </TouchableOpacity>
            </View>

            <Image
              source={{ uri: badge.imageUrl }}
              style={styles.modalBadgeImage}
              resizeMode="cover"
            />

            <ThemedText style={styles.modalDescription}>
              {badge.description}
            </ThemedText>

            <View style={styles.modalProgressContainer}>
              <View style={styles.modalProgressBar}>
                <View
                  style={[
                    styles.modalProgressFill,
                    { width: `${(progress / badge.total) * 100}%` },
                  ]}
                />
              </View>
              <ThemedText style={styles.modalProgressText}>
                {progress} / {badge.total}
              </ThemedText>
            </View>

            <View
              style={[
                styles.modalCategoryBadge,
                { backgroundColor: categoryColor },
              ]}
            >
              <ThemedText style={styles.modalCategoryText}>
                {badge.category}
              </ThemedText>
            </View>

            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setModalVisible(false)}
            >
              <ThemedText style={styles.modalCloseText}>Close</ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  };

  const renderMilestoneProgress = () => {
    return (
      <View style={styles.milestoneSection}>
        <ThemedText variant="h2" style={styles.milestoneTitle}>
          Milestones
        </ThemedText>
        <ThemedText style={styles.milestoneSubtitle}>
          Track your progress towards fitness goals
        </ThemedText>

        <View style={styles.totalMinutesContainer}>
          <ThemedText style={styles.totalMinutesLabel}>
            Total Minutes:
          </ThemedText>
          <ThemedText style={styles.totalMinutesValue}>
            {totalMinutes}
          </ThemedText>
        </View>

        {milestones.map((milestone) => (
          <View key={milestone.id} style={styles.milestoneCard}>
            <View style={styles.milestoneHeader}>
              <ThemedText style={styles.milestoneName}>
                {milestone.milestone_name}
              </ThemedText>
              <ThemedText style={styles.milestoneMinutes}>
                {milestone.milestone_minutes} min
              </ThemedText>
            </View>
            <View style={styles.milestoneProgressContainer}>
              <View
                style={[
                  styles.milestoneProgressBar,
                  {
                    width: `${Math.min(
                      100,
                      (totalMinutes / milestone.milestone_minutes) * 100
                    )}%`,
                  },
                ]}
              />
            </View>
            <View style={styles.milestoneStatus}>
              {milestone.achieved ? (
                <View style={styles.achievedBadge}>
                  <ThemedText style={styles.achievedText}>
                    {milestone.rewarded ? "🏆 Rewarded" : "✨ Achieved"}
                  </ThemedText>
                  <ThemedText style={styles.achievedDate}>
                    {milestone.achieved_at
                      ? new Date(milestone.achieved_at).toLocaleDateString()
                      : ""}
                  </ThemedText>
                </View>
              ) : (
                <ThemedText style={styles.pendingText}>
                  {milestone.milestone_minutes - totalMinutes} minutes to go
                </ThemedText>
              )}
            </View>
          </View>
        ))}
      </View>
    );
  };

  // Wrap signOut to match Header's expected () => void type
  const handleSignOut = () => {
    void signOut();
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <Header signOut={handleSignOut} title="Achievements" tagline="Unlock badges and track your progress." />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Streak Section */}
        <View style={styles.streakSection}>
          <ThemedText variant="h2" style={styles.streakTitle}>
            Current Streak
          </ThemedText>
          <View style={styles.streakContainer}>{renderStreak()}</View>
        </View>

        {/* Milestones Section */}
        {renderMilestoneProgress()}

        {/* Badges Section */}
        <View style={styles.achievementsSection}>
          <FlatList
            ListHeaderComponent={
              <>
                <Text style={styles.achievementsTitle}>My Achievements</Text>
              </>
            }
            data={badges}
            renderItem={renderBadge}
            keyExtractor={(item) => item.id}
            numColumns={NUM_COLUMNS}
            scrollEnabled={true}
            contentContainerStyle={styles.badgesGrid}
          />
        </View>
      </ScrollView>

      {/* Badge Modal */}
      {selectedBadge && renderBadgeModal(selectedBadge)}

      {/* Achievement Celebration Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={showAchievement}
        onRequestClose={() => setShowAchievement(false)}
      >
        <View style={styles.achievementOverlay}>
          <View style={styles.achievementContent}>
            <FontAwesome5
              name="trophy"
              size={64}
              color={Colors.light.mimosa} // Updated to use Hackathon colors
              style={styles.celebrationIcon}
            />
            <ThemedText variant="h1" style={styles.achievementTitle}>
              Achievement Unlocked!
            </ThemedText>
            <ThemedText style={styles.achievementDescription}>
              {achievementBadge?.name}
            </ThemedText>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowAchievement(false)}
            >
              <ThemedText style={styles.modalCloseText}>Continue</ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background, // Updated to use Hackathon colors
  },
  headerOverlay: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 16,
    paddingLeft: 16,
    paddingRight: 16,
    zIndex: 1,
  },
  headerTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "600",
  },
  userIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.light.background,
    alignItems: "center",
    justifyContent: "center",
  },
  userIconText: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.light.redOrange,
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
  content: {
    flex: 1,
  },
  streakIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#FFF5F5",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  streakInfo: {
    flex: 1,
  },
  streakSubtitle: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
  },
  streakSection: {
    padding: 16,
    backgroundColor: "#fff",
    marginTop: 16,
    marginHorizontal:16,
    borderRadius:8,
  },
  streakFlamesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: WIDTH > 500 ? "space-between" : "flex-start",
    marginVertical: 8,
    width: "100%",
  },
  streakFlame: {
    marginHorizontal: 0,
    marginVertical: 0,
  },
  badgeGrid: {
    padding: 12,
  },
  badgeContainer: {
    flex:1,
    padding: BADGE_PADDING,
    backgroundColor: "transparent",
  },
  badge: {
    backgroundColor: "#fff",
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    position: "relative",
  },
  streakTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 16,
    color: Colors.light.text, // Updated to use Hackathon colors
  },
  streakContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    width: "100%",
  },
  streakText: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginBottom: 20,
  },
  achievementsSection: {
    flex: 1,
    marginBottom: 16,
    padding: GRID_PADDING,
    backgroundColor: "#fff",
    marginHorizontal:16,
    borderRadius:8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    width: "90%",
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "600",
    color: Colors.light.text, // Updated to use Hackathon colors
  },
  modalCloseButton: {
    paddingVertical: 10,
    paddingHorizontal: 24,
    backgroundColor: Colors.light.redOrange, // Updated to use Hackathon colors
    borderRadius: 8,
  },
  modalCloseText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  achievementOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  achievementContent: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    width: "80%",
  },
  celebrationIcon: {
    marginBottom: 16,
  },
  achievementTitle: {
    fontSize: 24,
    fontWeight: "600",
    color: "#000",
    marginBottom: 8,
  },
  achievementDescription: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
  milestoneSection: {
    padding: 16,
    backgroundColor: "#fff",
    borderRadius: 12,
    margin: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  milestoneTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 8,
    color: Colors.light.text, // Updated to use Hackathon colors
  },
  milestoneSubtitle: {
    fontSize: 16,
    color: "#666",
    marginBottom: 16,
  },
  totalMinutesContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  totalMinutesLabel: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.light.text, // Updated to use Hackathon colors
    marginRight: 8,
  },
  totalMinutesValue: {
    fontSize: 32,
    fontWeight: "700",
    color: Colors.light.redOrange, // Updated to use Hackathon colors
  },
  milestoneCard: {
    backgroundColor: "#f8f8f8",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  milestoneHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  milestoneName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
  },
  milestoneMinutes: {
    fontSize: 14,
    color: "#666",
  },
  milestoneStatus: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  achievedBadge: {
    flexDirection: "row",
    alignItems: "center",
  },
  achievedText: {
    fontSize: 14,
    color: Colors.light.orange, // Updated to use Hackathon colors
    marginRight: 8,
  },
  achievedDate: {
    fontSize: 12,
    color: "#666",
  },
  pendingText: {
    fontSize: 14,
    color: "#666",
  },

  achievementsTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: Colors.light.text, // Updated to use Hackathon colors
    marginBottom: 16,
  },
  milestoneProgressContainer: {
    height: 8,
    backgroundColor: "#eee",
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 8,
  },
  milestoneProgressBar: {
    height: "100%",
    backgroundColor: Colors.light.redOrange, // Updated to use Hackathon colors
    borderRadius: 4,
  },
  badgesGrid: {
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingHorizontal: BADGE_PADDING,
  },
  badgeWrapper: {
    width: BADGE_SIZE,
    marginBottom: 16,
  },
  badgeUnlocked: {
    borderWidth: 2,
    borderColor: Colors.light.mimosa, // Updated to use Hackathon colors
  },
  badgeLocked: {
    opacity: 0.5,
  },
  unlockedOverlay: {
    position: "absolute",
    top: 8,
    right: 8,
    zIndex: 1,
  },
  unlockedIndicator: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 2,
  },
  badgeImage: {
    width: "100%",
    height: 80,
    borderRadius: 8,
    marginBottom: 8,
  },
  badgeContent: {
    alignItems: "center",
  },
  badgeName: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.light.text, // Updated to use Hackathon colors
    textAlign: "center",
    marginBottom: 4,
  },
  badgeNameLocked: {
    color: "#999",
  },
  badgeDescription: {
    fontSize: 10,
    color: "#666",
    textAlign: "center",
    marginBottom: 8,
  },
  badgeCategory: {
    fontSize: 10,
    color: "#FFFFFF",
    fontWeight: "600",
  },
  emojiContainer: {
    flexDirection: "row",
    marginBottom: 4,
  },
  emoji: {
    fontSize: 12,
    marginHorizontal: 1,
  },
  badgeProgress: {
    fontSize: 10,
    color: "#666",
    textAlign: "center",
  },
  categoryIndicator: {
    position: "absolute",
    top: 0,
    left: 0,
    width: 4,
    height: "100%",
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
  },
  categoryContainer: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 4,
    alignSelf: "center",
  },
  modalBadgeImage: {
    width: "100%",
    height: 200,
    borderRadius: 12,
    marginBottom: 16,
  },
  modalDescription: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 16,
  },
  modalProgressContainer: {
    marginBottom: 16,
  },
  modalProgressBar: {
    height: 8,
    backgroundColor: "#eee",
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 8,
  },
  modalProgressFill: {
    height: "100%",
    backgroundColor: Colors.light.mimosa, // Updated to use Hackathon colors
    borderRadius: 4,
  },
  modalProgressText: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
  },
  progressText: {
    fontSize: 12,
    color: "#666",
    textAlign: "center",
    marginTop: 4,
    marginBottom: 8,
  },
  modalCategoryBadge: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    marginBottom: 16,
  },
  modalCategoryText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
  },
});
