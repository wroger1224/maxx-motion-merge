import React, { useState, useEffect } from "react";
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

const BADGE_SIZE = (Dimensions.get("window").width - 48) / 3;
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

const badges: Badge[] = [
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
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [totalMinutes, setTotalMinutes] = useState(0);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [showAchievement, setShowAchievement] = useState(false);
  const [achievementBadge, setAchievementBadge] = useState<Badge | null>(null);
  const { user } = useUser();
  const router = useRouter();

  const fetchMilestones = async () => {
    try {
      if (!user?.id) return;

      const { data, error } = await supabase
        .from("milestones")
        .select("*")
        .eq("user_id", user.id)
        .order("milestone_minutes", { ascending: true });

      if (error) {
        console.error("Error fetching milestones:", error);
        return;
      }

      setMilestones(data || []);

      // Calculate total minutes from achieved milestones
      const total =
        data?.reduce((sum, milestone) => {
          return milestone.achieved ? sum + milestone.milestone_minutes : sum;
        }, 0) || 0;
      setTotalMinutes(total);
    } catch (error) {
      console.error("Error fetching milestones:", error);
    }
  };

  const fetchBadgeProgress = async () => {
    try {
      if (!user?.id) return;

      // Simulate badge progress data
      const progress: Record<string, number> = {};
      badges.forEach((badge) => {
        // Simulate progress based on badge type
        switch (badge.category) {
          case "Steps":
            progress[badge.id] = Math.min(
              badge.total,
              Math.floor(Math.random() * badge.total * 1.2)
            );
            break;
          case "Workouts":
            progress[badge.id] = Math.min(
              badge.total,
              Math.floor(Math.random() * badge.total * 1.2)
            );
            break;
          case "Activities":
            progress[badge.id] = Math.min(
              badge.total,
              Math.floor(Math.random() * badge.total * 1.2)
            );
            break;
          case "Time":
            progress[badge.id] = Math.min(
              badge.total,
              Math.floor(Math.random() * badge.total * 1.2)
            );
            break;
          default:
            progress[badge.id] = Math.floor(Math.random() * badge.total);
        }
      });

      setBadgeProgress(progress);
    } catch (error) {
      console.error("Error fetching badge progress:", error);
    }
  };

  const fetchStreak = async () => {
    try {
      if (!user?.id) return;

      // Simulate streak data
      setCurrentStreak(Math.floor(Math.random() * 30) + 1);
    } catch (error) {
      console.error("Error fetching streak:", error);
    }
  };

  useEffect(() => {
    fetchMilestones();
    fetchBadgeProgress();
    fetchStreak();
  }, [user]);

  const renderStreak = () => {
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
    const scaleAnim = new Animated.Value(1);
    const progress = badgeProgress[item.id] || 0;
    const isUnlocked = progress >= item.total;

    const onPressIn = () => {
      Animated.spring(scaleAnim, {
        toValue: 0.95,
        friction: 5,
        useNativeDriver: true,
      }).start();
    };

    const onPressOut = () => {
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 5,
        useNativeDriver: true,
      }).start();
      setSelectedBadge({ ...item, isUnlocked, progress });
    };

    const categoryColor = getCategoryColor(item.category);

    return (
      <TouchableOpacity
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        activeOpacity={1}
        style={styles.badgeContainer}
      >
        <Animated.View
          style={[
            styles.badge,
            isUnlocked ? styles.badgeUnlocked : styles.badgeLocked,
            { transform: [{ scale: scaleAnim }] },
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
        </Animated.View>
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
            <View style={styles.milestoneStatus}>
              {milestone.achieved ? (
                <View style={styles.achievedBadge}>
                  <ThemedText style={styles.achievedText}>
                    ✓ Achieved
                  </ThemedText>
                  <ThemedText style={styles.achievedDate}>
                    {milestone.achieved_at
                      ? new Date(milestone.achieved_at).toLocaleDateString()
                      : ""}
                  </ThemedText>
                </View>
              ) : (
                <ThemedText style={styles.pendingText}>Pending</ThemedText>
              )}
            </View>
          </View>
        ))}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

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
            <Text style={styles.headerTitle}>MAXX Motion</Text>
            <View style={styles.userIcon}>
              <Text style={styles.userIconText}>U</Text>
          	</View>
          </View>
          <View style={styles.headerContent}>
					<Text style={styles.pageTitle}>Achievements</Text>
						<ThemedText style={styles.tagline}>
								Unlock badges and track your progress
						</ThemedText>
          </View>
        </LinearGradient>
      </ImageBackground>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Streak Section */}
        <View style={styles.streakSection}>
          <ThemedText variant="h2" style={styles.streakTitle}>
            Current Streak
          </ThemedText>
          <View style={styles.streakContainer}>{renderStreak()}</View>
          <ThemedText style={styles.streakText}>
            {currentStreak} day{currentStreak !== 1 ? "s" : ""} streak!
          </ThemedText>
        </View>

        {/* Milestones Section */}
        {renderMilestoneProgress()}

        {/* Badges Section */}
        <View style={styles.achievementsSection}>
          <ThemedText variant="h2" style={styles.achievementsTitle}>
            Badges
          </ThemedText>
          <View style={styles.badgesGrid}>
            {badges.map((badge, index) => (
              <View key={badge.id} style={styles.badgeWrapper}>
                {renderBadge({ item: badge, index })}
              </View>
            ))}
          </View>
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
    padding: 16,
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
  streakSection: {
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
    marginBottom: 16,
  },
  streakFlame: {
    margin: 2,
  },
  streakText: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginBottom: 20,
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
    marginBottom: 16,
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
    color: Colors.light.mimosa, // Updated to use Hackathon colors
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
  achievementsSection: {
    marginTop: 24,
    paddingHorizontal: GRID_PADDING,
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
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingHorizontal: BADGE_PADDING,
  },
  badgeWrapper: {
    width: BADGE_SIZE,
    marginBottom: 16,
  },
  badgeContainer: {
    flex: 1,
  },
  badge: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    position: "relative",
  },
  badgeUnlocked: {
    borderWidth: 2,
    borderColor: Colors.light.mimosa, // Updated to use Hackathon colors
  },
  badgeLocked: {
    opacity: 0.7,
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
  badgeDescription: {
    fontSize: 10,
    color: "#666",
    textAlign: "center",
    marginBottom: 8,
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
