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

// New badges aligned with activity minutes tracking
const defaultBadges: Badge[] = [
  // Daily Activity Minutes
  {
    id: "1",
    name: "Daily Starter",
    icon: "clock",
    description: "30 minutes in one day",
    isUnlocked: false,
    progress: 0,
    total: 30,
    category: "Daily Minutes",
    emoji: "⏰",
    imageUrl:
      "https://images.unsplash.com/photo-1571008887538-b36bb32f4571?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60",
  },
  {
    id: "2",
    name: "Daily Achiever",
    icon: "stopwatch",
    description: "60 minutes in one day",
    isUnlocked: false,
    progress: 0,
    total: 60,
    category: "Daily Minutes",
    emoji: "⏱️",
    imageUrl:
      "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60",
  },
  {
    id: "3",
    name: "Daily Champion",
    icon: "trophy",
    description: "120 minutes in one day",
    isUnlocked: false,
    progress: 0,
    total: 120,
    category: "Daily Minutes",
    emoji: "🏆",
    imageUrl:
      "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60",
  },

  // Total Activity Minutes
  {
    id: "4",
    name: "Activity Beginner",
    icon: "play",
    description: "500 total minutes",
    isUnlocked: false,
    progress: 0,
    total: 500,
    category: "Total Minutes",
    emoji: "🎯",
    imageUrl:
      "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60",
  },
  {
    id: "5",
    name: "Activity Expert",
    icon: "medal",
    description: "2,500 total minutes",
    isUnlocked: false,
    progress: 0,
    total: 2500,
    category: "Total Minutes",
    emoji: "🥇",
    imageUrl:
      "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60",
  },
  {
    id: "6",
    name: "Activity Master",
    icon: "crown",
    description: "10,000 total minutes",
    isUnlocked: false,
    progress: 0,
    total: 10000,
    category: "Total Minutes",
    emoji: "👑",
    imageUrl:
      "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60",
  },

  // Activity Variety
  {
    id: "7",
    name: "Activity Explorer",
    icon: "route",
    description: "5 different activity types",
    isUnlocked: false,
    progress: 0,
    total: 5,
    category: "Variety",
    emoji: "🗺️",
    imageUrl:
      "https://images.unsplash.com/photo-1544551763-46a013bb70d5?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60",
  },
  {
    id: "8",
    name: "Activity Adventurer",
    icon: "mountain",
    description: "10 different activity types",
    isUnlocked: false,
    progress: 0,
    total: 10,
    category: "Variety",
    emoji: "🏔️",
    imageUrl:
      "https://images.unsplash.com/photo-1551632811-561732d1e306?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60",
  },
  {
    id: "9",
    name: "Activity Pioneer",
    icon: "compass",
    description: "15 different activity types",
    isUnlocked: false,
    progress: 0,
    total: 15,
    category: "Variety",
    emoji: "🧭",
    imageUrl:
      "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60",
  },

  // Consistency
  {
    id: "10",
    name: "Consistency Starter",
    icon: "calendar-check",
    description: "7 days in a row",
    isUnlocked: false,
    progress: 0,
    total: 7,
    category: "Consistency",
    emoji: "📅",
    imageUrl:
      "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60",
  },
  {
    id: "11",
    name: "Consistency Master",
    icon: "calendar-alt",
    description: "30 days in a row",
    isUnlocked: false,
    progress: 0,
    total: 30,
    category: "Consistency",
    emoji: "📆",
    imageUrl:
      "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60",
  },
  {
    id: "12",
    name: "Consistency Legend",
    icon: "infinity",
    description: "100 days in a row",
    isUnlocked: false,
    progress: 0,
    total: 100,
    category: "Consistency",
    emoji: "♾️",
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
  const [badges, setBadges] = useState<Badge[]>(() => {
    // Initialize with test progress so you can see the new system immediately
    const testProgress = {
      "1": 25, // Daily Starter - 25/30 minutes (progress toward 30)
      "2": 25, // Daily Achiever - 25/60 minutes (progress toward 60)
      "3": 25, // Daily Champion - 25/120 minutes (progress toward 120)
      "4": 300, // Activity Beginner - 300/500 minutes
      "5": 300, // Activity Expert - 300/2500 minutes
      "6": 300, // Activity Master - 300/10000 minutes
      "7": 3, // Activity Explorer - 3/5 types
      "8": 3, // Activity Adventurer - 3/10 types
      "9": 3, // Activity Pioneer - 3/15 types
      "10": 5, // Consistency Starter - 5/7 days
      "11": 5, // Consistency Master - 5/30 days
      "12": 5, // Consistency Legend - 5/100 days
    };

    return defaultBadges.map((badge) => ({
      ...badge,
      progress: testProgress[badge.id] || 0,
      isUnlocked: (testProgress[badge.id] || 0) >= badge.total,
    }));
  });
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
    if (userProfile?.id) {
      fetchMilestones();
      fetchBadges();
      fetchStreak();
      fetchBadgeProgress();
    }
  }, [userProfile?.id]);

  // Recalculate badge progress when streak changes
  useEffect(() => {
    if (currentStreak > 0 && badges.length > 0) {
      console.log("Streak changed, recalculating badge progress");
      fetchBadgeProgress();
    }
  }, [currentStreak]);

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

      console.log("Using new default badges (database fetch disabled for testing)");

      // Temporarily disable database fetch to show new badge system
      // TODO: Update database with new badges using update_badges_new_system.sql
      setBadges(defaultBadges);
      return;

      // Fetch all badges from the database (badges are global, not event-specific)
      const { data: badgesData, error: badgesError } = await supabase
        .from("badges")
        .select("*");

      if (badgesError) {
        console.error("Error fetching badges:", badgesError);
        console.log("Using default badges as fallback");
        // Use default badges if database fetch fails
        setBadges(defaultBadges);
        return;
      }

      if (badgesData && badgesData.length > 0) {
        console.log("Found", badgesData.length, "badges in database");
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
      } else {
        console.log("No badges found in database, using default badges");
        setBadges(defaultBadges);
      }
    } catch (error) {
      console.error("Error in fetchBadges:", error);
      console.log("Using default badges as fallback");
      setBadges(defaultBadges);
    }
  };

  const fetchBadgeProgress = async () => {
    try {
      if (!userProfile?.id) {
        console.log("No user profile ID, skipping badge progress fetch");
        return;
      }

      console.log("Fetching badge progress for user:", userProfile.id);

      // Get the current active event with timeout
      const eventPromise = supabase
        .from("events")
        .select("id")
        .eq("status", "Active")
        .single();

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Request timeout')), 10000)
      );

      const { data: activeEvent, error: eventError } = await Promise.race([
        eventPromise,
        timeoutPromise
      ]) as any;

      if (eventError) {
        console.error("Error fetching active event:", eventError);
        // Try upcoming event as fallback
        const { data: upcomingEvent, error: upcomingError } = await supabase
          .from("events")
          .select("id")
          .eq("status", "Upcoming")
          .single();

        if (upcomingError) {
          console.error("Error fetching upcoming event:", upcomingError);
          return;
        }

        if (!upcomingEvent) {
          console.log("No active or upcoming event found");
          return;
        }

        console.log("Using upcoming event for badge progress");
        // Use upcoming event for calculations
        const { data: activities, error: activitiesError } = await supabase
          .from("activities")
          .select("activity_minutes, activity_date, activity_type")
          .eq("event_id", upcomingEvent.id)
          .eq("user_id", userProfile.id);

        if (activitiesError) {
          console.error("Error fetching activities:", activitiesError);
          return;
        }

        console.log("Found activities:", activities?.length || 0);
        calculateBadgeProgress(activities || []);
        return;
      }

      console.log("Using active event for badge progress:", activeEvent.id);

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

      console.log("Found activities:", activities?.length || 0);

      // If no activities found, show some test progress so you can see the new badges
      if (!activities || activities.length === 0) {
        console.log("No activities found, showing test progress");
        const testProgress = {
          "1": 25, // Daily Starter - 25/30 minutes (progress toward 30)
          "2": 25, // Daily Achiever - 25/60 minutes (progress toward 60)
          "3": 25, // Daily Champion - 25/120 minutes (progress toward 120)
          "4": 300, // Activity Beginner - 300/500 minutes
          "5": 300, // Activity Expert - 300/2500 minutes
          "6": 300, // Activity Master - 300/10000 minutes
          "7": 3, // Activity Explorer - 3/5 types
          "8": 3, // Activity Adventurer - 3/10 types
          "9": 3, // Activity Pioneer - 3/15 types
          "10": 5, // Consistency Starter - 5/7 days
          "11": 5, // Consistency Master - 5/30 days
          "12": 5, // Consistency Legend - 5/100 days
        };

        setBadgeProgress(testProgress);
        setBadges((prevBadges) =>
          prevBadges.map((badge) => ({
            ...badge,
            progress: testProgress[badge.id] || 0,
            isUnlocked: (testProgress[badge.id] || 0) >= badge.total,
          }))
        );
        return;
      }

      calculateBadgeProgress(activities || []);
    } catch (error) {
      console.error("Error in fetchBadgeProgress:", error);
    }
  };

  const calculateBadgeProgress = (activities: any[]) => {
    try {
      console.log("Calculating badge progress for", activities.length, "activities");

      // Calculate progress for each badge type
      const progress: Record<string, number> = {};

      // Daily Minutes badges - Find the highest single-day total
      const dailyTotals: Record<string, number> = {};
      activities.forEach((activity) => {
        const date = activity.activity_date;
        dailyTotals[date] = (dailyTotals[date] || 0) + (activity.activity_minutes || 0);
      });
      const maxDailyMinutes = Math.max(...Object.values(dailyTotals), 0);

      // For daily minutes badges, show progress toward the goal (capped at the goal)
      progress["1"] = Math.min(maxDailyMinutes, 30); // Daily Starter (30 min)
      progress["2"] = Math.min(maxDailyMinutes, 60); // Daily Achiever (60 min)
      progress["3"] = Math.min(maxDailyMinutes, 120); // Daily Champion (120 min)

      // Total Minutes badges - Sum all activity minutes
      const totalMinutes = activities.reduce((sum, activity) => sum + (activity.activity_minutes || 0), 0);

      progress["4"] = totalMinutes; // Activity Beginner (500 min)
      progress["5"] = totalMinutes; // Activity Expert (2,500 min)
      progress["6"] = totalMinutes; // Activity Master (10,000 min)

      // Variety badges - Count unique activity types
      const uniqueActivityTypes = new Set(
        activities.map((activity) => activity.activity_type?.toLowerCase()).filter(Boolean)
      );
      const uniqueCount = uniqueActivityTypes.size;

      progress["7"] = uniqueCount; // Activity Explorer (5 types)
      progress["8"] = uniqueCount; // Activity Adventurer (10 types)
      progress["9"] = uniqueCount; // Activity Pioneer (15 types)

      // Consistency badges - Use the current streak
      progress["10"] = currentStreak; // Consistency Starter (7 days)
      progress["11"] = currentStreak; // Consistency Master (30 days)
      progress["12"] = currentStreak; // Consistency Legend (100 days)

      console.log("Calculated progress:", progress);

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
      console.error("Error in calculateBadgeProgress:", error);
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
        </View>
      </View>
    );
  };

  const renderStreakFlames = () => {
    const flames = [];
    for (let i = 0; i < 21; i++) {
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
      case "Daily Minutes":
        return Colors.light.mimosa; // Yellow for daily achievements
      case "Total Minutes":
        return Colors.light.orange; // Orange for total achievements
      case "Variety":
        return Colors.light.chartreuse; // Green for variety achievements
      case "Consistency":
        return Colors.light.blue; // Blue for consistency achievements
      default:
        return Colors.light.redOrange; // Red for default
    }
  };

  const renderProgressEmojis = (badge: Badge) => {
    const totalEmojis = 5;
    const progress = badge.progress || 0;
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
    const progress = item.progress || 0;
    const isUnlocked = item.isUnlocked || false;
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

  // Create a header component for the FlatList
  const renderListHeader = () => (
    <>
      {/* Streak Section */}
      <View style={styles.streakSection}>
        <ThemedText variant="h2" style={styles.streakTitle}>
          Current Streak
        </ThemedText>
        <View style={styles.streakContainer}>{renderStreak()}</View>
      </View>

      {/* Milestones Section */}
      {renderMilestoneProgress()}

      {/* Badges Section Header */}
      <View style={styles.achievementsSection}>
        <Text style={styles.achievementsTitle}>My Achievements</Text>
      </View>
    </>
  );

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <Header signOut={handleSignOut} title="Achievements" tagline="Unlock badges and track your progress." />

      <FlatList
        style={styles.content}
        data={badges}
        renderItem={renderBadge}
        keyExtractor={(item) => item.id}
        numColumns={NUM_COLUMNS}
        ListHeaderComponent={renderListHeader}
        contentContainerStyle={styles.badgesGrid}
        showsVerticalScrollIndicator={false}
      />

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
    marginHorizontal: 16,
    borderRadius: 8,
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
    marginHorizontal: 2,
    marginVertical: 0,
  },
  badgeGrid: {
    padding: 12,
  },
  badgeContainer: {
    flex: 1,
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
    marginHorizontal: 16,
    borderRadius: 8,
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
