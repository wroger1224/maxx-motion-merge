import React from 'react';
import { StyleSheet, View, Pressable, Modal } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Image } from 'react-native';
import { TouchableOpacity } from 'react-native';

type MemberDetailsProps = {
  isVisible: boolean;
  onClose: () => void;
  member: {
    full_name: string;
    joined_at: string;
    rank: number;
    total_minutes: number;
    activities_logged: number;
    current_milestone: string;
    contribution_percentage: string;
    avatar_url: string;
  } | null;
}

export default function MemberDetails({ isVisible, onClose, member }: MemberDetailsProps) {
  if (!member) return null;
  
  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Image
              source={{ uri: member.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(member.full_name)}&background=random` }}
              style={styles.avatar}
            />
            <ThemedText style={styles.name}>{member.full_name}</ThemedText>
          </View>
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <ThemedText style={styles.statLabel}>Team Rank</ThemedText>
              <ThemedText style={styles.statValue}>#{member.rank}</ThemedText>
            </View>
            <View style={styles.statItem}>
              <ThemedText style={styles.statLabel}>Total Minutes</ThemedText>
              <ThemedText style={styles.statValue}>{member.total_minutes}</ThemedText>
            </View>
            <View style={styles.statItem}>
              <ThemedText style={styles.statLabel}>Activities Logged</ThemedText>
              <ThemedText style={styles.statValue}>{member.activities_logged}</ThemedText>
            </View>
          </View>
          <View style={styles.detailsContainer}>
            <View style={styles.detailItem}>
              <ThemedText style={styles.detailLabel}>Current Milestone</ThemedText>
              <ThemedText style={styles.detailValue}>{member.current_milestone}</ThemedText>
            </View>
            <View style={styles.detailItem}>
              <ThemedText style={styles.detailLabel}>Team Contribution</ThemedText>
              <ThemedText style={styles.detailValue}>{member.contribution_percentage}</ThemedText>
            </View>
            <View style={styles.detailItem}>
              <ThemedText style={styles.detailLabel}>Member Since</ThemedText>
              <ThemedText style={styles.detailValue}>
                {new Date(member.joined_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </ThemedText>
            </View>
          </View>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <ThemedText style={styles.closeButtonText}>Close</ThemedText>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '90%',
    maxWidth: 400,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  name: {
    fontSize: 22,
    fontWeight: '700',
    color: '#222',
    marginBottom: 2,
    textAlign: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 20,
    gap: 8,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  statLabel: {
    fontSize: 13,
    color: '#888',
    marginBottom: 2,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#222',
  },
  detailsContainer: {
    width: '100%',
    marginBottom: 16,
  },
  detailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 14,
    color: '#888',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#222',
  },
  closeButton: {
    backgroundColor: '#C41E3A',
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 16,
    width: '70%',
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
  },
}); 