import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, FlatList, Animated, TouchableOpacity, Modal, Dimensions, Platform, Image, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import Constants from 'expo-constants';
import { FontAwesome5 } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { useUser } from '@/contexts/UserContext';
import { useRouter } from 'expo-router';
import { ResponsiveHeader } from '@/components/ui/responsiveHeader';
import { Badge, UserBadge, getBadges, getUserBadges, calculateBadgeProgress } from '@/lib/services/badges';

const WIDTH = Dimensions.get('window').width;
const BADGE_SIZE = WIDTH > 768 ? (WIDTH - 48) / 3 : WIDTH - 48;
const NUM_COLUMNS = WIDTH > 768 ? 3 : 1;
const BADGE_PADDING = 6;
const GRID_PADDING = 16;

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
  const { userProfile } = useUser();
  const [badges, setBadges] = useState<Badge[]>([]);
  const [userBadges, setUserBadges] = useState<UserBadge[]>([]);
  const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null);
  const [loading, setLoading] = useState(true);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [selectedMilestone, setSelectedMilestone] = useState<Milestone | null>(null);
  const [showMilestoneModal, setShowMilestoneModal] = useState(false);
  const [showBadgeModal, setShowBadgeModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'badges' | 'milestones'>('badges');
  const [currentEvent, setCurrentEvent] = useState<any>(null);
  const scrollY = useRef(new Animated.Value(0)).current;
  const router = useRouter();

  useEffect(() => {
    fetchData();
  }, [userProfile?.id]);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Get current active event
      const { data: eventData, error: eventError } = await supabase
        .from('events')
        .select('id')
        .eq('status', 'Active')
        .single();

      if (eventError) {
        console.error('Error fetching active event:', eventError);
        return;
      }

      setCurrentEvent(eventData);

      // Fetch badges and user badges
      const [badgesData, userBadgesData] = await Promise.all([
        getBadges(),
        getUserBadges(userProfile?.id || '')
      ]);

      setBadges(badgesData);
      setUserBadges(userBadgesData);

      // Calculate badge progress
      if (userProfile?.id && eventData.id) {
        await calculateBadgeProgress(userProfile.id, eventData.id);
      }

      // Fetch milestones
      const { data: milestonesData, error: milestonesError } = await supabase
        .from('milestones')
        .select('*')
        .eq('event_id', eventData.id)
        .order('milestone_minutes', { ascending: true });

      if (milestonesError) {
        console.error('Error fetching milestones:', milestonesError);
        return;
      }

      // Get user's total minutes
      const { data: activities, error: activitiesError } = await supabase
        .from('activities')
        .select('activity_minutes')
        .eq('event_id', eventData.id)
        .eq('user_id', userProfile?.id);

      if (activitiesError) {
        console.error('Error fetching activities:', activitiesError);
        return;
      }

      const totalMinutes = activities.reduce((sum, a) => sum + (a.activity_minutes || 0), 0);

      // Process milestones
      const processedMilestones = milestonesData.map(milestone => ({
        ...milestone,
        achieved: totalMinutes >= milestone.milestone_minutes,
        achieved_at: totalMinutes >= milestone.milestone_minutes ? new Date().toISOString() : undefined
      }));

      setMilestones(processedMilestones);

    } catch (error) {
      console.error('Error in fetchData:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Steps':
        return '#4CAF50';
      case 'Workouts':
        return '#2196F3';
      case 'Activities':
        return '#9C27B0';
      case 'Time':
        return '#FF9800';
      default:
        return '#757575';
    }
  };

  const renderProgressEmojis = (badge: Badge) => {
    const userBadge = userBadges.find(ub => ub.badge_id === badge.id);
    const progress = userBadge?.progress || 0;
    const total = badge.total;
    const emojis = [];

    for (let i = 0; i < total; i++) {
      emojis.push(
        <Text key={i} style={styles.emoji}>
          {i < progress ? badge.emoji : '⬜'}
        </Text>
      );
    }

    return emojis;
  };

  const renderBadge = ({ item, index }: { item: Badge; index: number }) => {
    const userBadge = userBadges.find(ub => ub.badge_id === item.id);
    const progress = userBadge?.progress || 0;
    const isUnlocked = userBadge?.is_unlocked || false;

    const onPress = () => {
      setSelectedBadge(item);
      setShowBadgeModal(true);
    };

    const categoryColor = getCategoryColor(item.category);

    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={1}
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
                <FontAwesome5 name="check-circle" size={24} color="#4CAF50" />
              </View>
            </View>
          )}

          <Image
            source={{ uri: item.image_url }}
            style={styles.badgeImage}
            resizeMode="cover"
          />

          <View style={styles.badgeContent}>
            <Text style={[styles.badgeName, !isUnlocked && styles.badgeNameLocked]}>
              {item.name}
            </Text>
            <View style={[styles.categoryContainer, { backgroundColor: categoryColor }]}>
              <Text style={styles.badgeCategory}>{item.category}</Text>
            </View>
          </View>

          <View style={styles.emojiContainer}>
            {renderProgressEmojis(item)}
          </View>
          <Text style={styles.progressText}>
            {progress}/{item.total}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderBadgeModal = (badge: Badge) => {
    const userBadge = userBadges.find(ub => ub.badge_id === badge.id);
    const progress = userBadge?.progress || 0;
    const categoryColor = getCategoryColor(badge.category);

    return (
      <View style={styles.modalContent}>
        <Image
          source={{ uri: badge.image_url }}
          style={styles.modalImage}
          resizeMode="cover"
        />
        <Text style={styles.modalTitle}>{badge.name}</Text>
        <View style={[styles.modalCategoryContainer, { backgroundColor: categoryColor }]}>
          <Text style={styles.modalCategoryText}>{badge.category}</Text>
        </View>
        <Text style={styles.modalDescription}>{badge.description}</Text>
        <>
          <Text style={styles.modalProgressTitle}>Progress:</Text>
          {renderProgressEmojis(badge)}
          <Text style={styles.modalProgressText}>
            {progress} of {badge.total} completed
          </Text>
        </>
        <TouchableOpacity
          style={styles.modalCloseButton}
          onPress={() => setShowBadgeModal(false)}
        >
          <Text style={styles.modalCloseText}>Close</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderMilestone = ({ item }: { item: Milestone }) => {
    const onPress = () => {
      setSelectedMilestone(item);
      setShowMilestoneModal(true);
    };

    return (
      <TouchableOpacity
        style={[styles.milestoneItem, item.achieved && styles.achievedItem]}
        onPress={onPress}
      >
        <View style={styles.milestoneHeader}>
          <Text style={styles.milestoneName}>{item.milestone_name}</Text>
          <Text style={styles.milestoneMinutes}>{item.milestone_minutes} minutes</Text>
        </View>
        <View style={styles.milestoneProgressContainer}>
          <View
            style={[
              styles.milestoneProgressBar,
              { width: `${(item.achieved ? 100 : 0)}%` }
            ]}
          />
        </View>
        {item.achieved && (
          <Text style={styles.achievedText}>Achieved!</Text>
        )}
      </TouchableOpacity>
    );
  };

  const renderMilestoneModal = (milestone: Milestone) => {
    return (
      <View style={styles.modalContent}>
        <Text style={styles.modalTitle}>{milestone.milestone_name}</Text>
        <Text style={styles.modalDescription}>
          Complete {milestone.milestone_minutes} minutes of activity to achieve this milestone.
        </Text>
        {milestone.achieved && (
          <>
            <Text style={styles.achievedDate}>
              Achieved on: {new Date(milestone.achieved_at!).toLocaleDateString()}
            </Text>
            <View style={styles.rewardedBadge}>
              <Text style={styles.rewardedText}>Milestone Achieved!</Text>
            </View>
          </>
        )}
        <TouchableOpacity
          style={styles.modalCloseButton}
          onPress={() => setShowMilestoneModal(false)}
        >
          <Text style={styles.modalCloseText}>Close</Text>
        </TouchableOpacity>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading achievements...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ResponsiveHeader
        title="Achievements"
        showBackButton={false}
        scrollY={scrollY}
      />

      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'badges' && styles.activeTab]}
          onPress={() => setActiveTab('badges')}
        >
          <Text style={[styles.tabText, activeTab === 'badges' && styles.activeTabText]}>
            Badges
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'milestones' && styles.activeTab]}
          onPress={() => setActiveTab('milestones')}
        >
          <Text style={[styles.tabText, activeTab === 'milestones' && styles.activeTabText]}>
            Milestones
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'badges' ? (
        <FlatList
          data={badges}
          renderItem={renderBadge}
          keyExtractor={(item) => item.id}
          numColumns={NUM_COLUMNS}
          contentContainerStyle={styles.badgesGrid}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: true }
          )}
          scrollEventThrottle={16}
        />
      ) : (
        <FlatList
          data={milestones}
          renderItem={renderMilestone}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.milestonesList}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: true }
          )}
          scrollEventThrottle={16}
        />
      )}

      <Modal
        visible={showBadgeModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowBadgeModal(false)}
      >
        <View style={styles.modalOverlay}>
          {selectedBadge && renderBadgeModal(selectedBadge)}
        </View>
      </Modal>

      <Modal
        visible={showMilestoneModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowMilestoneModal(false)}
      >
        <View style={styles.modalOverlay}>
          {selectedMilestone && renderMilestoneModal(selectedMilestone)}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#C41E3A',
  },
  tabText: {
    fontSize: 16,
    color: '#666',
  },
  activeTabText: {
    color: '#C41E3A',
    fontWeight: 'bold',
  },
  badgesGrid: {
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: BADGE_PADDING,
  },
  badgeContainer: {
    width: BADGE_SIZE,
    padding: BADGE_PADDING,
    backgroundColor: 'transparent',
  },
  badge: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    position: 'relative',
  },
  badgeLocked: {
    opacity: 0.8,
  },
  badgeUnlocked: {
    backgroundColor: '#E8F5E9',
  },
  unlockedOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
    zIndex: 1,
  },
  unlockedIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
    padding: 4,
    zIndex: 2,
  },
  badgeImage: {
    width: '100%',
    height: 90,
    backgroundColor: '#f0f0f0',
  },
  badgeContent: {
    padding: 8,
  },
  badgeName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
    textAlign: 'center',
  },
  badgeNameLocked: {
    color: '#999',
  },
  categoryContainer: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 4,
    alignSelf: 'center',
  },
  badgeCategory: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  emojiContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 8,
  },
  emoji: {
    fontSize: 16,
    marginHorizontal: 2,
  },
  progressText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    width: '80%',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  modalImage: {
    width: '100%',
    height: 150,
    borderRadius: 8,
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalCategoryContainer: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 12,
  },
  modalCategoryText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 12,
  },
  modalDescription: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
  },
  modalProgressTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  modalProgressText: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
  },
  modalCloseButton: {
    backgroundColor: '#C41E3A',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginTop: 16,
  },
  modalCloseText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  milestonesList: {
    padding: 16,
  },
  milestoneItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  achievedItem: {
    backgroundColor: '#E8F5E9',
    borderColor: '#C8E6C9',
  },
  milestoneHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  milestoneName: {
    fontSize: 16,
    fontWeight: '600',
  },
  milestoneMinutes: {
    fontSize: 14,
    color: '#666',
  },
  milestoneProgressContainer: {
    height: 8,
    backgroundColor: '#eee',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  milestoneProgressBar: {
    height: '100%',
    backgroundColor: '#C41E3A',
    borderRadius: 4,
  },
  achievedText: {
    color: '#4CAF50',
    fontWeight: '600',
    fontSize: 14,
  },
  achievedDate: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  rewardedBadge: {
    backgroundColor: '#E8F5E9',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  rewardedText: {
    color: '#4CAF50',
    fontWeight: '600',
    fontSize: 16,
  },
}); 