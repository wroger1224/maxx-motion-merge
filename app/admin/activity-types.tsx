import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator, Text, Modal } from 'react-native';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useUser } from '@/contexts/UserContext';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Button } from '@/components/ui/button';
import { showAlert } from '../utils/showAlert';

type ActivityType = {
  id: string;
  type_name: string;
  type_emoji: string;
  description: string;
};

export default function ActivityTypesScreen() {
  const { userProfile, loading: userLoading } = useUser();
  const [activityTypes, setActivityTypes] = useState<ActivityType[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingType, setEditingType] = useState<ActivityType | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [typeToDelete, setTypeToDelete] = useState<ActivityType | null>(null);
  
  // Form state
  const [typeName, setTypeName] = useState('');
  const [typeEmoji, setTypeEmoji] = useState('');
  const [typeDescription, setTypeDescription] = useState('');

  // Ref for ScrollView to scroll to top on edit
  const scrollRef = useRef<ScrollView>(null);

  // Redirect non-admin users
  useEffect(() => {
    if (!userLoading && userProfile && !userProfile.is_admin) {
      router.replace('/(tabs)');
    }
  }, [userProfile, userLoading]);

  // Fetch activity types
  useEffect(() => {
    if (userProfile?.is_admin) {
      fetchActivityTypes();
    }
  }, [userProfile]);

  const fetchActivityTypes = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('activity_types')
        .select('*')
        .order('type_name');

      if (error) throw error;
      setActivityTypes(data || []);
    } catch (err) {
      console.error('Error fetching activity types:', err);
      showAlert('Error', 'Failed to load activity types');
    } finally {
      setLoading(false);
    }
  };

  const handleAddNew = () => {
    setTypeName('');
    setTypeEmoji('');
    setTypeDescription('');
    setIsAdding(true);
    setEditingType(null);
  };

  const handleEdit = (type: ActivityType) => {
    setTypeName(type.type_name);
    setTypeEmoji(type.type_emoji);
    setTypeDescription(type.description);
    setEditingType(type);
    setIsAdding(false);
    // Scroll to top when editing
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ y: 0, animated: true });
    }
  };

  const handleDelete = (type: ActivityType) => {
    setTypeToDelete(type);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!typeToDelete) return;
    try {
      const { data, error, status } = await supabase
        .from('activity_types')
        .delete()
        .eq('id', typeToDelete.id);

      console.log('Delete response:', { data, error, status, id: typeToDelete.id });

      if (error) throw error;

      showAlert('Success', 'Activity type deleted successfully');
      setShowDeleteModal(false);
      setTypeToDelete(null);
      fetchActivityTypes();
    } catch (err) {
      console.error('Error deleting activity type:', err);
      showAlert('Error', 'Failed to delete activity type');
      setShowDeleteModal(false);
      setTypeToDelete(null);
    }
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setTypeToDelete(null);
  };

  const handleSubmit = async () => {
    if (!typeName || !typeEmoji) {
      showAlert('Error', 'Please fill in all required fields');
      return;
    }

    try {
      if (editingType) {
        // Update existing type
        const { error } = await supabase
          .from('activity_types')
          .update({
            type_name: typeName,
            type_emoji: typeEmoji,
            description: typeDescription
          })
          .eq('id', editingType.id);

        if (error) throw error;
        showAlert('Success', 'Activity type updated successfully');
      } else {
        // Add new type
        const { error } = await supabase
          .from('activity_types')
          .insert([{
            type_name: typeName,
            type_emoji: typeEmoji,
            description: typeDescription
          }]);

        if (error) throw error;
        showAlert('Success', 'Activity type added successfully');
      }

      // Reset form and refresh list
      setTypeName('');
      setTypeEmoji('');
      setTypeDescription('');
      setIsAdding(false);
      setEditingType(null);
      fetchActivityTypes();
    } catch (err) {
      console.error('Error saving activity type:', err);
      showAlert('Error', 'Failed to save activity type');
    }
  };

  const handleCancel = () => {
    setTypeName('');
    setTypeEmoji('');
    setTypeDescription('');
    setIsAdding(false);
    setEditingType(null);
  };

  if (userLoading || loading) {
    return (
      <ThemedView style={styles.container}>
        <ActivityIndicator size="large" color="#0a7ea4" />
      </ThemedView>
    );
  }

  // Only render the content if the user is an admin
  if (!userProfile?.is_admin) {
    return null;
  }

  return (
    <ScrollView style={styles.scrollView} ref={scrollRef}>
      <ThemedView style={styles.container}>
        <ThemedText style={styles.title}>Activity Types</ThemedText>

        {/* Add/Edit Form */}
        {(isAdding || editingType) && (
          <ThemedView style={styles.formContainer}>
            <ThemedText style={[styles.formTitle, styles.strongButtonText]}>
              {editingType ? 'Edit Activity Type' : 'Add New Activity Type'}
            </ThemedText>

            <TextInput
              style={styles.input}
              placeholder="Activity Name"
              value={typeName}
              onChangeText={setTypeName}
            />

            <TextInput
              style={styles.input}
              placeholder="Emoji (e.g., 🏃‍♂️)"
              value={typeEmoji}
              onChangeText={setTypeEmoji}
            />

            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Description (optional)"
              value={typeDescription}
              onChangeText={setTypeDescription}
              multiline
              numberOfLines={3}
            />

            <View style={styles.formButtons}>
              <Button
                label="Cancel"
                onPress={handleCancel}
                variant="secondary"
                style={{ marginRight: 8 }}
              />
              <Button
                label={editingType ? 'Update' : 'Add'}
                onPress={handleSubmit}
                variant="primary"
              />
            </View>
          </ThemedView>
        )}

        {/* Activity Types List */}
        <ThemedView style={styles.listContainer}>
          {!isAdding && !editingType && (
            <TouchableOpacity
              style={styles.addButton}
              onPress={handleAddNew}
            >
              <ThemedText style={styles.addButtonText}>+ Add Activity Type</ThemedText>
            </TouchableOpacity>
          )}

          {activityTypes.map((type) => (
            <ThemedView key={type.id} style={styles.typeItem}>
              <View style={styles.typeInfo}>
                <Text style={styles.typeEmoji}>{type.type_emoji}</Text>
                <View style={styles.typeDetails}>
                  <ThemedText style={styles.typeName}>{type.type_name}</ThemedText>
                  {type.description && (
                    <ThemedText style={styles.typeDescription}>{type.description}</ThemedText>
                  )}
                </View>
              </View>
              <View style={styles.typeActions}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleEdit(type)}
                >
                  <ThemedText style={[styles.actionButtonText, styles.strongButtonText]}>Edit</ThemedText>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, styles.deleteButton]}
                  onPress={() => handleDelete(type)}
                >
                  <ThemedText style={styles.deleteButtonText}>Delete</ThemedText>
                </TouchableOpacity>
              </View>
            </ThemedView>
          ))}
        </ThemedView>

        {/* Custom Delete Confirmation Modal */}
        <Modal
          visible={showDeleteModal}
          transparent
          animationType="fade"
          onRequestClose={cancelDelete}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Delete Activity Type</Text>
              <Text style={styles.modalMessage}>
                Are you sure you want to delete
                <Text style={{ fontWeight: 'bold' }}> {typeToDelete?.type_name}</Text>?
                This cannot be undone.
              </Text>
              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.modalCancelButton} onPress={cancelDelete}>
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.modalDeleteButton} onPress={confirmDelete}>
                  <Text style={styles.modalDeleteText}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    marginBottom: 24,
    fontWeight: "bold",
    fontSize:24,
  },
  formContainer: {
    marginBottom: 24,
    padding: 16,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
  },
  formTitle: {
    marginBottom: 16,
  },
  input: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 6,
    marginBottom: 12,
    fontSize: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  formButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
  },
  listContainer: {
    marginTop: 16,
  },
  addButton: {
    backgroundColor: '#0a7ea4',
    padding: 12,
    borderRadius: 6,
    alignItems: 'center',
    marginBottom: 16,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  typeItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  typeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  typeEmoji: {
    fontSize: 24,
    marginRight: 12,
  },
  typeDetails: {
    flex: 1,
  },
  typeName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 4,
  },
  typeDescription: {
    fontSize: 14,
    color: '#666',
  },
  typeActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    marginLeft: 8,
    backgroundColor: '#f0f0f0',
  },
  actionButtonText: {
    fontSize: 14,
    color: '#222',
  },
  deleteButton: {
    backgroundColor: '#ffebee',
  },
  deleteButtonText: {
    color: '#d32f2f',
    fontSize: 14,
  },
  strongButtonText: {
    fontWeight: 'bold',
    color: '#222',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 24,
    width: 320,
    maxWidth: '90%',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#C41E3A',
  },
  modalMessage: {
    fontSize: 16,
    color: '#222',
    marginBottom: 24,
    textAlign: 'center',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: 10,
    marginRight: 8,
    borderRadius: 6,
    backgroundColor: '#eee',
    alignItems: 'center',
  },
  modalDeleteButton: {
    flex: 1,
    paddingVertical: 10,
    marginLeft: 8,
    borderRadius: 6,
    backgroundColor: '#C41E3A',
    alignItems: 'center',
  },
  modalCancelText: {
    color: '#222',
    fontWeight: 'bold',
    fontSize: 16,
  },
  modalDeleteText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
}); 