import React from 'react';
import { Stack } from 'expo-router';
import { useUser } from '../../contexts/UserContext';
import { router } from 'expo-router';
import { ActivityIndicator, View, StyleSheet, TouchableOpacity } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { AdminNav } from '@/components/AdminNav';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Drawer } from 'expo-router/drawer';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/Colors';
import { IconSymbol } from '@/components/ui/IconSymbol';

export default function AdminLayout() {
  const { userProfile, loading } = useUser();
  const insets = useSafeAreaInsets();

  // Redirect non-admin users
  React.useEffect(() => {
    if (!loading && userProfile && !userProfile.is_admin) {
      router.replace('/(tabs)');
    }
  }, [userProfile, loading]);

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#0a7ea4" />
        <ThemedText style={styles.text}>Loading...</ThemedText>
      </View>
    );
  }

  // Don't render anything if user is not an admin
  if (!userProfile?.is_admin) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Drawer
        screenOptions={{
          headerRight: () => (
            <TouchableOpacity
              style={styles.exitButton}
              onPress={() => router.replace('/')}
            >
              <ThemedText style={styles.exitText}>Exit</ThemedText>
            </TouchableOpacity>
          ),
          drawerStyle: {
            width: "50%",
          },
        }}
      >
        <Drawer.Screen
          name="setup"
          options={{
            title: 'Setup',
          }}
        />
        <Drawer.Screen
          name="reports"
          options={{
            title: 'Reports',
          }}
        />
        <Drawer.Screen
          name="activity-types"
          options={{
            title: 'Activity Types',
          }}
        />
        <Drawer.Screen
          name="users"
          options={{
            title: 'User Management',
          }}
        />
        <Drawer.Screen
          name="create-event"
          options={{
            title: 'Create Event',
          }}
        />
        <Drawer.Screen
          name="edit-event"
          options={{
            title: 'Edit Event',
          }}
        />
        <Drawer.Screen
          name="create-team"
          options={{
            title: 'Create Team',
          }}
        />
        <Drawer.Screen
          name="edit-team"
          options={{
            title: 'Edit Team',
          }}
        />
        <Drawer.Screen
          name="manage-milestones"
          options={{
            title: 'Manage Milestones',
          }}
        />
      </Drawer>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  text: {
    marginTop: 20,
    fontSize: 16,
  },
  exitButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginRight: 16,
    backgroundColor: Colors.light.redOrange,
    borderRadius: 8,
  },
  exitText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
}); 